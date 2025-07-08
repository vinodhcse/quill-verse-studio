
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { 
  Bold, 
  Italic, 
  Underline, 
  Copy, 
  Scissors, 
  Clipboard,
  RefreshCw,
  Expand,
  Minimize2,
  CheckCircle,
  Settings,
  Loader2
} from 'lucide-react';

interface TextContextMenuProps {
  children: React.ReactNode;
  editor: any;
  onRephraseClick?: (selectedText: string, textBlocks: string[], editor: any) => void;
}

export const TextContextMenu: React.FC<TextContextMenuProps> = ({
  children,
  editor,
  onRephraseClick,
}) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleRephrase = () => {
    if (!editor || !onRephraseClick) return;
    
    const { state } = editor;
    const { selection } = state;
    const { from, to } = selection;
    
    if (from === to) return; // No text selected
    
    // Get the selected text as plain text
    const selectedText = state.doc.textBetween(from, to, '\n');
    
    // Extract distinct paragraphs from the selection
    const textBlocks: string[] = [];
    const seenTexts = new Set<string>();
    
    // Process each node in the selection
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.isBlock && node.textContent) {
        // Get the full text content of block nodes (paragraphs, headings, etc.)
        const blockText = node.textContent.trim();
        if (blockText.length > 0 && !seenTexts.has(blockText)) {
          textBlocks.push(blockText);
          seenTexts.add(blockText);
        }
      }
    });
    
    // If no block-level text found, fall back to splitting by double line breaks
    if (textBlocks.length === 0) {
      const paragraphs = selectedText.split('\n\n').map(p => p.trim()).filter(p => p.length > 0);
      paragraphs.forEach(p => {
        if (!seenTexts.has(p)) {
          textBlocks.push(p);
          seenTexts.add(p);
        }
      });
    }
    
    // If still no meaningful blocks, use single line breaks
    if (textBlocks.length === 0) {
      const lines = selectedText.split('\n').map(l => l.trim()).filter(l => l.length > 10);
      lines.forEach(l => {
        if (!seenTexts.has(l)) {
          textBlocks.push(l);
          seenTexts.add(l);
        }
      });
    }
    
    console.log('Selected text blocks:', textBlocks);
    onRephraseClick(selectedText, textBlocks, editor);
  };

  const handleQuickAction = async (action: string) => {
    if (!editor || !onRephraseClick) return;
    
    const { state } = editor;
    const { selection } = state;
    const { from, to } = selection;
    
    if (from === to) return; // No text selected
    
    setIsLoading(action);
    
    // Get the selected text and blocks (same logic as handleRephrase)
    const selectedText = state.doc.textBetween(from, to, '\n');
    const textBlocks: string[] = [];
    const seenTexts = new Set<string>();
    
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.isBlock && node.textContent) {
        const blockText = node.textContent.trim();
        if (blockText.length > 0 && !seenTexts.has(blockText)) {
          textBlocks.push(blockText);
          seenTexts.add(blockText);
        }
      }
    });
    
    if (textBlocks.length === 0) {
      const paragraphs = selectedText.split('\n\n').map(p => p.trim()).filter(p => p.length > 0);
      paragraphs.forEach(p => {
        if (!seenTexts.has(p)) {
          textBlocks.push(p);
          seenTexts.add(p);
        }
      });
    }
    
    if (textBlocks.length === 0) {
      const lines = selectedText.split('\n').map(l => l.trim()).filter(l => l.length > 10);
      lines.forEach(l => {
        if (!seenTexts.has(l)) {
          textBlocks.push(l);
          seenTexts.add(l);
        }
      });
    }

    // Call the rephraser with default settings for the quick action
    // This will skip the setup step and go directly to processing
    const quickActionData = {
      action,
      selectedText,
      textBlocks,
      editor,
      isQuickAction: true
    };
    
    // Simulate the API call and show comparison step
    try {
      onRephraseClick(selectedText, textBlocks, editor);
      setIsLoading(null);
    } catch (error) {
      console.error('Quick action failed:', error);
      setIsLoading(null);
    }
  };

  const getSelectedText = () => {
    if (!editor) return '';
    const { state } = editor;
    const { selection } = state;
    const { from, to } = selection;
    return state.doc.textBetween(from, to, ' ');
  };

  const hasSelection = () => {
    if (!editor) return false;
    const { state } = editor;
    const { selection } = state;
    return !selection.empty;
  };

  const selectedText = getSelectedText();
  const isTextSelected = hasSelection();

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-80 bg-background/95 backdrop-blur-sm border border-border/50 shadow-lg p-3">
        <div className="flex flex-col gap-3">
          {/* First Row - Basic Editing Tools */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(selectedText);
              }}
              disabled={!isTextSelected}
              className="flex items-center gap-1 h-8 px-2 text-xs"
            >
              <Copy className="w-3 h-3" />
              Copy
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(selectedText);
                editor?.commands.deleteSelection();
              }}
              disabled={!isTextSelected}
              className="flex items-center gap-1 h-8 px-2 text-xs"
            >
              <Scissors className="w-3 h-3" />
              Cut
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  editor?.commands.insertContent(text);
                } catch (err) {
                  console.error('Failed to paste:', err);
                }
              }}
              className="flex items-center gap-1 h-8 px-2 text-xs"
            >
              <Clipboard className="w-3 h-3" />
              Paste
            </Button>

            {isTextSelected && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className="flex items-center gap-1 h-8 px-2 text-xs"
                >
                  <Bold className="w-3 h-3" />
                  Bold
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className="flex items-center gap-1 h-8 px-2 text-xs"
                >
                  <Italic className="w-3 h-3" />
                  Italic
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleUnderline().run()}
                  className="flex items-center gap-1 h-8 px-2 text-xs"
                >
                  <Underline className="w-3 h-3" />
                  Underline
                </Button>
              </>
            )}
          </div>

          {/* Separator */}
          {isTextSelected && (
            <div className="h-px bg-border/50" />
          )}

          {/* Second Row - AI Features */}
          {isTextSelected && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickAction('rephrase')}
                disabled={isLoading === 'rephrase'}
                className="flex items-center gap-1 h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                {isLoading === 'rephrase' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                Rephrase
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickAction('expand')}
                disabled={isLoading === 'expand'}
                className="flex items-center gap-1 h-8 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                {isLoading === 'expand' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Expand className="w-3 h-3" />
                )}
                Expand
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickAction('shorten')}
                disabled={isLoading === 'shorten'}
                className="flex items-center gap-1 h-8 px-2 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                {isLoading === 'shorten' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Minimize2 className="w-3 h-3" />
                )}
                Shorten
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickAction('validate')}
                disabled={isLoading === 'validate'}
                className="flex items-center gap-1 h-8 px-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              >
                {isLoading === 'validate' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCircle className="w-3 h-3" />
                )}
                Validate
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRephrase}
                className="flex items-center gap-1 h-8 px-2 text-xs text-gray-600 hover:text-gray-700 hover:bg-gray-50"
              >
                <Settings className="w-3 h-3" />
                Settings
              </Button>
            </div>
          )}
        </div>
      </ContextMenuContent>
    </ContextMenu>
  );
};
