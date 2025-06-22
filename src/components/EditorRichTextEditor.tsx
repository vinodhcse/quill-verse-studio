
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import CharacterCount from '@tiptap/extension-character-count';
import { EditorToolbar } from './EditorToolbar';
import { TrackChangesExtension } from '../extensions/TrackChangesExtension';
import { PageAccessControlExtension } from '../extensions/PageAccessControlExtension';
import { CommentExtension } from '../extensions/CommentExtension';
import { Chapter } from '@/types/collaboration';

export interface EditorRichTextEditorProps {
  content: any;
  onChange: (content: any, charCount: number, wordCount: number) => void;
  className?: string;
  blockId: string;
  selectedChapter?: Chapter;
  showTrackChanges?: boolean;
  onTrackChangesToggle?: React.Dispatch<React.SetStateAction<boolean>>;
  showChanges?: boolean;
  changes?: any[];
  onChangeClick?: (changeId: string) => void;
}

export const EditorRichTextEditor: React.FC<EditorRichTextEditorProps> = ({
  content,
  onChange,
  className = '',
  blockId,
  selectedChapter,
  showTrackChanges = false,
  onTrackChangesToggle,
  showChanges = false,
  changes = [],
  onChangeClick
}) => {
  const [isTrackingChanges, setIsTrackingChanges] = useState(showTrackChanges);
  const contentRef = useRef(content);

  const handleTrackChangesToggle = useCallback(() => {
    const newValue = !isTrackingChanges;
    setIsTrackingChanges(newValue);
    if (onTrackChangesToggle) {
      onTrackChangesToggle(newValue);
    }
  }, [isTrackingChanges, onTrackChangesToggle]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Color,
      TextStyle,
      FontFamily,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      CharacterCount,
      TrackChangesExtension.configure({
        enabled: isTrackingChanges,
      }),
      PageAccessControlExtension,
      CommentExtension,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const newContent = editor.getJSON();
      const charCount = editor.storage.characterCount.characters();
      const wordCount = editor.storage.characterCount.words();
      
      // Only trigger onChange if content actually changed
      if (JSON.stringify(newContent) !== JSON.stringify(contentRef.current)) {
        contentRef.current = newContent;
        onChange(newContent, charCount, wordCount);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-4',
      },
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content && JSON.stringify(content) !== JSON.stringify(contentRef.current)) {
      editor.commands.setContent(content);
      contentRef.current = content;
    }
  }, [content, editor]);

  // Update track changes extension when toggle changes
  useEffect(() => {
    if (editor) {
      editor.extensionManager.extensions.forEach(extension => {
        if (extension.name === 'trackChanges') {
          extension.options.enabled = isTrackingChanges;
        }
      });
    }
  }, [editor, isTrackingChanges]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className={`border rounded-lg ${className}`}>
      <EditorToolbar 
        editor={editor} 
        showTrackChanges={showTrackChanges}
        isTrackingChanges={isTrackingChanges}
        onTrackChangesToggle={handleTrackChangesToggle}
      />
      <div className="relative">
        <EditorContent editor={editor} />
        
        {/* Character and Word Count */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow">
          {editor.storage.characterCount.characters()} chars, {editor.storage.characterCount.words()} words
        </div>
      </div>
      
      {/* Changes Sidebar */}
      {showChanges && changes.length > 0 && (
        <div className="border-t p-4 bg-gray-50">
          <h3 className="font-semibold mb-2">Recent Changes</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {changes.map((change: any) => (
              <div 
                key={change.id} 
                className="text-sm p-2 bg-white rounded cursor-pointer hover:bg-gray-100"
                onClick={() => onChangeClick && onChangeClick(change.id)}
              >
                <div className="font-medium">{change.type}</div>
                <div className="text-gray-600 truncate">{change.content}</div>
                <div className="text-xs text-gray-400">{change.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
