
import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Focus from '@tiptap/extension-focus';
import TextStyle from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { CommentExtension } from '@/extensions/CommentExtension';
import { TrackChangesExtension } from '@/extensions/TrackChangesExtension';
import { EditorToolbar } from './EditorToolbar';
import { EditModeSelector } from './EditModeSelector';
import { TextContextMenu } from './TextContextMenu';
import { useCollaboration } from '@/hooks/useCollaboration';
import { cn } from '@/lib/utils';
import './editor-styles.css';
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
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
      }),
      Placeholder.configure({
        placeholder,
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
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
      if (editMode === 'suggest') {
        console.log('Change detected in suggest mode:', newContent);
        console.log('Change detected in JSON mode:', editor.getJSON());
        onChange(newContent);
      } else if (editMode === 'edit') {
        console.log('Change detected in Edit  mode:', editor.getJSON());
        onChange(newContent);
      }
    },
    editable: editMode !== 'review',
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose-base lg:prose-lg max-w-none focus:outline-none',
          'min-h-[calc(100vh-16rem)] p-6 text-base leading-relaxed',
          'bg-background rounded-xl',
          editMode === 'review' && 'cursor-default',
          className
        ),
      },
      handleDOMEvents: {
        focus: () => {
          console.log('TipTap editor focused');
          return false;
        },
        blur: () => {
          console.log('TipTap editor blurred');
          return false;
        },
      },
    },
  });

  if (!editor) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background/50 rounded-2xl border border-border/50 shadow-lg backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-background/80">
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
            className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent"
          />
        </TextContextMenu>
      </div>
      
      <div className="flex items-center justify-between px-6 py-3 border-t border-border/50 text-xs text-muted-foreground bg-background/50">
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
    </div>
  );
};
