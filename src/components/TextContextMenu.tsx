
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { Bold, Italic, Underline, Link, RefreshCw, Copy, Scissors, Clipboard } from 'lucide-react';

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
      <ContextMenuContent className="w-64 bg-background/95 backdrop-blur-sm border border-border/50 shadow-lg">
        {isTextSelected && (
          <>
            <ContextMenuItem
              onClick={() => {
                navigator.clipboard.writeText(selectedText);
              }}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy
            </ContextMenuItem>
            
            <ContextMenuItem
              onClick={() => {
                navigator.clipboard.writeText(selectedText);
                editor?.commands.deleteSelection();
              }}
              className="flex items-center gap-2"
            >
              <Scissors className="w-4 h-4" />
              Cut
            </ContextMenuItem>
            
            <ContextMenuSeparator />
            
            <ContextMenuItem
              onClick={handleRephrase}
              className="flex items-center gap-2 text-primary hover:text-primary focus:text-primary"
            >
              <RefreshCw className="w-4 h-4" />
              Rephrase with AI
            </ContextMenuItem>
            
            <ContextMenuSeparator />
          </>
        )}
        
        <ContextMenuItem
          onClick={async () => {
            try {
              const text = await navigator.clipboard.readText();
              editor?.commands.insertContent(text);
            } catch (err) {
              console.error('Failed to paste:', err);
            }
          }}
          className="flex items-center gap-2"
        >
          <Clipboard className="w-4 h-4" />
          Paste
        </ContextMenuItem>

        {isTextSelected && (
          <>
            <ContextMenuSeparator />
            
            <ContextMenuItem
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className="flex items-center gap-2"
            >
              <Bold className="w-4 h-4" />
              Bold
            </ContextMenuItem>
            
            <ContextMenuItem
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className="flex items-center gap-2"
            >
              <Italic className="w-4 h-4" />
              Italic
            </ContextMenuItem>
            
            <ContextMenuItem
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              className="flex items-center gap-2"
            >
              <Underline className="w-4 h-4" />
              Underline
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};
