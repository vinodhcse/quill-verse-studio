// File: utils/streamingHelper.ts
import { Together } from 'together-ai';
import { get_encoding } from '@dqbd/tiktoken';

interface StreamOptions {
  model: { name: string; type: 'json' | 'text'; temperature: number };
  systemPrompt: string;
  userPrompt: string;
  inputText: string[];
  responseType: 'json' | 'text';
  together: Together;
  userId: string;
  feature: string;
  onStream: (data: any) => void; // Callback for streaming data
}

function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

function countTokens(text: string | null | undefined): number {
  if (!text) return 0;
  try {
    const encoding = get_encoding("cl100k_base");
    const tokens = encoding.encode(text);
    return tokens.length || Math.ceil(countWords(text) * 0.75);
  } catch {
    return Math.ceil(countWords(text) * 0.75);
  }
}

async function updateUserCredits(userId: string, inputTokens: number, outputTokens: number, totalTokens: number) {
  console.log(`Updating credits for user ${userId}: Input = ${inputTokens}, Output = ${outputTokens}, Total = ${totalTokens}`);
  return true;
}

export async function streamToFrontend({
  model,
  systemPrompt,
  userPrompt,
  inputText,
  responseType,
  together,
  userId,
  feature,
  onStream
}: StreamOptions): Promise<{ success: boolean; retryFallback: boolean }> {
  let attempt = 0;
  let buffer = '';
  let originalParagraphResponse: string[][] = [];
  const maxRetries = 3;
  let retryFallback = false;
  let success = false;

  const initialSystemPromptTokens = countTokens(systemPrompt);
  const initialUserPromptTokens = countTokens(userPrompt);
  let totalInputTokens = initialSystemPromptTokens + initialUserPromptTokens;
  let max_tokens = Math.ceil((initialUserPromptTokens * 5) + (totalInputTokens * 1.4) + (initialUserPromptTokens * 1.4));
  let currentUserPrompt = userPrompt;
  console.log(`Initial tokens: System = ${initialSystemPromptTokens}, User = ${initialUserPromptTokens}, Total = ${totalInputTokens}, Max Tokens = ${max_tokens}`);
  console.log(`Resposne Type1: ${responseType}, Model Type: ${model.type}`);
  while (attempt < maxRetries) {
    attempt++;
    console.log(`Attempt ${attempt} for model ${model.name}`);
    try {
      const stream = await together.chat.completions.create({
        model: model.name,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: currentUserPrompt }
        ],
        temperature: model.temperature,
        // /max_tokens,
        stream: true,
        ...(responseType === 'json' && {
          response_format: {
            type: 'json_schema',
            schema: {
              type: 'object',
              properties: {
                rephrasedParagraphs: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      rephrasedParagraphIndex: { type: 'integer' },
                      rephrasedParagraphContent: { type: 'string' },
                      originalParagraphContents: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['rephrasedParagraphIndex', 'rephrasedParagraphContent', 'originalParagraphContents']
                  }
                }
              },
              required: ['rephrasedParagraphs']
            }
          }
        })
      });
      console.log(`Payload to model ${model.name}...`, {
        model: model.name,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: currentUserPrompt }
        ],
        temperature: model.temperature,
        max_tokens,
        stream: true,
        ...(responseType === 'json' && {
          response_format: {
            type: 'json_schema',
            schema: {
              type: 'object',
              properties: {
                rephrasedParagraphs: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      rephrasedParagraphIndex: { type: 'integer' },
                      rephrasedParagraphContent: { type: 'string' },
                      originalParagraphContents: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['rephrasedParagraphIndex', 'rephrasedParagraphContent', 'originalParagraphContents']
                  }
                }
              },
              required: ['rephrasedParagraphs']
            }
          }
        })
      });

      let buffer = '';
      let insideThink = false;
      let outputToUser = '';
      let thinkProcessed = false;
      let streamingStarted = false;
      let accumulatedOutput = '';
      for await (const chunk of stream) {
        const usage = chunk.usage;
        if (usage) {
          onStream({ done: true });
          await updateUserCredits(userId, usage.prompt_tokens || 0, usage.completion_tokens || 0, usage.total_tokens || 0);

          continue;
        }

        const finishReason = chunk.choices?.[0]?.finish_reason;
        if (finishReason === 'length') {
          console.warn(`Token limit reached on model ${model.name}`);
          const processedCount = originalParagraphResponse.length;
          const remainingParagraphs = inputText.slice(processedCount);
          const joined = remainingParagraphs.join('\n\n');
          currentUserPrompt = `<originalText>${joined}</originalText>`;

          const updatedUserPromptTokens = countTokens(currentUserPrompt);
          max_tokens = Math.ceil((updatedUserPromptTokens * 2) + (initialSystemPromptTokens * 1.4) + (updatedUserPromptTokens * 1.4));
          totalInputTokens = initialSystemPromptTokens + updatedUserPromptTokens;

          continue;
        } else if (finishReason === 'stop') {
          success = true;
          continue;
        }

        const content = chunk.choices?.[0]?.delta?.content || chunk.choices?.[0]?.text;
        if (!content) continue;

        buffer += content;
        accumulatedOutput += content;

        if (responseType === 'json') {
          const match = buffer.match(/\{\s*"rephrasedParagraphIndex"\s*:\s*\d+[^}]+\}/);
          if (match) {
            try {
              const parsed = JSON.parse(match[0]);
              onStream(parsed); // Use onStream callback
              buffer = '';
              originalParagraphResponse.push(parsed.originalParagraphContents);
              success = true;
            } catch {
              // wait for full JSON
            }
          }
        } else {
          if (feature === 'rephrase') {
            // buffer until end
          } else {

            //filter out empty content and content between <think> </think>
            if (!insideThink && !thinkProcessed) {
              // Try to detect "<think>" with optional leading whitespace/newlines
              const thinkStartMatch = buffer.match(/^\s*<think>/i);
              if (thinkStartMatch) {
                const matchLength = thinkStartMatch[0].length;
                buffer = buffer.slice(matchLength); // Skip the entire match
                insideThink = true;
                continue;
              }

              // If not starting a <think> block, stream out the first char
              outputToUser += buffer[0];
              onStream({ text: outputToUser }); // Use onStream callback
              buffer = buffer.slice(1);
            } else if (!thinkProcessed && insideThink) {
              // We're inside <think>: look for the closing tag
              const thinkEndIndex = buffer.indexOf('</think>');
              if (thinkEndIndex !== -1) {
                // Found closing tag: skip over it
                buffer = buffer.slice(thinkEndIndex + 8); // "</think>".length = 8
                
                insideThink = false;
                thinkProcessed = true; // Mark that we've processed a <think> block
                streamingStarted = true;
                accumulatedOutput = ''
                console.log("Processed <think> block, continuing streaming...", insideThink, thinkProcessed, streamingStarted);
              } else {
                // Still inside <think> but no closing tag yet, drop one char
                buffer = buffer.slice(1);
              }
            }
            if (!insideThink && thinkProcessed && buffer.length > 0) {
              accumulatedOutput += buffer;
              if (!streamingStarted) {
                streamingStarted = true;
                onStream({ text: buffer }); // Use onStream callback
                buffer = ''; // Clear buffer after streaming
              } else {
                onStream({ text: buffer }); // Use onStream callback
                buffer = ''; // Clear buffer after streaming
              }
            }
            
          }
        }
      }

      if (responseType === 'text' && !streamingStarted && accumulatedOutput.length > 0) {
        // If we have accumulated output but didn't stream it, send it now at the end of the chynk processing
        onStream({ text: accumulatedOutput }); // Use onStream callback
        success = true;        
      }

      if (responseType === 'text' && feature === 'rephrase' && buffer.length > 0) {
        const textResponse = {
          rephrasedParagraphIndex: 1,
          rephrasedParagraphContent: buffer,
          originalParagraphContents: inputText
        };
        onStream(textResponse); // Use onStream callback
        success = true;
      }

      break;
    } catch (err) {
      console.error(`Service error with model ${model.name}:`, err);
      retryFallback = true;
      break;
    }
  }

  return { success, retryFallback };
}
