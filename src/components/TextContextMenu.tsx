
import React from 'react';
import { Editor } from '@tiptap/react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Bold, Italic, Quote, List, ListOrdered, Heading, Underline, Strikethrough, Expand, RefreshCw, MessageCircle, Minimize, Zap } from 'lucide-react';

interface TextContextMenuProps {
  editor: Editor | null;
  children: React.ReactNode;
  onRephraseClick?: (selectedText: string, textBlocks: string[]) => void;
}

export const TextContextMenu: React.FC<TextContextMenuProps> = ({ 
  editor, 
  children, 
  onRephraseClick 
}) => {
  if (!editor) {
    return <>{children}</>;
  }

  const handleAIAction = (action: string) => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    
    if (!selectedText.trim()) {
      console.log(`No text selected for ${action}`);
      return;
    }

    if (action === 'Rephrase' && onRephraseClick) {
      // Extract text blocks for rephrasing
      const textBlocks = selectedText.split('\n\n').filter(block => block.trim());
      onRephraseClick(selectedText, textBlocks);
      return;
    }

    console.log(`${action} action triggered for text:`, selectedText);
    // TODO: Implement other AI actions
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-auto min-w-0 p-2">
        {/* First row - Basic formatting tools */}
        <div className="flex items-center gap-1 mb-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-accent transition-colors ${
              editor.isActive('bold') ? 'bg-accent' : ''
            }`}
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-accent transition-colors ${
              editor.isActive('italic') ? 'bg-accent' : ''
            }`}
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-accent transition-colors ${
              editor.isActive('underline') ? 'bg-accent' : ''
            }`}
            title="Underline"
          >
            <Underline size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-accent transition-colors ${
              editor.isActive('strike') ? 'bg-accent' : ''
            }`}
            title="Strikethrough"
          >
            <Strikethrough size={16} />
          </button>
          <div className="w-px h-6 bg-border mx-1" />
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-accent transition-colors ${
              editor.isActive('bulletList') ? 'bg-accent' : ''
            }`}
            title="Bullet List"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-accent transition-colors ${
              editor.isActive('orderedList') ? 'bg-accent' : ''
            }`}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-accent transition-colors ${
              editor.isActive('blockquote') ? 'bg-accent' : ''
            }`}
            title="Quote"
          >
            <Quote size={16} />
          </button>
        </div>

        {/* Second row - AI features */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleAIAction('Expand')}
            className="px-3 py-2 rounded bg-muted hover:bg-muted/80 transition-colors text-sm flex items-center gap-1.5"
            title="Expand text"
          >
            <Expand size={14} />
            Expand
          </button>
          <button
            onClick={() => handleAIAction('Rephrase')}
            className="px-3 py-2 rounded bg-muted hover:bg-muted/80 transition-colors text-sm flex items-center gap-1.5"
            title="Rephrase text"
          >
            <RefreshCw size={14} />
            Rephrase
          </button>
          <button
            onClick={() => handleAIAction('Shorten')}
            className="px-3 py-2 rounded bg-muted hover:bg-muted/80 transition-colors text-sm flex items-center gap-1.5"
            title="Shorten text"
          >
            <Minimize size={14} />
            Shorten
          </button>
          <button
            onClick={() => handleAIAction('Generate')}
            className="px-3 py-2 rounded bg-muted hover:bg-muted/80 transition-colors text-sm flex items-center gap-1.5"
            title="Generate more content"
          >
            <Zap size={14} />
            Generate
          </button>
          <button
            onClick={() => handleAIAction('Chat')}
            className="px-3 py-2 rounded bg-muted hover:bg-muted/80 transition-colors text-sm flex items-center gap-1.5"
            title="Chat about selection"
          >
            <MessageCircle size={14} />
            Chat
          </button>
        </div>
      </ContextMenuContent>
    </ContextMenu>
  );
};
