import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty, CommandGroup } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, RefreshCw, Check, X, ChevronLeft, ChevronRight, Sparkles, Plus, Search, Palette, Wand2, ArrowRight, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBookContext } from '@/lib/BookContextProvider';
import { TauriLLMService, RephraseRequest } from '@/lib/tauriService';

interface RephrasedParagraph {
  rephrasedParagraph: string;
  originalParagraph: string[];
  selected: boolean;
  edited?: boolean;
  customText?: string;
  diff?: string;
}

interface ContextItem {
  id: string;
  name: string;
  type: string;
  prompt?: string;
}

interface AIRephraserModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  textBlocks: string[];
  bookId: string;
  versionId: string;
  chapterId: string;
  onApplyChanges: (newText: string) => void;
  editor?: any;
}

const escapeQuote = (text: string): string => {
  return text.replace(/"/g, '\\"').replace(/'/g, "\\'");
};

const extractContextLines = (editor: any, currentSelection: any, lineCount: number, direction: 'before' | 'after'): string => {
  if (!editor) return '';
  
  const { state } = editor;
  const { doc } = state;
  const lines: string[] = [];
  const seenLines = new Set<string>();
  
  if (direction === 'before') {
    // Extract text before the selection
    if (currentSelection.from > 0) {
      const beforeText = doc.textBetween(0, currentSelection.from, '\n');
      const beforeLines = beforeText.split('\n')
        .map(line => line.trim())
        .filter(line => {
          // Filter out empty lines, headings, and very short lines
          return line && 
                 line.length > 10 && 
                 !line.startsWith('#') && 
                 !line.startsWith('"') && 
                 !line.startsWith("'") &&
                 !seenLines.has(line);
        })
        .slice(-lineCount); // Get the last N lines
      
      beforeLines.forEach(line => {
        seenLines.add(line);
        lines.push(line);
      });
    }
  } else {
    // Extract text after the selection
    if (currentSelection.to < doc.content.size) {
      const afterText = doc.textBetween(currentSelection.to, doc.content.size, '\n');
      const afterLines = afterText.split('\n')
        .map(line => line.trim())
        .filter(line => {
          // Filter out empty lines, headings, and very short lines
          return line && 
                 line.length > 10 && 
                 !line.startsWith('#') && 
                 !line.startsWith('"') && 
                 !line.startsWith("'") &&
                 !seenLines.has(line);
        })
        .slice(0, lineCount); // Get the first N lines
      
      afterLines.forEach(line => {
        seenLines.add(line);
        lines.push(line);
      });
    }
  }
  
  return lines.join('\n');
};

export const AIRephraserModal: React.FC<AIRephraserModalProps> = ({
  isOpen,
  onClose,
  selectedText,
  textBlocks,
  bookId,
  versionId,
  chapterId,
  onApplyChanges,
  editor,
}) => {
  const { state, updateChapterContent } = useBookContext();
  const [step, setStep] = useState<'setup' | 'results' | 'comparison'>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('Make the tone more engaging and vivid.');
  const [llmModel, setLlmModel] = useState('local-gemma');
  const [showDifference, setShowDifference] = useState(true);
  const [noChangeWords, setNoChangeWords] = useState('');
  const [rephrasedResults, setRephrasedResults] = useState<RephrasedParagraph>({
    rephrasedParagraph: '',
    originalParagraph: [],
    selected: false,
  });
  const [diffResults, setDiffResults] = useState<RephrasedParagraph[]>([]);
  const [diffStreamingComplete, setDiffStreamingComplete] = useState(false);
  const [llmReady, setLlmReady] = useState(false);
  
  // Context selection state
  const [selectedPlotNodes, setSelectedPlotNodes] = useState<ContextItem[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<ContextItem[]>([]);
  const [selectedWorldObjects, setSelectedWorldObjects] = useState<ContextItem[]>([]);
  const [plotNodeSearch, setPlotNodeSearch] = useState('');
  const [characterSearch, setCharacterSearch] = useState('');
  const [worldObjectSearch, setWorldObjectSearch] = useState('');
  const [showPlotSearch, setShowPlotSearch] = useState(false);
  const [showCharacterSearch, setShowCharacterSearch] = useState(false);
  const [showWorldSearch, setShowWorldSearch] = useState(false);

  // Mock data - in real implementation, these would come from the book context
  const plotNodes: ContextItem[] = state.currentBook?.plotCanvasNodes?.map(node => ({
    id: node.id,
    name: node.name,
    type: node.type,
    prompt: `${node.type}: ${node.name} - ${node.detail || ''} Goal: ${node.goal || 'N/A'}`
  })) || [];

  const characters: ContextItem[] = state.currentBook?.characters?.map(char => ({
    id: char.id,
    name: char.name,
    type: 'Character',
    prompt: `Character: ${char.name} - ${char.summary || ''} Goals: ${char.goals?.join(', ') || 'N/A'}`
  })) || [];

  const worldObjects: ContextItem[] = state.currentBook?.worldObjects?.map(obj => ({
    id: obj.id,
    name: obj.name,
    type: obj.type || 'Object',
    prompt: `${obj.type || 'Object'}: ${obj.name} - ${obj.description || ''}`
  })) || [];

  // Available LLM models
  const availableModels = [
    { value: 'local-gemma', label: 'Local Gemma (Recommended)' },
    { value: 'local-mistral', label: 'Local Mistral' },
  ];

  // Pre-configured no-change words
  const preConfiguredWords = [
    'character names', 'place names', 'brand names', 'technical terms',
    'dates', 'numbers', 'proper nouns', 'dialogue tags'
  ];

  // Check LLM status on mount
  useEffect(() => {
    const checkLLMStatus = async () => {
      const status = await TauriLLMService.checkLLMStatus();
      setLlmReady(status);
      
      if (!status) {
        // Try to initialize if not ready
        const initialized = await TauriLLMService.initializeLLM();
        setLlmReady(initialized);
      }
    };
    
    if (isOpen) {
      checkLLMStatus();
    }
  }, [isOpen]);

  const handleRephrase = async () => {
    if (!llmReady) {
      console.error('LLM not ready yet');
      return;
    }

    setIsLoading(true);
    try {
      // Process textBlocks to create textToRephrase array - remove duplicates
      const seenTexts = new Set<string>();
      const textToRephrase = textBlocks
        .map(block => block.trim())
        .filter(text => {
          if (text.length > 0 && !seenTexts.has(text)) {
            seenTexts.add(text);
            return true;
          }
          return false;
        });

      // Build instructions with context
      let enhancedInstructions = customInstructions;
      
      // Add context from selected items
      if (selectedPlotNodes.length > 0 || selectedCharacters.length > 0 || selectedWorldObjects.length > 0) {
        enhancedInstructions += '\n\nContext for rephrasing:\n';
        
        selectedPlotNodes.forEach(node => {
          enhancedInstructions += `Plot: ${node.prompt}\n`;
        });
        
        selectedCharacters.forEach(char => {
          enhancedInstructions += `Character: ${char.prompt}\n`;
        });
        
        selectedWorldObjects.forEach(obj => {
          enhancedInstructions += `World: ${obj.prompt}\n`;
        });
      }

      if (noChangeWords) {
        enhancedInstructions += `\n\nDo not change these words/phrases: ${noChangeWords}`;
      }

      const request: RephraseRequest = {
        text_to_rephrase: textToRephrase,
        custom_instructions: enhancedInstructions,
        llm_model: llmModel,
      };

      console.log('Local rephrase request:', request);
      const response = await TauriLLMService.rephraseText(request);

      if (!response.success || !response.rephrased_text) {
        console.error('Rephrase failed:', response.error);
        return;
      }

      const results: RephrasedParagraph = {
        originalParagraph: textToRephrase,
        rephrasedParagraph: response.rephrased_text,
        selected: true,
        edited: false,
      };

      setRephrasedResults(results);
      setStep('comparison');
    } catch (error) {
      console.error('Failed to rephrase text:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiffChecker = async () => {
    setIsLoading(true);
    setDiffStreamingComplete(false);
    setDiffResults([]); // Clear previous results
    setStep('results');
    try {
      const payload = {
        originalText: rephrasedResults.originalParagraph.join('\n'),
        newText: rephrasedResults.rephrasedParagraph,
      };
      console.log('Diff checker payload:', payload);
       const token = localStorage.getItem('token');
      

      const response = await fetch('http://localhost:4000/api/ai/diffChecker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Connection': 'keep-alive',
        },
        body: JSON.stringify(payload),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const parsedChunk = JSON.parse(chunk);
        console.log('Parsed diff chunk:', parsedChunk);
        
        if (parsedChunk.done) {
          setDiffStreamingComplete(true);
          break;
        }

        setDiffResults((prev) => [
          ...prev,
          {
            rephrasedParagraph: parsedChunk.newParagraph,
            originalParagraph: [parsedChunk.originalParagraph],
            selected: true,
            diff: parsedChunk.diff,
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch diff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelection = () => {
    setRephrasedResults(prev => ({
      ...prev,
      selected: !prev.selected,
    }));
  };

  const handleEditParagraph = (newText: string) => {
    setRephrasedResults(prev => ({
      ...prev,
      customText: newText,
      edited: true,
    }));
  };

  const debounceSave = React.useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (content: any) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        if (editor) {
          const plainText = editor.getText();
          const totalCharacters = plainText.length;
          const totalWords = plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
          
          // Call the backend save API
          await updateChapterContent(bookId, versionId, chapterId, content, totalCharacters, totalWords);
        }
      }, 500);
    };
  }, [bookId, versionId, chapterId, editor, updateChapterContent]);

  // Fixed apply changes function for results step
  const handleApplyChanges = () => {
    let finalText = '';
    
    if (step === 'results') {
      // Use diff results for results step
      finalText = diffResults
        .filter(item => item.selected)
        .map(item => item.customText || item.rephrasedParagraph)
        .join('\n\n');
    } else {
      // Use rephrased results for comparison step
      finalText = rephrasedResults.customText || rephrasedResults.rephrasedParagraph;
    }

    if (editor && finalText) {
      const { from, to } = editor.state.selection;

      // Replace the selected text (not insert after)
      editor.chain()
        .focus()
        .deleteRange({ from, to })
        .insertContent(finalText)
        .run();

      // Add temporary highlighting that fades after 3 minutes
      setTimeout(() => {
        const currentPos = editor.state.selection.from;
        const endPos = currentPos + finalText.length;
        
        // Apply yellow highlight
        editor.chain()
          .setTextSelection({ from: currentPos - finalText.length, to: currentPos })
          .setMark('textStyle', { backgroundColor: '#fef3c7', color: '#92400e' })
          .run();
        
        // Remove highlight after 3 minutes
        setTimeout(() => {
          if (editor && !editor.isDestroyed) {
            editor.chain()
              .setTextSelection({ from: currentPos - finalText.length, to: currentPos })
              .unsetMark('textStyle')
              .run();
          }
        }, 180000); // 3 minutes
      }, 100);

      // Save changes to backend
      setTimeout(() => {
        debounceSave(editor.getJSON());
      }, 200);
    }

    onApplyChanges(finalText);
    onClose();
    setStep('setup');
  };

  const handleClose = () => {
    onClose();
    setStep('setup');
    setRephrasedResults({
      rephrasedParagraph: '',
      originalParagraph: [],
      selected: false,
    });
    setDiffResults([]);
    setDiffStreamingComplete(false);
  };

  const addPreConfiguredWord = (word: string) => {
    if (!noChangeWords.includes(word)) {
      setNoChangeWords(prev => prev ? `${prev}, ${word}` : word);
    }
  };

  const removeContextItem = (type: 'plot' | 'character' | 'world', id: string) => {
    switch (type) {
      case 'plot':
        setSelectedPlotNodes(prev => prev.filter(item => item.id !== id));
        break;
      case 'character':
        setSelectedCharacters(prev => prev.filter(item => item.id !== id));
        break;
      case 'world':
        setSelectedWorldObjects(prev => prev.filter(item => item.id !== id));
        break;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-white border-0 shadow-2xl">
        <DialogHeader className="pb-6 border-b border-slate-200/60 flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            AI Text Rephraser (Local)
            {!llmReady && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading Model...
              </div>
            )}
            {step !== 'setup' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(step === 'results' ? 'comparison' : 'setup')}
                className="ml-auto text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {step === 'setup' && (
            <div className="space-y-6 overflow-y-auto h-full pr-2">
              {/* LLM Status Banner */}
              {!llmReady && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-orange-700">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="font-medium">Local AI model is loading...</span>
                  </div>
                  <p className="text-sm text-orange-600 mt-1">
                    Please wait while the local language model initializes. This may take a few moments on first startup.
                  </p>
                </div>
              )}

              {/* Custom Instructions */}
              <div className="space-y-2">
                <Label htmlFor="instructions" className="text-sm font-medium text-gray-700">
                  Instructions
                </Label>
                <Textarea
                  id="instructions"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Provide specific instructions for rephrasing..."
                  className="min-h-[80px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Context Selection */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Plot Canvas Nodes */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Plot Context</Label>
                  <Popover open={showPlotSearch} onOpenChange={setShowPlotSearch}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start text-gray-600 border-gray-200">
                        <Search className="w-4 h-4 mr-2" />
                        Add Plot Nodes
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0">
                      <Command>
                        <CommandInput placeholder="Search plot nodes..." value={plotNodeSearch} onValueChange={setPlotNodeSearch} />
                        <CommandList>
                          <CommandEmpty>No nodes found.</CommandEmpty>
                          <CommandGroup>
                            {plotNodes.filter(node => 
                              node.name.toLowerCase().includes(plotNodeSearch.toLowerCase()) &&
                              !selectedPlotNodes.find(selected => selected.id === node.id)
                            ).map(node => (
                              <CommandItem
                                key={node.id}
                                onSelect={() => {
                                  setSelectedPlotNodes(prev => [...prev, node]);
                                  setShowPlotSearch(false);
                                }}
                              >
                                <div>
                                  <div className="font-medium">{node.name}</div>
                                  <div className="text-sm text-gray-500">{node.type}</div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="flex flex-wrap gap-1">
                    {selectedPlotNodes.map(node => (
                      <Badge key={node.id} variant="secondary" className="text-xs">
                        {node.name}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-3 w-3 p-0 ml-1"
                          onClick={() => removeContextItem('plot', node.id)}
                        >
                          <X className="h-2 w-2" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Characters */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Characters</Label>
                  <Popover open={showCharacterSearch} onOpenChange={setShowCharacterSearch}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start text-gray-600 border-gray-200">
                        <Search className="w-4 h-4 mr-2" />
                        Add Characters
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0">
                      <Command>
                        <CommandInput placeholder="Search characters..." value={characterSearch} onValueChange={setCharacterSearch} />
                        <CommandList>
                          <CommandEmpty>No characters found.</CommandEmpty>
                          <CommandGroup>
                            {characters.filter(char => 
                              char.name.toLowerCase().includes(characterSearch.toLowerCase()) &&
                              !selectedCharacters.find(selected => selected.id === char.id)
                            ).map(char => (
                              <CommandItem
                                key={char.id}
                                onSelect={() => {
                                  setSelectedCharacters(prev => [...prev, char]);
                                  setShowCharacterSearch(false);
                                }}
                              >
                                <div>
                                  <div className="font-medium">{char.name}</div>
                                  <div className="text-sm text-gray-500">{char.type}</div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="flex flex-wrap gap-1">
                    {selectedCharacters.map(char => (
                      <Badge key={char.id} variant="secondary" className="text-xs">
                        {char.name}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-3 w-3 p-0 ml-1"
                          onClick={() => removeContextItem('character', char.id)}
                        >
                          <X className="h-2 w-2" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* World Objects */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">World Objects</Label>
                  <Popover open={showWorldSearch} onOpenChange={setShowWorldSearch}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start text-gray-600 border-gray-200">
                        <Search className="w-4 h-4 mr-2" />
                        Add Objects
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0">
                      <Command>
                        <CommandInput placeholder="Search world objects..." value={worldObjectSearch} onValueChange={setWorldObjectSearch} />
                        <CommandList>
                          <CommandEmpty>No world objects found.</CommandEmpty>
                          <CommandGroup>
                            {worldObjects.filter(obj => 
                              obj.name.toLowerCase().includes(worldObjectSearch.toLowerCase()) &&
                              !selectedWorldObjects.find(selected => selected.id === obj.id)
                            ).map(obj => (
                              <CommandItem
                                key={obj.id}
                                onSelect={() => {
                                  setSelectedWorldObjects(prev => [...prev, obj]);
                                  setShowWorldSearch(false);
                                }}
                              >
                                <div>
                                  <div className="font-medium">{obj.name}</div>
                                  <div className="text-sm text-gray-500">{obj.type}</div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="flex flex-wrap gap-1">
                    {selectedWorldObjects.map(obj => (
                      <Badge key={obj.id} variant="secondary" className="text-xs">
                        {obj.name}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-3 w-3 p-0 ml-1"
                          onClick={() => removeContextItem('world', obj.id)}
                        >
                          <X className="h-2 w-2" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* No Change Words */}
              <div className="space-y-2">
                <Label htmlFor="noChangeWords" className="text-sm font-medium text-gray-700">
                  Protected Words
                </Label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {preConfiguredWords.map((word, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => addPreConfiguredWord(word)}
                        className="text-xs h-6 px-2 text-gray-600 border-gray-200 hover:bg-gray-50"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {word}
                      </Button>
                    ))}
                  </div>
                  <Input
                    id="noChangeWords"
                    value={noChangeWords}
                    onChange={(e) => setNoChangeWords(e.target.value)}
                    placeholder="Enter words that should not be changed (comma-separated)"
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Settings Row - Updated model options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">AI Model</Label>
                  <Select value={llmModel} onValueChange={setLlmModel}>
                    <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local-gemma">Local Gemma (Recommended)</SelectItem>
                      <SelectItem value="local-mistral">Local Mistral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="showDiff" className="text-sm font-medium text-gray-700">Show Differences</Label>
                  <Switch
                    id="showDiff"
                    checked={showDifference}
                    onCheckedChange={setShowDifference}
                  />
                </div>
              </div>

              {/* Selected Text Preview */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Selected Text Preview</Label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-32 overflow-y-auto">
                  <div className="space-y-1">
                    {textBlocks.map((block, index) => (
                      <p key={index} className="text-xs text-gray-600 border-l-2 border-blue-300 pl-2 py-1">
                        {block}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rephrase Button - Updated with LLM ready check */}
              <Button
                onClick={handleRephrase}
                disabled={isLoading || !selectedText || !llmReady}
                className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing with Local AI...
                  </>
                ) : !llmReady ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Loading AI Model...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Rephrase Text (Local AI)
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 'results' && (
            <div className="flex flex-col h-full animate-fade-in">
              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse"></div>
                    <Loader2 className="w-8 h-8 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-spin" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Processing Differences</h3>
                    <p className="text-slate-500">Analyzing and comparing text variations...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Modern Status Header */}
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 mb-6 flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5"></div>
                    <div className="relative flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
                            <span className="text-sm font-bold text-white">
                              {diffResults.filter(r => r.selected).length}
                            </span>
                          </div>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-2 h-2 text-white" />
                          </div>
                        </div>
                        <div>
                          <div className="text-base font-semibold text-slate-800">
                            {diffResults.filter(r => r.selected).length} of {diffResults.length} Selected
                          </div>
                          <div className="text-xs text-slate-500">
                            {diffStreamingComplete ? 'Analysis complete' : 'Processing...'}
                          </div>
                        </div>
                      </div>

                      <Button 
                        onClick={handleApplyChanges} 
                        disabled={!diffStreamingComplete || diffResults.filter(r => r.selected).length === 0}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:cursor-not-allowed"
                        size="sm"
                      >
                        {!diffStreamingComplete ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Apply Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Diff Results Grid */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {diffResults.map((result, index) => (
                      <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                        <ModernDiffCard
                          result={result}
                          index={index}
                          onToggleSelection={(index) => {
                            setDiffResults(prev => 
                              prev.map((item, i) => 
                                i === index ? { ...item, selected: !item.selected } : item
                              )
                            );
                          }}
                          onEditParagraph={(index, newText) => {
                            setDiffResults(prev => 
                              prev.map((item, i) => 
                                i === index 
                                  ? { ...item, rephrasedParagraph: newText, edited: true, selected: true }
                                  : item
                              )
                            );
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'comparison' && (
            <div className="flex flex-col h-full animate-fade-in">
              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse"></div>
                    <Loader2 className="w-8 h-8 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-spin" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Rephrasing Content</h3>
                    <p className="text-slate-500">AI is working on your text...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Comparison Header */}
                  <div className="text-center py-4 flex-shrink-0">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                      Text Comparison
                    </h3>
                    <p className="text-slate-600 text-sm">Review the changes and decide what to keep</p>
                  </div>

                  {/* Comparison Grid */}
                  <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
                    {/* Original Text Panel */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="bg-red-50 px-4 py-3 border-b border-red-100">
                        <h4 className="font-medium text-red-700 flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          Original Text
                        </h4>
                      </div>
                      <div className="flex-1 p-4 overflow-y-auto">
                        <div className="prose prose-sm max-w-none">
                          <pre className="text-sm leading-relaxed text-red-700 whitespace-pre-wrap font-sans">
                            {rephrasedResults.originalParagraph.join('\n')}
                          </pre>
                        </div>
                      </div>
                    </div>

                    {/* Rephrased Text Panel */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="bg-green-50 px-4 py-3 border-b border-green-100">
                        <h4 className="font-medium text-green-700 flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Rephrased Text
                        </h4>
                      </div>
                      <div className="flex-1 p-4 overflow-y-auto">
                        <div className="prose prose-sm max-w-none">
                          <pre className="text-sm leading-relaxed text-green-700 whitespace-pre-wrap font-sans">
                            {rephrasedResults.rephrasedParagraph}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 flex-shrink-0">
                    <Button
                      variant="outline"
                      onClick={handleDiffChecker}
                      disabled={isLoading}
                      className="border-slate-300 hover:bg-slate-50 transition-all duration-200"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading Diff...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Show Detailed Diff
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleApplyChanges}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Apply Changes
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface ModernDiffCardProps {
  result: RephrasedParagraph;
  index: number;
  onToggleSelection: (index: number) => void;
  onEditParagraph: (index: number, text: string) => void;
}

const ModernDiffCard: React.FC<ModernDiffCardProps> = ({
  result,
  index,
  onToggleSelection,
  onEditParagraph,
}) => {
  const [isEditingOriginal, setIsEditingOriginal] = useState(false);
  const [isEditingRephrased, setIsEditingRephrased] = useState(false);
  const [editTextOriginal, setEditTextOriginal] = useState<string>('');
  const [editTextRephrased, setEditTextRephrased] = useState(result.customText || result.rephrasedParagraph);

  const handleSaveOriginal = () => {
    onEditParagraph(index, editTextOriginal);
    setIsEditingOriginal(false);
  };

  const handleSaveRephrased = () => {
    onEditParagraph(index, editTextRephrased);
    setIsEditingRephrased(false);
  };

  const displayRephrasedText = result.customText || result.rephrasedParagraph;

  return (
    <div className={cn(
      "group relative bg-white rounded-lg border transition-all duration-200 hover:shadow-sm",
      result.selected 
        ? "border-green-200 bg-green-50/20" 
        : "border-gray-200 hover:border-gray-300"
    )}>
      <div className="flex items-start gap-3 p-4">
        {/* Original Text Column */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
            <span className="text-xs font-medium text-red-600 uppercase tracking-wide">Original</span>
          </div>
          
          {isEditingOriginal ? (
            <div className="space-y-2">
              <Textarea
                value={editTextOriginal}
                onChange={(e) => setEditTextOriginal(e.target.value)}
                className="min-h-[60px] resize-none text-sm border-red-200 focus:border-red-400 rounded-lg"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveOriginal} className="h-6 px-2 text-xs bg-green-500 hover:bg-green-600 text-white rounded">
                  <Check className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingOriginal(false)} className="h-6 px-2 text-xs text-slate-600 rounded">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="p-3 bg-gray-50 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setIsEditingOriginal(true)}
            >
              <p className="text-sm leading-relaxed text-red-700">
                {result.originalParagraph}
              </p>
            </div>
          )}
        </div>

        {/* Selection Control */}
        <div className="flex flex-col items-center gap-2 px-1 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleSelection(index)}
            className={cn(
              "h-8 w-8 p-0 rounded-full transition-all duration-200",
              result.selected 
                ? "bg-green-500 hover:bg-green-600 text-white" 
                : "bg-gray-200 hover:bg-red-200 text-gray-600 hover:text-red-700"
            )}
          >
            {result.selected ? (
              <Check className="w-4 h-4" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </Button>
          
          <ArrowRight className={cn(
            "w-4 h-4 transition-colors",
            result.selected ? "text-green-500" : "text-gray-400"
          )} />
        </div>

        {/* Rephrased Text Column */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span className="text-xs font-medium text-green-600 uppercase tracking-wide">Rephrased</span>
            {result.edited && (
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            )}
          </div>
          
          {isEditingRephrased ? (
            <div className="space-y-2">
              <Textarea
                value={editTextRephrased}
                onChange={(e) => setEditTextRephrased(e.target.value)}
                className="min-h-[60px] resize-none text-sm border-green-200 focus:border-green-400 rounded-lg"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveRephrased} className="h-6 px-2 text-xs bg-green-500 hover:bg-green-600 text-white rounded">
                  <Check className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingRephrased(false)} className="h-6 px-2 text-xs text-slate-600 rounded">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className={cn(
                "p-3 border rounded-lg cursor-pointer transition-colors",
                result.selected 
                  ? "bg-gray-50 border-gray-100 hover:bg-gray-100"
                  : "bg-gray-50 border-gray-100 hover:bg-gray-100"
              )}
              onClick={() => setIsEditingRephrased(true)}
            >
              <p className={cn(
                "text-sm leading-relaxed",
                result.selected 
                  ? "text-green-700" 
                  : "text-gray-600"
              )}>
                {displayRephrasedText}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
