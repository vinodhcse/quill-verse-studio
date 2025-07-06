
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
import { Loader2, RefreshCw, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';

interface RephrasedParagraph {
  rephrasedParagraph: string;
  originalParagraph: string;
  selected: boolean;
  edited?: boolean;
  customText?: string;
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
}

export const AIRephraserModal: React.FC<AIRephraserModalProps> = ({
  isOpen,
  onClose,
  selectedText,
  textBlocks,
  bookId,
  versionId,
  chapterId,
  onApplyChanges,
}) => {
  const [step, setStep] = useState<'setup' | 'results'>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('Make the tone more engaging and vivid.');
  const [llmModel, setLlmModel] = useState('default');
  const [showDifference, setShowDifference] = useState(true);
  const [noChangeWords, setNoChangeWords] = useState('');
  const [rephrasedResults, setRephrasedResults] = useState<RephrasedParagraph[]>([]);

  // Available LLM models (could be loaded from API)
  const availableModels = [
    { value: 'default', label: 'Default Model' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'claude-3', label: 'Claude 3' },
    { value: 'gemini-pro', label: 'Gemini Pro' },
  ];

  const handleRephrase = async () => {
    setIsLoading(true);
    try {
      const payload = {
        bookId,
        versionId,
        chapterId,
        textToRephrase: textBlocks,
        textBefore: selectedText,
        textAfter: '', // Will be filled after rephrasing
        llmModel,
        customInstructions,
        promptContexts: [], // TODO: Add context selection
      };

      const response = await apiClient.post('/ai/rephrase', payload);
      
      const results: RephrasedParagraph[] = response.data.rephrasedText.map((item: any) => ({
        ...item,
        selected: true, // All rephrased by default
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            AI Rephraser
            {step === 'results' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('setup')}
                className="ml-auto"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Setup
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {step === 'setup' && (
          <div className="space-y-6 animate-fade-in">
            {/* Custom Instructions */}
            <div className="space-y-2">
              <Label htmlFor="instructions">Custom Instructions</Label>
              <Textarea
                id="instructions"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Provide specific instructions for rephrasing..."
                className="min-h-[80px] resize-none"
              />
            </div>

            {/* No Change Words */}
            <div className="space-y-2">
              <Label htmlFor="noChangeWords">No Change Words (comma-separated)</Label>
              <Input
                id="noChangeWords"
                value={noChangeWords}
                onChange={(e) => setNoChangeWords(e.target.value)}
                placeholder="character names, technical terms, etc."
              />
              {noChangeWords && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {noChangeWords.split(',').map((word, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {word.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* LLM Model Selection */}
            <div className="space-y-2">
              <Label>LLM Model</Label>
              <Select value={llmModel} onValueChange={setLlmModel}>
                <SelectTrigger>
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

            {/* Show Difference Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="showDiff"
                checked={showDifference}
                onCheckedChange={setShowDifference}
              />
              <Label htmlFor="showDiff">Show Rephrase Difference</Label>
            </div>

            {/* Selected Text Preview */}
            <div className="space-y-2">
              <Label>Selected Text Preview</Label>
              <div className="p-4 bg-muted/50 rounded-lg border max-h-40 overflow-y-auto">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedText}
                </p>
              </div>
            </div>

            {/* Rephrase Button */}
            <Button
              onClick={handleRephrase}
              disabled={isLoading || !selectedText}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rephrasing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Rephrase Text
                </>
              )}
            </Button>
          </div>
        )}

        {step === 'results' && (
          <div className="space-y-4 animate-fade-in overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {rephrasedResults.filter(r => r.selected).length} of {rephrasedResults.length} paragraphs selected
              </div>
              <Button onClick={handleApplyChanges} className="px-6">
                <Check className="w-4 h-4 mr-2" />
                Apply Changes
              </Button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
              {rephrasedResults.map((result, index) => (
                <DiffCard
                  key={index}
                  result={result}
                  index={index}
                  showDifference={showDifference}
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

interface DiffCardProps {
  result: RephrasedParagraph;
  index: number;
  showDifference: boolean;
  onToggleSelection: (index: number) => void;
  onEditParagraph: (index: number, text: string) => void;
}

const DiffCard: React.FC<DiffCardProps> = ({
  result,
  index,
  showDifference,
  onToggleSelection,
  onEditParagraph,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(result.customText || result.rephrasedParagraph);

  const handleSaveEdit = () => {
    onEditParagraph(index, editText);
    setIsEditing(false);
  };

  const displayText = result.customText || result.rephrasedParagraph;

  return (
    <div className={cn(
      "border rounded-lg p-4 transition-all duration-200",
      result.selected ? "border-primary bg-primary/5" : "border-border bg-background"
    )}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Original Text */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Original</Badge>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800">
            <p className="text-sm leading-relaxed">{result.originalParagraph}</p>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="lg:order-3 lg:col-span-2 flex items-center justify-center gap-2">
          <Button
            variant={result.selected ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleSelection(index)}
            className="transition-all duration-200"
          >
            {result.selected ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Use Rephrased
              </>
            ) : (
              <>
                <X className="w-4 h-4 mr-1" />
                Keep Original
              </>
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            Edit
          </Button>
        </div>

        {/* Rephrased Text */}
        <div className="space-y-2 lg:order-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {result.edited ? "Edited" : "Rephrased"}
            </Badge>
            {result.edited && (
              <Badge variant="secondary" className="text-xs">Custom</Badge>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit}>
                  <Check className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className={cn(
              "p-3 rounded border transition-all duration-200",
              result.selected 
                ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                : "bg-muted/50 border-border"
            )}>
              <p className="text-sm leading-relaxed">{displayText}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
