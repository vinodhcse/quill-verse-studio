
import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Focus from '@tiptap/extension-focus';
import TextStyle from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { CommentExtension } from '@/extensions/CommentExtension';
import { TrackChangesExtension } from '@/extensions/TrackChangesExtension';
import { EditorToolbar } from './EditorToolbar';
import { EditModeSelector } from './EditModeSelector';
import { TextContextMenu } from './TextContextMenu';
import { useCollaboration } from '@/hooks/useCollaboration';
import { cn } from '@/lib/utils';
import './collaboration-styles.css';

interface CollaborativeRichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  blockId: string;
}

export const CollaborativeRichTextEditor: React.FC<CollaborativeRichTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Start writing your story...",
  className,
  blockId
}) => {
  const {
    currentUser,
    editMode,
    setEditMode,
    changeLogs,
    comments,
    addChangeLog,
    acceptChange,
    rejectChange,
    addComment,
  } = useCollaboration();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextStyle,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount,
      Focus.configure({
        className: 'has-focus',
        mode: 'all',
      }),
      CommentExtension,
      TrackChangesExtension.configure({
        userId: currentUser.id,
        userName: currentUser.name,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      
      // In suggest mode, we track changes instead of directly updating
      if (editMode === 'suggest') {
        console.log('Change detected in suggest mode:', newContent);
        onChange(newContent);
      } else if (editMode === 'edit') {
        onChange(newContent);
      }
    },
    editable: editMode !== 'review',
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose-base max-w-none focus:outline-none',
          'min-h-[calc(100vh-20rem)] p-4 text-base leading-relaxed',
          editMode === 'review' && 'cursor-default',
          className
        ),
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <EditModeSelector
            currentMode={editMode}
            onModeChange={setEditMode}
            currentUser={currentUser}
          />
        </div>
        
        <EditorToolbar editor={editor} />
        
        <div className="flex-1 overflow-hidden">
          <TextContextMenu editor={editor}>
            <EditorContent 
              editor={editor} 
              className="h-full overflow-y-auto"
            />
          </TextContextMenu>
        </div>
        
        <div className="flex items-center justify-between px-4 py-2 border-t text-xs text-muted-foreground bg-background/50">
          <div className="flex items-center space-x-4">
            <span>
              {editor.storage.characterCount.characters()} characters
            </span>
            <span>
              {editor.storage.characterCount.words()} words
            </span>
            <span className="text-xs bg-primary/10 px-2 py-1 rounded">
              {editMode} mode
            </span>
          </div>
          <div>
            Last saved: just now
          </div>
        </div>
      </div>
    </div>
  );
};
