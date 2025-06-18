
import { useEditor } from '@tiptap/react';
import { useRef } from 'react';
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
import { SceneDivider } from '@/extensions/SceneDividerExtension';
import { cn } from '@/lib/utils';

interface UseEditorSetupOptions {
  placeholder: string;
  userId: string;
  userName: string;
  showTrackChanges: boolean;
  editMode: string;
  className?: string;
  onUpdate: (content: any, totalCharacters: number, totalWords: number) => void;
  onExtractedChangesUpdate?: (changes: any[]) => void;
}

export const useEditorSetup = ({
  placeholder,
  userId,
  userName,
  showTrackChanges,
  editMode,
  className,
  onUpdate,
  onExtractedChangesUpdate,
}: UseEditorSetupOptions) => {
  const latestContentRef = useRef<any>(null);
  const initialContentLoaded = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        blockquote: {
          HTMLAttributes: {
            class: 'bg-gray-100 p-4 rounded-md',
          },
        },
      }),
      TextStyle,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline cursor-pointer' },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
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
        className: '',
        mode: 'all',
      }),
      CommentExtension,
      TrackChangesExtension.configure({
        userId: userId || '',
        userName: userName || '',
        enabled: showTrackChanges,
      }),
      FontFamily.configure({ types: ['textStyle'] }),
      FontSize.configure({ types: ['textStyle'] }),
      Color.configure({ types: ['textStyle'] }),
      SceneDivider,
    ],
    content: { type: 'doc', content: [] },
    onUpdate: ({ editor, transaction }) => {
      const updated = editor.getJSON();
      latestContentRef.current = updated;

      const plainText = editor.getText();
      const totalCharacters = plainText.length;
      const totalWords = plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
      
      transaction.setMeta('editor', editor);
      
      if (editMode !== 'review') {
        onUpdate(updated, totalCharacters, totalWords);
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
          !showTrackChanges && 'hide-track-changes',
          className
        ),
      },
      handleKeyDown(view, event) {
        if (event.key === 'Enter') {
          const { selection } = view.state;
          if (selection.empty && selection.$head.pos === view.state.doc.content.size) {
            event.preventDefault();
            return true;
          }
        }
        return false;
      },
    },
  });

  return {
    editor,
    latestContentRef,
    initialContentLoaded,
  };
};
