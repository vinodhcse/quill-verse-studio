import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, RefreshCw, ArrowRight } from 'lucide-react';

import { useLLM } from '../context/LLMContext';

// --- Constant Function for Prompt Definition ---
const getRephrasePrompt = (originalText: string, textBefore:string, textAfter:string): string => {
  return `#Task: Rephrase

You are a master storyteller and literary editor. Rephrase the provided text between the <originalText> </originalText> tags, preserving all original meaning, plot, character intentions, and key details. 



**CRITICAL RULES (STRICTLY ADHERE):**
- **DO NOT add any new information, characters, events, or plot points.**
- **DO NOT create or invent any content that is not explicitly present in the original text, REGARDLESS OF ITS LENGTH.**
- **Maintain the original meaning, all factual details, and the exact intent of the text with absolute fidelity.**
- **The rephrased output must be a direct transformation of the input, not an expansion or a new narrative.**
- **For very short inputs (e.g., single sentences or short phrases), the rephrased output must remain concise and directly correspond to the length and scope of the original input. Do not elaborate or expand the narrative beyond the literal content provided.**
- **Do not rephrase the text within <textBefore> and </textBefore> tags or <textAfter> and </textAfter> tags. These are only for context.** 
- **Read through the text withn <textBefore> and </textBefore> tags or <textAfter> and </textAfter> tags before starting the rephrasng of the Original Text.** 

Your rephrasing must also:
- Enrich language with evocative vocabulary and sophisticated structures, *only* using details from the original text provided between the <originalText> </originalText> tags.
- Maintain the original tone, style, and voice of the text.
- Enhance prose rhythm, flow, and clarity *within the bounds of the original text's length and content*.
- Subtly weave a melancholic and somber tone (if applicable to the original).
- Maintain original paragraph structure (one rephrased paragraph per original).
- Ensure every original line is rephrased and the rephrased paragraph count is not more than the original paragraph count.
- Avoid using the exact same words or phrases as the original text.

Additional Context:
<textBefore>
  ${textBefore || ''}
</textBefore>

<textAfter>
  ${textAfter || ''}
</textAfter>

Ensure the rephrased text flows naturally and is grammatically correct. Please provide ONLY the rephrased content, enclosed within <RefinedText> and </RefinedText> tags. For example: "<RefinedText>Your rephrased content here.</RefinedText>".



<originalText>
 "${originalText}"
</originalText>`;


};
// --- End Prompt Function ---

// Helper function to chunk text based on one or more newlines, effectively treating
// each visual line break as a potential new "chunk" or paragraph.
const chunkText = (text: string): string[] => {
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const chunks = normalizedText
    .split(/\n+/) // Split by one or more newlines
    .map(p => p.trim())
    .filter(p => p !== '');

  console.log("Chunked Text (Count, Chunks):", chunks.length, chunks);
  return chunks;
};

// Helper function to extract text *only* between <RefinedText> delimiters for streaming display.
const extractRefinedTextStream = (text: string): string => {
  const openTag = '<RefinedText>';
  const closeTag = '</RefinedText>';

  const startIndex = text.indexOf(openTag);
  if (startIndex === -1) {
    return '';
  }

  const contentAfterOpenTag = text.substring(startIndex + openTag.length);
  const endIndex = contentAfterOpenTag.indexOf(closeTag);

  if (endIndex !== -1) {
    return contentAfterOpenTag.substring(0, endIndex).trim();
  } else {
    return contentAfterOpenTag.trim();
  }
};

// A final extraction function for when the LLM response is fully received
const extractFinalRefinedText = (text: string): string => {
  const match = text.match(/<RefinedText>(.*?)<\/RefinedText>/s);
  if (match && match[1]) {
    return match[1].trim();
  }
  console.warn("LLM did not wrap output in <RefinedText> tags. Returning raw output.");
  return text.trim();
};

interface ComparisonChunk {
  id: string;
  originalParagraph: string;
  rephrasedContent: string;
  isProcessing: boolean;
  isDone: boolean;
  error: string | null;
  isEditing: boolean;
  rawStreamedContent: string;
}

interface RephraseComparisonModalProps {
  textToRephrase: string[] , // Accepts either a single string or an array of strings;
  onClose: () => void;
  onCompleteRephrasing: (rephrasedText: string[]) => void;
}

const RephraseComparisonModal: React.FC<RephraseComparisonModalProps> = ({
  textToRephrase,
  onClose,
  onCompleteRephrasing,
}) => {
  const { llm, isReady } = useLLM();

  const [comparisonChunks, setComparisonChunks] = useState<ComparisonChunk[]>([]);
  const [isRephrasing, setIsRephrasing] = useState(false); // Overall rephrasing process
  const [currentProcessingChunkIndex, setCurrentProcessingChunkIndex] = useState(-1);
  const [overallProgress, setOverallProgress] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cancelRephrasingRef = useRef(false);

  // Determine if *any* chunk is currently processing (either initial batch or single re-rephrase)
  const isAnyChunkProcessing = comparisonChunks.some(chunk => chunk.isProcessing);
  const textBeforeLinesCount = 3;
  const textAfterLinesCount = 3;
  const startRephrasing = useCallback(async () => {
    if (!llm || !isReady) {
      console.error("LLM not ready or available to start rephrasing.");
      setIsRephrasing(false);
      return;
    }

    setIsRephrasing(true); // Indicate overall rephrasing started

    for (let i = 0; i < comparisonChunks.length; i++) {
      if (cancelRephrasingRef.current) {
        console.log("Rephrasing loop interrupted by cancellation signal.");
        break;
      }

      setCurrentProcessingChunkIndex(i);

      setComparisonChunks((prevChunks) =>
        prevChunks.map((chunk, idx) =>
          idx === i ? { ...chunk, isProcessing: true, isDone: false, error: null, rephrasedContent: '', rawStreamedContent: '' } : chunk
        )
      );

      let textBefore = '';
      let textAfter = '';
      const textBeforeLinesCount = 3; // As per your example
      const textAfterLinesCount = 3;  // Let's assume this for textAfter

      const startBeforeIndex = Math.max(0, i - textBeforeLinesCount);
      textBefore = comparisonChunks.slice(startBeforeIndex, i)
                                  .map(chunk => chunk.originalParagraph)
                                  .join('\n');

      const endAfterIndex = Math.min(comparisonChunks.length, i + textAfterLinesCount + 1); // +1 because slice end is exclusive
      textAfter = comparisonChunks.slice(i + 1, endAfterIndex)
                                  .map(chunk => chunk.originalParagraph)
                                  .join('\n');

                                    
      // --- Use the prompt function here ---
      const prompt = getRephrasePrompt(comparisonChunks[i].originalParagraph, textBefore, textAfter);
      // --- End Use prompt function ---
      console.log(`Starting rephrasing for chunk ${i + 1}/${comparisonChunks.length}:`, prompt);
      try {
        await new Promise<void>((resolve) => {
          llm.generateResponse(
            prompt,
            (partialResult, done) => {
              if (cancelRephrasingRef.current) {
                console.log("LLM generation callback interrupted by cancellation for chunk", i);
                resolve();
                return;
              }

              setComparisonChunks((prevChunks) => {
                const updatedChunks = [...prevChunks];
                const currentChunk = updatedChunks[i];

                const newRawContent = currentChunk.rawStreamedContent + partialResult;
                const newRephrasedContent = extractRefinedTextStream(newRawContent);

                updatedChunks[i] = {
                  ...currentChunk,
                  rawStreamedContent: newRawContent,
                  rephrasedContent: newRephrasedContent,
                };

                if (done) {
                  const finalRephrasedContent = extractFinalRefinedText(newRawContent);
                  console.log(`Final rephrased content for chunk ${i + 1}:`, finalRephrasedContent);
                  updatedChunks[i] = {
                    ...updatedChunks[i],
                    isProcessing: false,
                    isDone: true,
                    rephrasedContent: finalRephrasedContent,
                  };
                  setOverallProgress(((i + 1) / comparisonChunks.length) * 100);
                  resolve();
                }
                return updatedChunks;
              });
            }
          );
        });
      } catch (error: any) {
        console.error(`Error rephrasing chunk ${i + 1}:`, error);
        setComparisonChunks((prevChunks) =>
          prevChunks.map((chunk, idx) =>
            idx === i ? { ...chunk, isProcessing: false, isDone: true, error: error.message } : chunk
          )
        );
        resolve();
      }
    }

    if (!cancelRephrasingRef.current) {
      setIsRephrasing(false); // Overall rephrasing completed
      setOverallProgress(100);
    }
    setCurrentProcessingChunkIndex(-1);
  }, [comparisonChunks, llm, isReady]);


  useEffect(() => {
    // This effect handles the initial rephrasing of all chunks.
    // It should only run if `isRephrasing` is true (set from `textToRephrase` effect)
    // and no chunk is currently marked as processing, preventing re-triggering mid-process.
    if (isRephrasing && comparisonChunks.length > 0 && currentProcessingChunkIndex === -1 && isReady) {
      const anyChunkIsCurrentlyProcessing = comparisonChunks.some(chunk => chunk.isProcessing);
      if (!anyChunkIsCurrentlyProcessing) {
        startRephrasing();
      }
    }
  }, [isRephrasing, comparisonChunks.length, currentProcessingChunkIndex, isReady, startRephrasing]);

  useEffect(() => {
    cancelRephrasingRef.current = false;

    if (textToRephrase) {
      const chunks = textToRephrase;
      console.log("Initial Chunks Generated:", chunks.length, "chunks.");
      if (chunks.length > 0) {
          console.log("First Chunk Sample:", chunks[0].substring(0, Math.min(chunks[0].length, 100)) + (chunks[0].length > 100 ? '...' : ''));
      }


      const initialComparisonState: ComparisonChunk[] = chunks.map((chunk, index) => ({
        id: `chunk-${index}-${Date.now()}`,
        originalParagraph: chunk,
        rephrasedContent: '',
        isProcessing: false,
        isDone: false,
        error: null,
        isEditing: false,
        rawStreamedContent: '',
      }));
      setComparisonChunks(initialComparisonState);

      // Set overall rephrasing state to true to initiate the process
      if (initialComparisonState.length > 0) {
        setIsRephrasing(true); // This kicks off the overall batch rephrasing
      }
    } else {
      setIsRephrasing(false);
      setCurrentProcessingChunkIndex(-1);
      setOverallProgress(0);
      setComparisonChunks([]);
    }

    return () => {
      console.log("Cleaning up rephrasing process...");
      cancelRephrasingRef.current = true;
      setIsRephrasing(false);
      setCurrentProcessingChunkIndex(-1);
      setOverallProgress(0);
      setComparisonChunks([]);
    };
  }, [textToRephrase, isReady]);


  const handleReRephrase = useCallback(async (chunkId: string) => {
    if (!llm || !isReady || isAnyChunkProcessing) { // Disable if LLM not ready or another chunk is processing
      console.warn("Cannot re-rephrase: LLM not ready or another chunk is already processing.");
      return;
    }

    if (cancelRephrasingRef.current) {
        console.warn("Attempted re-rephrase cancelled due to modal state.");
        return;
    }

    const chunkIndex = comparisonChunks.findIndex(chunk => chunk.id === chunkId);
    if (chunkIndex === -1) return;

    // Set ONLY this chunk to processing, and ensure overall isRephrasing is temporarily true
    // to disable other buttons
    setComparisonChunks(prevChunks =>
      prevChunks.map((chunk, idx) =>
        idx === chunkIndex
          ? { ...chunk, rephrasedContent: '', isProcessing: true, isDone: false, error: null, isEditing: false, rawStreamedContent: '' }
          : chunk // Other chunks remain as they are
      )
    );
    setCurrentProcessingChunkIndex(chunkIndex); // Set this as the currently processing chunk
    setIsRephrasing(true); // Temporarily set overall rephrasing true to disable other buttons

    const chunkToRephrase = comparisonChunks[chunkIndex];

    let textBefore = '';
    let textAfter = '';
    const textBeforeLinesCount = 3; // As per your example
    const textAfterLinesCount = 3;  // Let's assume this for textAfter

    const startBeforeIndex = Math.max(0, chunkIndex - textBeforeLinesCount);
    textBefore = comparisonChunks.slice(startBeforeIndex, chunkIndex)
                                .map(chunk => chunk.originalParagraph)
                                .join('\n');

    const endAfterIndex = Math.min(comparisonChunks.length, chunkIndex + textAfterLinesCount + 1); // +1 because slice end is exclusive
    textAfter = comparisonChunks.slice(chunkIndex + 1, endAfterIndex)
                                .map(chunk => chunk.originalParagraph)
                                .join('\n');

    // --- Use the prompt function here ---
    const prompt = getRephrasePrompt(chunkToRephrase.originalParagraph, textBefore, textAfter);
    // --- End Use prompt function ---

    try {
        await new Promise<void>((resolve) => {
            llm.generateResponse(
                prompt,
                (partialContent, done) => {
                    if (cancelRephrasingRef.current) {
                        console.log("Single re-rephrase callback interrupted by global cancellation.");
                        setComparisonChunks(prevChunks =>
                            prevChunks.map((chunk, idx) =>
                                idx === chunkIndex ? { ...chunk, isProcessing: false, isDone: false } : chunk
                            )
                        );
                        setCurrentProcessingChunkIndex(-1);
                        setIsRephrasing(false); // Reset overall rephrasing
                        resolve();
                        return;
                    }

                    setComparisonChunks(prevChunks => {
                      const updatedChunks = [...prevChunks];
                      const currentChunk = updatedChunks[chunkIndex];

                      const newRawContent = currentChunk.rawStreamedContent + partialContent;
                      const newRephrasedContent = extractRefinedTextStream(newRawContent);

                      updatedChunks[chunkIndex] = {
                        ...currentChunk,
                        rawStreamedContent: newRawContent,
                        rephrasedContent: newRephrasedContent,
                      };

                      if (done) {
                        const finalRephrasedContent = extractFinalRefinedText(newRawContent);
                        updatedChunks[chunkIndex] = {
                          ...updatedChunks[chunkIndex],
                          isProcessing: false,
                          isDone: true,
                          rephrasedContent: finalRephrasedContent,
                        };
                        resolve();
                      }
                      return updatedChunks;
                    });
                }
            );
        });
    } catch (error: any) {
        console.error(`Error re-rephrasing chunk ${chunkIndex + 1}:`, error);
        setComparisonChunks(prevChunks =>
            prevChunks.map((chunk, idx) =>
                idx === chunkIndex ? { ...chunk, isProcessing: false, isDone: true, error: error.message } : chunk
            )
        );
    } finally {
        setCurrentProcessingChunkIndex(-1); // Reset current index after this specific chunk is done
        setIsRephrasing(false); // Reset overall rephrasing state
    }
  }, [comparisonChunks, llm, isReady, isAnyChunkProcessing]); // Added isAnyChunkProcessing to dependency array


  const handleRetainOriginal = useCallback((chunkId: string) => {
    setComparisonChunks(prev =>
      prev.map(chunk =>
        chunk.id === chunkId
          ? { ...chunk, rephrasedContent: chunk.originalParagraph, isDone: true, isProcessing: false, error: null, isEditing: false }
          : chunk
      )
    );
  }, []);

  const toggleEditing = useCallback((chunkId: string, editing: boolean) => {
    setComparisonChunks(prev =>
      prev.map(chunk =>
        chunk.id === chunkId ? { ...chunk, isEditing: editing } : chunk
      )
    );
  }, []);

  const handleApplyRephrasing = () => {
    const fullRephrasedText = comparisonChunks
      .filter((chunk) => chunk.isDone && !chunk.error)
      .map((chunk) => chunk.rephrasedContent);
    console.log("Final Rephrased Text:", fullRephrasedText);
    onCompleteRephrasing(fullRephrasedText);
    onClose();
  };

  // Check if all chunks are done (either successfully rephrased, or manually retained, or have an error)
  const allChunksInitiallyProcessed = comparisonChunks.length > 0 && comparisonChunks.every(c => c.isDone || c.error);

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col transform scale-95 animate-scale-in">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Rephrase & Compare</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors duration-200">
            <X size={28} />
          </button>
        </div>

        {/* Progress Bar */}
        {isRephrasing && comparisonChunks.length > 0 && (
          <div className="w-full bg-blue-100 h-2">
            <div
              className="bg-blue-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        )}

        {/* Sticky Table Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-20 shadow-sm">
          <div className="flex w-full">
            <div className="w-1/2 p-4 font-bold text-gray-700 text-lg border-r border-gray-200">Original</div>
            <div className="w-1/2 p-4 font-bold text-gray-700 text-lg">Rephrased</div>
          </div>
        </div>

        {/* Comparison Chunks Container */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
          {comparisonChunks.length === 0 && textToRephrase && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              {!isReady ? (
                <>
                  <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
                  <p className="text-xl">Initializing LLM...</p>
                </>
              ) : (
                <>
                  <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
                  <p className="text-xl">Preparing text for rephrasing...</p>
                </>
              )}
            </div>
          )}

          {comparisonChunks.length > 0 &&
            comparisonChunks
              .filter((chunk) => chunk.isProcessing || chunk.isDone) // Only render visible chunks
              .map((chunk, chunkIdx) => {
                const isCurrentChunkProcessing = chunk.isProcessing && (chunkIdx === currentProcessingChunkIndex);
                // Disable individual rephrase buttons if overall batch rephrasing is still active
                // OR if another chunk is currently being re-rephrased.
                const disableIndividualRephrase = isRephrasing || isAnyChunkProcessing;


                return (
                  <div
                    key={chunk.id}
                    className={`flex border rounded-lg shadow-md overflow-hidden transition-all duration-300 transform hover:scale-[1.005] relative
                      ${isCurrentChunkProcessing ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 bg-white'}
                      ${chunk.isDone && !chunk.isProcessing && !chunk.error ? 'border-green-400 bg-green-50 shadow-lg' : ''}
                      ${chunk.error ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : ''}
                    `}
                  >
                    {/* Left Pane: Original Paragraph */}
                    <div className="w-1/2 p-5 border-r border-gray-200 bg-gray-50 text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
                      {chunk.originalParagraph}
                    </div>

                    {/* Central Action Buttons - Enhanced Spacing and Styling */}
                    <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 flex flex-col justify-center items-center z-10 space-y-4 px-4">
                        <button
                            onClick={() => handleReRephrase(chunk.id)}
                            className={`p-3 rounded-full shadow-lg transition-all duration-300 ease-in-out
                                ${disableIndividualRephrase ? 'bg-blue-300 text-white cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-600 hover:text-white hover:scale-110'}
                                ${isCurrentChunkProcessing ? 'animate-pulse' : ''}
                            `}
                            title="Rephrase this chunk"
                            disabled={disableIndividualRephrase} // Disabled if overall rephrasing or any single re-rephrasing is active
                        >
                            <RefreshCw size={20} />
                        </button>
                        <button
                            onClick={() => handleRetainOriginal(chunk.id)}
                            className={`p-3 rounded-full shadow-lg transition-all duration-300 ease-in-out
                                ${disableIndividualRephrase ? 'bg-gray-300 text-white cursor-not-allowed' : 'bg-white text-gray-600 hover:bg-gray-600 hover:text-white hover:scale-110'}
                            `}
                            title="Retain Original Text"
                            disabled={disableIndividualRephrase} // Disabled if overall rephrasing or any single re-rephrasing is active
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>

                    {/* Right Pane: Rephrased Content */}
                    <div className="w-1/2 p-5 relative">
                      {isCurrentChunkProcessing && chunk.rephrasedContent.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-400 animate-pulse">
                          <Loader2 className="w-6 h-6 animate-spin mr-3 text-blue-400" />
                          Generating...
                        </div>
                      ) : chunk.error ? (
                        <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
                          <p className="font-semibold mb-2">Error rephrasing this section:</p>
                          <p>{chunk.error}</p>
                          <button
                            onClick={() => handleReRephrase(chunk.id)}
                            className="mt-3 text-blue-700 hover:underline flex items-center transition-colors duration-200"
                            disabled={disableIndividualRephrase} // Ensure this is also disabled when overall process is active
                          >
                            <RefreshCw size={16} className="mr-2" /> Try Rephrasing Again
                          </button>
                        </div>
                      ) : (
                        chunk.isEditing ? (
                          <textarea
                            value={chunk.rephrasedContent}
                            onChange={(e) =>
                              setComparisonChunks((prev) =>
                                prev.map((c) =>
                                  c.id === chunk.id ? { ...c, rephrasedContent: e.target.value } : c
                                )
                              )
                            }
                            onBlur={() => toggleEditing(chunk.id, false)}
                            className="w-full h-full min-h-[150px] p-2 border border-blue-300 rounded-md resize-y text-gray-700 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-inner"
                            autoFocus
                            style={{ minHeight: '150px' }}
                          />
                        ) : (
                          <div
                            onClick={() => {
                                if (!isCurrentChunkProcessing && !isAnyChunkProcessing) { // Only allow editing if not processing
                                    toggleEditing(chunk.id, true);
                                }
                            }}
                            className={`w-full h-full min-h-[150px] p-2 border border-transparent rounded-md text-gray-700 text-base leading-relaxed whitespace-pre-wrap cursor-text
                                ${isCurrentChunkProcessing || isAnyChunkProcessing ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100 transition-colors duration-200 shadow-inner'}
                            `}
                            style={{ minHeight: '150px' }}
                          >
                            {chunk.rephrasedContent || (isCurrentChunkProcessing ? '' : "Click to edit or rephrase.")}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 flex justify-end items-center bg-white">
          <button
            onClick={handleApplyRephrasing}
            // Disable "Apply" if any chunk is still processing (overall or single re-rephrase)
            // or if LLM not ready, or if not all chunks have reached a final state.
            disabled={isAnyChunkProcessing || !isReady || !allChunksInitiallyProcessed || comparisonChunks.length === 0}
            className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-300 ease-in-out shadow-lg
              ${(isAnyChunkProcessing || !isReady || !allChunksInitiallyProcessed || comparisonChunks.length === 0) ? 'bg-blue-400 cursor-not-allowed opacity-70' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'}
              flex items-center justify-center
            `}
          >
            {isAnyChunkProcessing && <Loader2 className="w-5 h-5 mr-3 animate-spin" />}
            {isAnyChunkProcessing ? 'Processing Chunks...' : 'Apply Rephrasing'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default RephraseComparisonModal;