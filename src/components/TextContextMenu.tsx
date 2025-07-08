
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
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Copy, 
  Scissors, 
  Clipboard,
  RefreshCw,
  Expand,
  Minimize,
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
      <ContextMenuContent className="w-auto min-w-0 p-2">
        {/* First row - Basic formatting tools (icons only) */}
        <div className="flex items-center gap-1 mb-2">
          <button
            onClick={async () => {
              navigator.clipboard.writeText(selectedText);
            }}
            disabled={!isTextSelected}
            className="p-2 rounded hover:bg-accent transition-colors disabled:opacity-50"
            title="Copy"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={async () => {
              navigator.clipboard.writeText(selectedText);
              editor?.commands.deleteSelection();
            }}
            disabled={!isTextSelected}
            className="p-2 rounded hover:bg-accent transition-colors disabled:opacity-50"
            title="Cut"
          >
            <Scissors size={16} />
          </button>
          <button
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                editor?.commands.insertContent(text);
              } catch (err) {
                console.error('Failed to paste:', err);
              }
            }}
            className="p-2 rounded hover:bg-accent transition-colors"
            title="Paste"
          >
            <Clipboard size={16} />
          </button>
          
          {isTextSelected && (
            <>
              <div className="w-px h-6 bg-border mx-1" />
              <button
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={`p-2 rounded hover:bg-accent transition-colors ${
                  editor?.isActive('bold') ? 'bg-accent' : ''
                }`}
                title="Bold"
              >
                <Bold size={16} />
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={`p-2 rounded hover:bg-accent transition-colors ${
                  editor?.isActive('italic') ? 'bg-accent' : ''
                }`}
                title="Italic"
              >
                <Italic size={16} />
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                className={`p-2 rounded hover:bg-accent transition-colors ${
                  editor?.isActive('underline') ? 'bg-accent' : ''
                }`}
                title="Underline"
              >
                <Underline size={16} />
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleStrike().run()}
                className={`p-2 rounded hover:bg-accent transition-colors ${
                  editor?.isActive('strike') ? 'bg-accent' : ''
                }`}
                title="Strikethrough"
              >
                <Strikethrough size={16} />
              </button>
              <div className="w-px h-6 bg-border mx-1" />
              <button
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded hover:bg-accent transition-colors ${
                  editor?.isActive('bulletList') ? 'bg-accent' : ''
                }`}
                title="Bullet List"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                className={`p-2 rounded hover:bg-accent transition-colors ${
                  editor?.isActive('orderedList') ? 'bg-accent' : ''
                }`}
                title="Numbered List"
              >
                <ListOrdered size={16} />
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                className={`p-2 rounded hover:bg-accent transition-colors ${
                  editor?.isActive('blockquote') ? 'bg-accent' : ''
                }`}
                title="Quote"
              >
                <Quote size={16} />
              </button>
            </>
          )}
        </div>

        {/* Second row - AI features (icons + text) */}
        {isTextSelected && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleQuickAction('rephrase')}
              disabled={isLoading === 'rephrase'}
              className="px-3 py-2 rounded bg-muted hover:bg-muted/80 transition-colors text-sm flex items-center gap-1.5"
              title="Rephrase text"
            >
              {isLoading === 'rephrase' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Rephrase
            </button>
            <button
              onClick={() => handleQuickAction('expand')}
              disabled={isLoading === 'expand'}
              className="px-3 py-2 rounded bg-muted hover:bg-muted/80 transition-colors text-sm flex items-center gap-1.5"
              title="Expand text"
            >
              {isLoading === 'expand' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Expand size={14} />
              )}
              Expand
            </button>
            <button
              onClick={() => handleQuickAction('shorten')}
              disabled={isLoading === 'shorten'}
              className="px-3 py-2 rounded bg-muted hover:bg-muted/80 transition-colors text-sm flex items-center gap-1.5"
              title="Shorten text"
            >
              {isLoading === 'shorten' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Minimize size={14} />
              )}
              Shorten
            </button>
            <button
              onClick={() => handleQuickAction('validate')}
              disabled={isLoading === 'validate'}
              className="px-3 py-2 rounded bg-muted hover:bg-muted/80 transition-colors text-sm flex items-center gap-1.5"
              title="Validate text"
            >
              {isLoading === 'validate' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle size={14} />
              )}
              Validate
            </button>
            <button
              onClick={handleRephrase}
              className="px-3 py-2 rounded bg-muted hover:bg-muted/80 transition-colors text-sm flex items-center gap-1.5"
              title="Open AI Settings"
            >
              <Settings size={14} />
              Settings
            </button>
          </div>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};
