
import React from 'react';
import { Editor } from '@tiptap/react';

interface EditorStatusBarProps {
  editor: Editor;
  editMode: string;
}

export const EditorStatusBar: React.FC<EditorStatusBarProps> = ({ editor, editMode }) => {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-border/50 text-xs text-muted-foreground bg-background/50 z-50">
      <div className="flex items-center space-x-4">
        <span className="px-2 py-1 bg-muted/50 rounded-full">
          {editor.storage.characterCount.characters()} characters
        </span>
        <span className="px-2 py-1 bg-muted/50 rounded-full">
          {editor.storage.characterCount.words()} words
        </span>
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
          {editMode} mode • TipTap
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>Auto-saved</span>
      </div>
    </div>
  );
};
