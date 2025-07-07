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
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useBookContext } from '@/lib/BookContextProvider';

interface RephrasedParagraph {
  rephrasedParagraph: string;
  originalParagraph: string[];
  selected: boolean;
  edited?: boolean;
  customText?: string;
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
  const [llmModel, setLlmModel] = useState('default');
  const [showDifference, setShowDifference] = useState(true);
  const [noChangeWords, setNoChangeWords] = useState('');
  const [rephrasedResults, setRephrasedResults] = useState<RephrasedParagraph>({
    rephrasedParagraph: '',
    originalParagraph: [],
    selected: false,
  });
  const [diffResults, setDiffResults] = useState<RephrasedParagraph[]>([]);
  
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
    { value: 'default', label: 'Default Model' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'claude-3', label: 'Claude 3' },
    { value: 'gemini-pro', label: 'Gemini Pro' },
  ];

  // Pre-configured no-change words
  const preConfiguredWords = [
    'character names', 'place names', 'brand names', 'technical terms',
    'dates', 'numbers', 'proper nouns', 'dialogue tags'
  ];

  const handleRephrase = async () => {
    setIsLoading(true);
    try {
      // Process textBlocks to create textToRephrase array - remove duplicates and escape quotes
      const seenTexts = new Set<string>();
      const textToRephrase = textBlocks
        .map(block => escapeQuote(block.trim()))
        .filter(text => {
          if (text.length > 0 && !seenTexts.has(text)) {
            seenTexts.add(text);
            return true;
          }
          return false;
        });
      
      // Get context from editor - extract unique lines
      const currentSelection = editor?.state?.selection;
      const textBefore = extractContextLines(editor, currentSelection, 10, 'before');
      const textAfter = extractContextLines(editor, currentSelection, 10, 'after');
      
      // Build prompt contexts
      const promptContexts = [
        ...selectedPlotNodes.map(node => ({
          contextType: 'PlotCanvas',
          id: node.id,
          prompt: node.prompt || ''
        })),
        ...selectedCharacters.map(char => ({
          contextType: 'Character',
          id: char.id,
          prompt: char.prompt || ''
        })),
        ...selectedWorldObjects.map(obj => ({
          contextType: 'WorldObject',
          id: obj.id,
          prompt: obj.prompt || ''
        }))
      ];

      const payload = {
        bookId,
        versionId,
        chapterId,
        textToRephrase,
        textBefore,
        textAfter,
        llmModel,
        customInstructions,
        promptContexts,
      };

      console.log('Rephrase payload:', payload);
      const response = await apiClient.post('/ai/rephrase', payload);

      console.log('Rephrase response:', response.data);
      if (!response.data || !response.data.rephrasedText) {
        console.error('Invalid response from rephrase API:', response.data);
        return;
      }
      const results: RephrasedParagraph = {
        originalParagraph: textToRephrase,
        rephrasedParagraph: response.data.rephrasedText,
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
        if (parsedChunk.done) break;

        setDiffResults((prev) => [
          ...prev,
          {
            rephrasedParagraph: parsedChunk.newParagraph,
            originalParagraph: [parsedChunk.originalParagraph],
            selected: false,
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

  // Fixing map operation on rephrasedResults
  const handleApplyChanges = () => {
    const finalText = diffResults
      .filter(item => item.selected)
      .map(item => item.customText || item.rephrasedParagraph)
      .join('\n\n');

    if (editor) {
      const { from, to } = editor.state.selection;

      editor.chain()
        .focus()
        .deleteRange({ from, to })
        .insertContent(finalText)
        .run();

      debounceSave(editor.getJSON());
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden bg-white border shadow-xl">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-3 text-2xl font-semibold text-gray-900">
            <Wand2 className="w-6 h-6 text-blue-600" />
            AI Text Rephraser
            {step === 'results' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('comparison')}
                className="ml-auto text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {step === 'setup' && (
          <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
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

            {/* Settings Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">AI Model</Label>
                <Select value={llmModel} onValueChange={setLlmModel}>
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
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

            {/* Rephrase Button */}
            <Button
              onClick={handleRephrase}
              disabled={isLoading || !selectedText}
              className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Rephrasing...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  Rephrase Text
                </>
              )}
            </Button>
          </div>
        )}

        {step === 'results' && (
          <div className="space-y-4 overflow-hidden">
            {/* Clean Status Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {diffResults.filter(r => r.selected).length}
                  </span>
                </div>
                <div className="text-sm text-gray-700">
                  of {diffResults.length} paragraphs selected
                </div>
              </div>

              <Button 
                onClick={handleApplyChanges} 
                className="bg-green-600 hover:bg-green-700 text-white font-medium"
                size="sm"
              >
                <Check className="w-4 h-4 mr-1" />
                Apply Changes
              </Button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
              {diffResults.map((result, index) => (
                <CompactDiffCard
                  key={index}
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
                          ? { ...item, newParagraph: newText, edited: true, selected: true }
                          : item
                      )
                    );
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {step === 'comparison' && (
          <div className="comparison-step grid grid-cols-2 gap-4 max-h-[calc(90vh-120px)] overflow-y-auto">
            {/* Left Pane: Original Paragraph */}
            <div className="original-pane p-4 bg-gray-50 border rounded overflow-y-auto">
              <h3 className="text-lg font-semibold">Original Text</h3>
              <pre className="text-sm whitespace-pre-wrap">
                {rephrasedResults.originalParagraph.join('\n')}
              </pre>
            </div>

            {/* Right Pane: Rephrased Paragraph */}
            <div className="rephrased-pane p-4 bg-gray-50 border rounded overflow-y-auto">
              <h3 className="text-lg font-semibold">Rephrased Text</h3>
              <pre className="text-sm whitespace-pre-wrap">
                {rephrasedResults.rephrasedParagraph}
              </pre>
            </div>

            {/* Action Buttons */}
            <div className="col-span-2 flex justify-end gap-2 mt-4 sticky bottom-0 bg-white py-2">
              <button
                className="btn btn-secondary"
                onClick={handleDiffChecker}
                disabled={isLoading}
              >
                {isLoading ? 'Loading Diff...' : 'Show Diff'}
              </button>

              <button
                className="btn btn-primary"
                onClick={handleApplyChanges}
              >
                Apply Changes
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface CompactDiffCardProps {
  result: RephrasedParagraph;
  index: number;
  onToggleSelection: (index: number) => void;
  onEditParagraph: (index: number, text: string) => void;
}

const CompactDiffCard: React.FC<CompactDiffCardProps> = ({
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
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors">
      <div className="flex items-start gap-3 p-4">
        {/* Original Text */}
        <div className="flex-1 min-w-0">
          {isEditingOriginal ? (
            <div className="space-y-2">
              <Textarea
                value={editTextOriginal}
                onChange={(e) => setEditTextOriginal(e.target.value)}
                className="min-h-[60px] resize-none text-sm border-gray-200 focus:border-red-400"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveOriginal} className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white">
                  <Check className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingOriginal(false)} className="h-7 px-3 text-xs text-gray-600">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="p-3 bg-gray-50 border border-gray-200 rounded cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setIsEditingOriginal(true)}
            >
              <p className="text-sm leading-relaxed text-red-700">
                {result.originalParagraph}
              </p>
            </div>
          )}
        </div>

        {/* Control Button */}
        <div className="flex flex-col items-center gap-2 px-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleSelection(index)}
            className={cn(
              "h-8 w-8 p-0 rounded-full transition-colors",
              result.selected 
                ? "bg-green-600 hover:bg-green-700 text-white" 
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
            result.selected ? "text-green-600" : "text-gray-400"
          )} />
        </div>

        {/* Rephrased Text */}
        <div className="flex-1 min-w-0">
          {isEditingRephrased ? (
            <div className="space-y-2">
              <Textarea
                value={editTextRephrased}
                onChange={(e) => setEditTextRephrased(e.target.value)}
                className="min-h-[60px] resize-none text-sm border-gray-200 focus:border-green-400"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveRephrased} className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white">
                  <Check className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingRephrased(false)} className="h-7 px-3 text-xs text-gray-600">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className={cn(
                "p-3 border rounded cursor-pointer transition-colors relative",
                result.selected 
                  ? "bg-white border-gray-200 hover:bg-gray-50"
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
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
              
              {result.edited && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
