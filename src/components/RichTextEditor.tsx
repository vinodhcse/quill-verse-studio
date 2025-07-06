
import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Focus from '@tiptap/extension-focus';
import { EditorToolbar } from './EditorToolbar';
import { TextContextMenu } from './TextContextMenu';
import { AIRephraserModal } from './AIRephraserModal';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  bookId?: string;
  versionId?: string;
  chapterId?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Start writing your story...",
  className,
  bookId = '',
  versionId = '',
  chapterId = ''
}) => {
  // AI Rephraser modal state
  const [showRephraserModal, setShowRephraserModal] = useState(false);
  const [selectedTextForRephrasing, setSelectedTextForRephrasing] = useState('');
  const [textBlocksForRephrasing, setTextBlocksForRephrasing] = useState<string[]>([]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount,
      Focus.configure({
        className: 'has-focus',
        mode: 'all',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose-base max-w-none focus:outline-none',
          'min-h-[calc(100vh-16rem)] p-4 text-base leading-relaxed',
          className
        ),
      },
    },
  });

  // Handle rephraser modal
  const handleRephraseClick = (selectedText: string, textBlocks: string[], editorInstance: any) => {
    setSelectedTextForRephrasing(selectedText);
    setTextBlocksForRephrasing(textBlocks);
    setShowRephraserModal(true);
  };

  const handleApplyRephrasedText = (newText: string) => {
    if (editor) {
      const { from, to } = editor.state.selection;
      
      // Replace the selected text with the rephrased text
      editor.chain()
        .focus()
        .deleteRange({ from, to })
        .insertContent(newText)
        .run();

      // Add temporary highlighting that fades after a minute
      setTimeout(() => {
        const { from: newFrom } = editor.state.selection;
        const newTo = newFrom + newText.length;
        
        // Apply temporary highlight
        editor.chain()
          .setTextSelection({ from: newFrom - newText.length, to: newFrom })
          .setMark('textStyle', { backgroundColor: '#fef3c7' }) // yellow highlight
          .run();

        // Remove highlight after 1 minute
        setTimeout(() => {
          editor.chain()
            .setTextSelection({ from: newFrom - newText.length, to: newFrom })
            .unsetMark('textStyle')
            .run();
        }, 60000);
      }, 100);
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      <EditorToolbar editor={editor} />
      
      <TextContextMenu editor={editor} onRephraseClick={handleRephraseClick}>
        <EditorContent 
          editor={editor} 
          className="flex-1 overflow-y-auto"
        />
      </TextContextMenu>
      
      <div className="flex items-center justify-between px-4 py-2 border-t text-xs text-muted-foreground bg-background/50">
        <div className="flex items-center space-x-4">
          <span>
            {editor.storage.characterCount.characters()} characters
          </span>
          <span>
            {editor.storage.characterCount.words()} words
          </span>
        </div>
        <div>
          Last saved: just now
        </div>
      </div>

      {/* AI Rephraser Modal */}
      <AIRephraserModal
        isOpen={showRephraserModal}
        onClose={() => setShowRephraserModal(false)}
        selectedText={selectedTextForRephrasing}
        textBlocks={textBlocksForRephrasing}
        bookId={bookId}
        versionId={versionId}
        chapterId={chapterId}
        onApplyChanges={handleApplyRephrasedText}
        editor={editor}
      />
    </div>
  );
};
