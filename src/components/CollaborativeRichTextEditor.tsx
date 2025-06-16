import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import FontFamily from '@tiptap/extension-font-family';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import CharacterCount from '@tiptap/extension-character-count';
import Focus from '@tiptap/extension-focus';
import { Node } from '@tiptap/core';
import { EditorToolbar } from './EditorToolbar';
import { TrackChangesExtension } from '../extensions/TrackChangesExtension';
import { CommentExtension } from '../extensions/CommentExtension';
import './editor-styles.css';

interface CollaborativeRichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  trackChanges?: boolean;
  showComments?: boolean;
  userColor?: string;
  userName?: string;
  isReadOnly?: boolean;
}

const SceneDivider = Node.create({
  name: 'sceneDivider',
  
  group: 'block',
  
  parseHTML() {
    return [
      {
        tag: 'div[data-type="scene-divider"]',
      },
    ];
  },

  renderHTML() {
    return ['div', { 'data-type': 'scene-divider', class: 'scene-divider' }, ['hr']];
  },

  addCommands() {
    return {
      insertSceneDivider: () => ({ commands }) => {
        return commands.insertContent({ type: this.name });
      },
    };
  },
});

export const CollaborativeRichTextEditor: React.FC<CollaborativeRichTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Start writing...",
  trackChanges = false,
  showComments = false,
  userColor = '#3b82f6',
  userName = 'Anonymous',
  isReadOnly = false
}) => {
  const editor = useEditor({
    editable: !isReadOnly,
    extensions: [
      StarterKit.configure({
        history: true,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Enter heading';
          }

          return placeholder;
        },
      }),
      FontFamily,
      TextStyle,
      Color,
      CharacterCount.configure({
        limit: 100000,
      }),
      Focus,
      SceneDivider,
      ...(trackChanges
        ? [
            TrackChangesExtension.configure({
              user: {
                name: userName,
                color: userColor,
              },
            }),
          ]
        : []),
      ...(showComments
        ? [
            CommentExtension.configure({
              user: {
                name: userName,
                color: userColor,
              },
            }),
          ]
        : []),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="editor-container">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};
