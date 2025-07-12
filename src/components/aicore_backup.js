// This service now connects to a local Ollama instance using a two-step process.
const OLLAMA_API_URL = "http://localhost:11434/api/generate";
const OLLAMA_MODEL = "mistral";

export interface MappingResult {
  suggested_paragraph: string;
  original_indices: number[];
}

// --- PROMPT FOR STEP 1: REPHRASING ---
const rephraseSystemPrompt = `You are an expert story editor. Rephrase the user's text to have a more melancholic and somber tone.
Preserve the core meaning and narrative intent. Return only the rephrased text and nothing else.`;

// --- PROMPT FOR STEP 2: MAPPING ---
const mappingSystemPrompt = `You are a text analysis expert. Your task is to map a rephrased text back to an original set of paragraphs.
I will provide you with an 'original_paragraphs' array and a 'rephrased_text' string.
You MUST produce a valid JSON object with a single key: "mapped_suggestions".
The value of "mapped_suggestions" MUST be an array of objects.
Each object in the array represents a paragraph from the 'rephrased_text' and MUST have the following keys:
1. "suggested_paragraph": A string containing one paragraph from the rephrased text.
2. "original_indices": An array of numbers. Each number is the zero-based index of a paragraph from the 'original_paragraphs' array that corresponds to the 'suggested_paragraph'.

RULES:
- Every paragraph from the 'rephrased_text' must appear exactly once in the 'mapped_suggestions' array, in the correct order.
- If a suggested paragraph corresponds to multiple original paragraphs (a merge), include all their indices in 'original_indices'.
- If a suggested paragraph is entirely new (a hallucination), 'original_indices' should be an empty array [].
- If a suggested paragraph corresponds to a single original paragraph, 'original_indices' should be an array with one number, e.g., [2].
- An original paragraph can be implicitly dropped if it does not map to any suggested paragraph.`;

const mappingUserPrompt = (originalParagraphs: string[], rephrasedText: string): string => {
    return `Here is the data to process:
    ${JSON.stringify({ original_paragraphs: originalParagraphs, rephrased_text: rephrasedText }, null, 2)}`;
};

async function callOllama(systemPrompt: string, userPrompt: string, format: 'json' | 'text' = 'text'): Promise<any> {
    const payload: { [key: string]: any } = {
        model: OLLAMA_MODEL,
        system: systemPrompt,
        prompt: userPrompt,
        stream: false,
    };

    if (format === 'json') {
        payload.format = 'json';
    }

     const response = await fetch(OLLAMA_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Ollama API Error Response:", errorBody);
        throw new Error(`Ollama API returned an error: ${response.statusText}. Is the server running?`);
    }

    return response.json();
}

export async function getRephrasedText(originalParagraphs: string[]): Promise<MappingResult[]> {
    if (originalParagraphs.length === 0) return [];
    
    try {
        // Step 1: Get rephrased text as a whole block.
        const fullTextToRephrase = originalParagraphs.join('\n\n');
        const rephraseResponse = await callOllama(rephraseSystemPrompt, fullTextToRephrase, 'text');
        const rephrasedText = rephraseResponse.response;

        if (!rephrasedText || typeof rephrasedText !== 'string' || rephrasedText.trim() === '') {
            return []; // AI returned nothing, so all originals were dropped.
        }
        console.log('rephraseResponse', rephraseResponse);
        console.log('rephrasedText', rephrasedText);
        // Step 2: Ask the AI to map the rephrased text back to the original paragraphs.
        const userPromptForMapping = mappingUserPrompt(originalParagraphs, rephrasedText);
        const mappingResponse = await callOllama(mappingSystemPrompt, userPromptForMapping, 'json');
        
        console.log('mappingResponse', mappingResponse);
        
        // --- NEW ROBUST PARSING LOGIC ---
        let jsonString = mappingResponse.response;
        if (!jsonString || typeof jsonString !== 'string') {
            throw new Error("AI returned an empty or invalid response for mapping.");
        }
        console.log('mappingResponse jsonString', jsonString);
        // Strip markdown fences that models sometimes add
        const fenceRegex = /^```(?:json)?\s*\n?(.*)\n?\s*```$/s;
        const match = jsonString.trim().match(fenceRegex);
        if (match && match[1]) {
            jsonString = match[1].trim();
        }

        let parsedData;
        try {
            parsedData = JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse JSON response from AI.", { jsonString, error: e });
            throw new Error("AI returned a non-JSON string. Check Ollama logs for details.");
        }
        console.log('mappingResponse parsedData', parsedData);
        // Check for the two valid structures: { mapped_suggestions: [...] } or [...]
        if (parsedData && Array.isArray(parsedData.mapped_suggestions)) {
            // Structure 1: The model followed instructions perfectly.
            return parsedData.mapped_suggestions;
        } else if (Array.isArray(parsedData)) {
            // Structure 2: The model returned the array directly.
            const isValid = parsedData.every(item => 
                item && typeof item.suggested_paragraph === 'string' && Array.isArray(item.original_indices)
            );
            if (isValid) {
                return parsedData;
            } else {
                console.error("AI returned a JSON array, but its items have an invalid structure.", { receivedData: parsedData });
                throw new Error("AI returned a JSON array with malformed items.");
            }
        } else {
            // If neither structure matches, it's an invalid response.
            console.error("Invalid structure in AI mapping response.", {
                receivedData: parsedData,
                originalString: jsonString,
            });
            throw new Error("AI response did not return the expected 'mapped_suggestions' array or a valid array structure.");
        }
        // --- END OF NEW LOGIC ---

    } catch (error) {
        console.error("Error during the two-step rephrasing process:", error);
         if (error instanceof TypeError) { // Network errors
             throw new Error("Failed to connect to Ollama. Please ensure the Ollama server is running at " + OLLAMA_API_URL);
        }
        // Re-throw specific errors or a generic one
        throw error instanceof Error ? error : new Error("Failed to get rephrasing from AI. Check the console for more details.");
    }
}