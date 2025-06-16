import React, { useState, useEffect } from 'react';
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
import FontFamily from '@tiptap/extension-font-family';
import FontSize from '@tiptap/extension-font-size';
import Color from '@tiptap/extension-color';
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
  content: any;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  blockId: string;
  selectedChapter: any;
}

export const CollaborativeRichTextEditor: React.FC<CollaborativeRichTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Start writing your story...",
  className,
  blockId,
  selectedChapter
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

  //console.log('Editor content type:', typeof content);
  //console.log("📄 Editor received content:", content);
  //const safeContent = JSON.parse(JSON.stringify(content));
  //console.log("📄 SSafe content:", safeContent);
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
        }
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
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
      FontFamily.configure({
        types: ['textStyle'],
      }),
      FontSize.configure({
        types: ['textStyle'],
      }),
      Color.configure({
        types: ['textStyle'],
      }),
    ],
    content: content?.type === 'doc' ? content : { type: 'doc', content: [] },
    onUpdate: ({ editor }) => {
      const newContent = editor.getJSON();
      if (editMode === 'suggest') {
        console.log('Change detected in suggest mode:', newContent);
        console.log('Change detected in JSON mode:', editor.getJSON());
        onChange(JSON.stringify(newContent));
      } else if (editMode === 'edit') {
        console.log('Change detected in Edit  mode:', editor.getJSON());
        onChange(JSON.stringify(newContent));
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
          console.log('TipTap editor content', editor.getJSON());
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
        <div className="relative inline-block w-12 h-12">
          <span className="absolute inline-block w-full h-full border-4 border-t-primary border-b-secondary rounded-full animate-spin"></span>
        </div>
      </div>
    );
  }

  useEffect(() => {
  console.log('useEffect triggered with content:', content);
  if (editor && content?.type === 'doc') {
    editor.commands.setContent(content); // dynamically inject content
    console.log('Editor content set via useEffect');
  } else if (editor) {
    editor.commands.clearContent(); // clear editor content for empty chapters
    console.log('Editor content cleared via useEffect');
  }
}, [editor, content]);

/*useEffect(() => {
  if (!editor || !selectedChapter) return;

  if (selectedChapter?.content?.type === 'doc') {
    editor.commands.setContent(selectedChapter.content);
  } else {
    editor.commands.clearContent();
  }
}, [editor, selectedChapter?.id]);*/


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
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto relative">
          <TextContextMenu editor={editor}>
            <EditorContent 
              editor={editor} 
              className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent"
            />
          </TextContextMenu>
        </div>
      </div>
      <div className="flex items-center justify-between px-6 py-3 border-t border-border/50 text-xs text-muted-foreground bg-background/50 z-50 fixed bottom-0 w-full">
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
