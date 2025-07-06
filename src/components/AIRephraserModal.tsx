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
  originalParagraph: string;
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
  const { state } = useBookContext();
  const [step, setStep] = useState<'setup' | 'results'>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('Make the tone more engaging and vivid.');
  const [llmModel, setLlmModel] = useState('default');
  const [showDifference, setShowDifference] = useState(true);
  const [noChangeWords, setNoChangeWords] = useState('');
  const [rephrasedResults, setRephrasedResults] = useState<RephrasedParagraph[]>([]);
  
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
      
      const results: RephrasedParagraph[] = response.data.rephrasedText.map((item: any) => ({
        ...item,
        selected: true,
        edited: false,
      }));

      setRephrasedResults(results);
      setStep('results');
    } catch (error) {
      console.error('Failed to rephrase text:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelection = (index: number) => {
    setRephrasedResults(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleEditParagraph = (index: number, newText: string) => {
    setRephrasedResults(prev =>
      prev.map((item, i) =>
        i === index 
          ? { ...item, customText: newText, edited: true, selected: true }
          : item
      )
    );
  };

  const handleApplyChanges = () => {
    const finalText = rephrasedResults
      .map(item => {
        if (item.selected) {
          return item.customText || item.rephrasedParagraph;
        }
        return item.originalParagraph;
      })
      .join('\n\n');

    onApplyChanges(finalText);
    onClose();
    setStep('setup');
  };

  const handleClose = () => {
    onClose();
    setStep('setup');
    setRephrasedResults([]);
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
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 border-0 shadow-2xl">
        <DialogHeader className="relative pb-6">
          <DialogTitle className="flex items-center gap-4 text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-white/20 shadow-lg">
              <Wand2 className="w-7 h-7 text-purple-600" />
            </div>
            AI Rephraser
            {step === 'results' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('setup')}
                className="ml-auto hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all duration-300 transform hover:scale-105"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Setup
              </Button>
            )}
          </DialogTitle>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-cyan-500/5 rounded-t-xl -z-10 animate-pulse" />
        </DialogHeader>

        {step === 'setup' && (
          <div className="space-y-8 animate-fade-in overflow-y-auto max-h-[calc(95vh-120px)] pr-2">
            {/* Custom Instructions */}
            <div className="space-y-3 p-6 rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 backdrop-blur-sm">
              <Label htmlFor="instructions" className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Custom Instructions
              </Label>
              <Textarea
                id="instructions"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Provide specific instructions for rephrasing..."
                className="min-h-[100px] resize-none bg-background/50 border-border/30 focus:border-primary/50 transition-all duration-200"
              />
            </div>

            {/* Context Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Plot Canvas Nodes */}
              <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 border border-blue-200/30">
                <Label className="font-semibold text-blue-700 dark:text-blue-300">Plot Canvas Context</Label>
                <Popover open={showPlotSearch} onOpenChange={setShowPlotSearch}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start">
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
                                <div className="text-sm text-muted-foreground">{node.type}</div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <div className="flex flex-wrap gap-2">
                  {selectedPlotNodes.map(node => (
                    <Badge key={node.id} variant="secondary" className="flex items-center gap-1">
                      {node.name}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0"
                        onClick={() => removeContextItem('plot', node.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Characters */}
              <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10 border border-green-200/30">
                <Label className="font-semibold text-green-700 dark:text-green-300">Character Context</Label>
                <Popover open={showCharacterSearch} onOpenChange={setShowCharacterSearch}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start">
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
                                <div className="text-sm text-muted-foreground">{char.type}</div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <div className="flex flex-wrap gap-2">
                  {selectedCharacters.map(char => (
                    <Badge key={char.id} variant="secondary" className="flex items-center gap-1">
                      {char.name}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0"
                        onClick={() => removeContextItem('character', char.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* World Objects */}
              <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10 border border-purple-200/30">
                <Label className="font-semibold text-purple-700 dark:text-purple-300">World Context</Label>
                <Popover open={showWorldSearch} onOpenChange={setShowWorldSearch}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Search className="w-4 h-4 mr-2" />
                      Add World Objects
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
                                <div className="text-sm text-muted-foreground">{obj.type}</div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <div className="flex flex-wrap gap-2">
                  {selectedWorldObjects.map(obj => (
                    <Badge key={obj.id} variant="secondary" className="flex items-center gap-1">
                      {obj.name}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0"
                        onClick={() => removeContextItem('world', obj.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* No Change Words */}
            <div className="space-y-4 p-6 rounded-2xl bg-gradient-to-br from-orange-50/30 to-orange-100/10 dark:from-orange-950/20 dark:to-orange-900/10 border border-orange-200/30">
              <Label htmlFor="noChangeWords" className="text-lg font-semibold flex items-center gap-2">
                <Palette className="w-5 h-5 text-orange-500" />
                Protected Words
              </Label>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {preConfiguredWords.map((word, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => addPreConfiguredWord(word)}
                      className="hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-all duration-200"
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
                  className="bg-background/50 border-border/30 focus:border-orange-400/50"
                />
                {noChangeWords && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {noChangeWords.split(',').map((word, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-orange-100 dark:bg-orange-900/20">
                        {word.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Settings Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-indigo-50/50 to-indigo-100/30 dark:from-indigo-950/20 dark:to-indigo-900/10 border border-indigo-200/30">
                <Label className="font-semibold text-indigo-700 dark:text-indigo-300">LLM Model</Label>
                <Select value={llmModel} onValueChange={setLlmModel}>
                  <SelectTrigger className="bg-background/50 border-border/30">
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

              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-teal-50/50 to-teal-100/30 dark:from-teal-950/20 dark:to-teal-900/10 border border-teal-200/30">
                <Label htmlFor="showDiff" className="font-semibold text-teal-700 dark:text-teal-300">Show Differences</Label>
                <Switch
                  id="showDiff"
                  checked={showDifference}
                  onCheckedChange={setShowDifference}
                />
              </div>
            </div>

            {/* Selected Text Preview */}
            <div className="space-y-3 p-6 rounded-2xl bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-950/20 dark:to-slate-900/10 border border-slate-200/30">
              <Label className="text-lg font-semibold">Selected Text Preview</Label>
              <div className="p-4 bg-background/70 rounded-lg border border-border/30 max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {textBlocks.map((block, index) => (
                    <p key={index} className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3 py-1">
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
              className="w-full h-16 text-xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-700 transition-all duration-500 transform hover:scale-[1.02] shadow-2xl hover:shadow-purple-500/25 animate-pulse hover:animate-none"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Enhancing with AI Magic...
                </>
              ) : (
                <>
                  <Wand2 className="w-6 h-6 mr-3" />
                  Transform Text with AI
                </>
              )}
            </Button>
          </div>
        )}

        {step === 'results' && (
          <div className="space-y-6 animate-fade-in overflow-hidden">
            {/* Modern Status Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-white/20 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-blue-400/20 to-purple-400/20 animate-pulse" />
              <div className="relative flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 flex items-center justify-center shadow-lg">
                      <span className="text-2xl font-bold text-white">
                        {rephrasedResults.filter(r => r.selected).length}
                      </span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        Paragraphs Selected
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        out of {rephrasedResults.length} total
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-12 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent mx-2" />
                  
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ready to apply
                    </span>
                  </div>
                </div>

                <Button 
                  onClick={handleApplyChanges} 
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  size="lg"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Apply Magic ✨
                </Button>
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto space-y-4 pr-2">
              {rephrasedResults.map((result, index) => (
                <CompactDiffCard
                  key={index}
                  result={result}
                  index={index}
                  onToggleSelection={handleToggleSelection}
                  onEditParagraph={handleEditParagraph}
                />
              ))}
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
  const [editTextOriginal, setEditTextOriginal] = useState(result.originalParagraph);
  const [editTextRephrased, setEditTextRephrased] = useState(result.customText || result.rephrasedParagraph);

  const handleSaveOriginal = () => {
    // For original text editing, we don't change the selection but update the text
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
      "group relative overflow-hidden rounded-2xl transition-all duration-500 hover:shadow-2xl",
      result.selected 
        ? "bg-gradient-to-r from-emerald-50/50 via-blue-50/30 to-purple-50/50 dark:from-emerald-950/20 dark:via-blue-950/10 dark:to-purple-950/20 shadow-lg border border-emerald-200/50 dark:border-emerald-800/30" 
        : "bg-gradient-to-r from-gray-50/50 to-slate-50/30 dark:from-gray-950/20 dark:to-slate-950/10 border border-gray-200/30 dark:border-gray-800/30"
    )}>
      {/* Animated Background Gradient */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        result.selected 
          ? "bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-purple-500/5" 
          : "bg-gradient-to-r from-gray-500/5 to-slate-500/5"
      )} />
      
      <div className="relative flex items-start gap-4 p-6">
        {/* Original Text */}
        <div className="flex-1 min-w-0">
          {isEditingOriginal ? (
            <div className="space-y-3">
              <Textarea
                value={editTextOriginal}
                onChange={(e) => setEditTextOriginal(e.target.value)}
                className="min-h-[80px] resize-none text-sm bg-white/80 dark:bg-gray-900/80 border-red-200 focus:border-red-400 transition-colors"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveOriginal} className="h-8 px-4 text-xs bg-emerald-500 hover:bg-emerald-600">
                  <Check className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingOriginal(false)} className="h-8 px-4 text-xs">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="group/original p-4 rounded-xl bg-gradient-to-br from-red-50/80 to-pink-50/60 dark:from-red-950/20 dark:to-pink-950/10 border border-red-200/40 dark:border-red-800/30 cursor-pointer hover:shadow-md transition-all duration-300 transform hover:scale-[1.01]"
              onClick={() => setIsEditingOriginal(true)}
            >
              <div className="flex items-start justify-between">
                <p className="text-sm leading-relaxed text-red-800 dark:text-red-200 flex-1">
                  {result.originalParagraph}
                </p>
                <div className="ml-2 opacity-0 group-hover/original:opacity-100 transition-opacity">
                  <Edit3 className="w-4 h-4 text-red-500" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Control Icons */}
        <div className="flex flex-col items-center gap-3 px-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleSelection(index)}
            className={cn(
              "h-10 w-10 p-0 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg",
              result.selected 
                ? "bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white shadow-emerald-500/30" 
                : "bg-gradient-to-r from-gray-200 to-gray-300 hover:from-red-200 hover:to-red-300 text-gray-700 hover:text-red-700 dark:from-gray-700 dark:to-gray-600 dark:text-gray-300 dark:hover:from-red-800 dark:hover:to-red-700"
            )}
          >
            {result.selected ? (
              <Check className="w-4 h-4" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </Button>
          
          <div className="relative">
            <ArrowRight className={cn(
              "w-5 h-5 transition-all duration-300",
              result.selected ? "text-emerald-500 animate-pulse" : "text-gray-400"
            )} />
            {result.selected && (
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
            )}
          </div>
        </div>

        {/* Rephrased Text */}
        <div className="flex-1 min-w-0">
          {isEditingRephrased ? (
            <div className="space-y-3">
              <Textarea
                value={editTextRephrased}
                onChange={(e) => setEditTextRephrased(e.target.value)}
                className="min-h-[80px] resize-none text-sm bg-white/80 dark:bg-gray-900/80 border-emerald-200 focus:border-emerald-400 transition-colors"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveRephrased} className="h-8 px-4 text-xs bg-emerald-500 hover:bg-emerald-600">
                  <Check className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingRephrased(false)} className="h-8 px-4 text-xs">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className={cn(
                "group/rephrased p-4 rounded-xl border cursor-pointer transition-all duration-300 transform hover:scale-[1.01] hover:shadow-md relative",
                result.selected 
                  ? "bg-gradient-to-br from-emerald-50/80 to-blue-50/60 dark:from-emerald-950/20 dark:to-blue-950/10 border-emerald-200/40 dark:border-emerald-800/30"
                  : "bg-gradient-to-br from-gray-50/80 to-slate-50/60 dark:from-gray-950/20 dark:to-slate-950/10 border-gray-200/40 dark:border-gray-800/30"
              )}
              onClick={() => setIsEditingRephrased(true)}
            >
              <div className="flex items-start justify-between">
                <p className={cn(
                  "text-sm leading-relaxed flex-1",
                  result.selected 
                    ? "text-emerald-800 dark:text-emerald-200" 
                    : "text-gray-600 dark:text-gray-400"
                )}>
                  {displayRephrasedText}
                </p>
                <div className="ml-2 opacity-0 group-hover/rephrased:opacity-100 transition-opacity">
                  <Edit3 className={cn(
                    "w-4 h-4",
                    result.selected ? "text-emerald-500" : "text-gray-500"
                  )} />
                </div>
              </div>
              
              {result.edited && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
