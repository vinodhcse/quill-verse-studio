import Together from 'together-ai';
import { buildPromptForFeature } from './utils/promptBuilder';
import { getModelsByFeature } from './utils/modelSelector';
import { streamToFrontend } from './utils/streamingHelper';

const together = new Together({ apiKey: 'tgp_v1_ugulPht-_HbSS-WawrVxoK22k41Fab0oQX44pCuNeZg' });

export interface AIRequestPayload {
  feature: string;
  text: string[];
  textBefore?: string[];
  textAfter?: string[];
  promptContexts?: any[];
  customInstructions?: string;
}

export async function processAIRequest(payload: AIRequestPayload, signal: any, onStream: (data: any) => void, onError: (error: any) => void) {
  const { feature, text, textBefore, textAfter, promptContexts, customInstructions } = payload;

  if (!feature || !Array.isArray(text) || text.length === 0) {
    console.error('Invalid request payload:', payload);
    throw new Error('Invalid request payload');
  }

  const { systemPrompt, userPrompt, type } = buildPromptForFeature(feature, {
    text,
    textBefore: textBefore?.join('\n') || '',
    textAfter: textAfter?.join('\n') || '',
    promptContexts,
    customInstructions
  });

  const models = getModelsByFeature(feature);
  const model = models[0]; // Select the first model based on priority

  try {
    console.log(`Processing AI request for feature: ${feature}, model: ${model.name}, responseType: ${type}`);
    const { success } = await streamToFrontend({
      model,
      systemPrompt,
      userPrompt,
      inputText: text,
      responseType: type,
      together,
      feature,
      onStream,
      userId: 'default-user-id' // Replace with actual userId logic
    });

    if (!success) {
      throw new Error('Model failed to generate a successful response');
    }
  } catch (err) {
    
    console.error(`Failed model ${model.name}:`, err);
    onError(err);
  }
}
