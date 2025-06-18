import React, { useEffect, useRef, useState } from 'react';
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
import { TrackChangesToggle } from './TrackChangesToggle';
import { ChangesSidebar } from './ChangesSidebar';
import { useCollaboration } from '@/hooks/useCollaboration';
import { useUserContext } from '@/lib/UserContextProvider';
import { cn } from '@/lib/utils';
import './editor-styles.css';
import './collaboration-styles.css';
import { Node } from '@tiptap/core';
import { consolidateTrackChanges, extractChangesFromContent } from '@/utils/trackChangesUtils';

interface CollaborativeRichTextEditorProps {
  content: any;
  onChange: (content: any, totalCharacters: any, totalWords: any) => void;
  placeholder?: string;
  className?: string;
  blockId: string;
  selectedChapter: any;
  showTrackChanges?: boolean;
  onTrackChangesToggle?: (show: boolean) => void;
}

const SceneDivider = Node.create({
  name: 'sceneDivider',

  group: 'block',
  content: '',
  parseHTML() {
    return [
      {
        tag: 'hr.scene-divider',
      },
    ];
  },
  renderHTML() {
    return ['hr', { class: 'scene-divider border-t-2 border-dashed border-gray-400 my-4' }];
  },

  addCommands() {
    return {
      insertSceneDivider: () => ({ commands }) => {
        return commands.insertContent({ type: 'sceneDivider' });
      },
    } as any;
  },

  addNodeView() {
    return ({ node, getPos }) => {
      const dom = document.createElement('hr');
      dom.className = 'scene-divider border-t-2 border-dashed border-gray-400 my-4';

      dom.addEventListener('click', () => {
        console.log('Scene divider clicked at position:', getPos());
      });

      return {
        dom,
      };
    };
  },
});

export const EditorRichTextEditor: React.FC<CollaborativeRichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start writing your story...',
  className,
  blockId,
  selectedChapter,
  showTrackChanges = false,
  onTrackChangesToggle,
}) => {
  const { userId, name: userName } = useUserContext();
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

  const [extractedChanges, setExtractedChanges] = useState<any[]>([]);
  const latestContentRef = useRef<any>(null);
  const initialContentLoaded = useRef(false);
  
  console.log('Editor content type:', typeof content);
  console.log("📄 Editor received content:", content);
  
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

      // Extract changes for display
      const changes = extractChangesFromContent(updated);
      setExtractedChanges(changes);

      const plainText = editor.getText();
      const totalCharacters = plainText.length;
      const totalWords = plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
      
      // Store editor reference in transaction meta for track changes
      transaction.setMeta('editor', editor);
      
      if (editMode !== 'review') {
        // Consolidate track changes before saving
        const consolidatedContent = consolidateTrackChanges(updated);
        console.log('Saving consolidated content:', consolidatedContent);
        onChange(consolidatedContent, totalCharacters, totalWords);
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

  // Handle accept/reject changes
  const handleAcceptChange = (changeId: string) => {
    if (editor) {
      editor.commands.acceptChange(changeId);
      // Update extracted changes after accepting
      const updated = editor.getJSON();
      const changes = extractChangesFromContent(updated);
      setExtractedChanges(changes);
    }
  };

  const handleRejectChange = (changeId: string) => {
    if (editor) {
      editor.commands.rejectChange(changeId);
      // Update extracted changes after rejecting
      const updated = editor.getJSON();
      const changes = extractChangesFromContent(updated);
      setExtractedChanges(changes);
    }
  };

  // Handle clicking on a change to focus it
  const handleChangeClick = (changeId: string) => {
    if (editor) {
      // Find the change in the document and scroll to it
      const { state } = editor;
      state.doc.descendants((node, pos) => {
        if (node.marks) {
          const trackChangeMark = node.marks.find(mark => 
            mark.type.name === 'textStyle' && mark.attrs.changeId === changeId
          );
          if (trackChangeMark) {
            // Focus the editor and set selection to this position
            editor.commands.focus();
            editor.commands.setTextSelection({ from: pos, to: pos + node.nodeSize });
            
            // Scroll the change into view
            const element = editor.view.dom.querySelector(`[data-change-id="${changeId}"]`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return false; // Stop searching
          }
        }
      });
    }
  };

  // Load content only once
  useEffect(() => {
    if (!editor || initialContentLoaded.current) return;

    if (content?.type === 'doc') {
      editor.commands.setContent(content);
      latestContentRef.current = content;
      initialContentLoaded.current = true;
      
      // Extract initial changes
      const changes = extractChangesFromContent(content);
      setExtractedChanges(changes);
      
      console.log('Editor content set on load.');
    } else {
      editor.commands.clearContent();
    }
  }, [editor, content]);

  // Update track changes when showTrackChanges changes
  useEffect(() => {
    if (editor) {
      editor.commands.toggleTrackChanges(showTrackChanges);
      
      // Update CSS classes
      const editorElement = editor.view.dom;
      if (showTrackChanges) {
        editorElement.classList.remove('hide-track-changes');
      } else {
        editorElement.classList.add('hide-track-changes');
      }
    }
  }, [editor, showTrackChanges]);

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
    return () => {
      if (editor) {
        editor.destroy();
        initialContentLoaded.current = false; 
        console.log('Editor destroyed on unmount');
      }
    };
  }, []);

  return (
    <div className="h-full flex bg-background/50 rounded-2xl border border-border/50 shadow-lg backdrop-blur-sm overflow-hidden">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-background/80">
          <EditModeSelector currentMode={editMode} onModeChange={setEditMode} currentUser={currentUser} />
          <div className="flex items-center space-x-2">
            <TrackChangesToggle 
              showChanges={showTrackChanges} 
              onToggle={onTrackChangesToggle || (() => {})} 
            />
          </div>
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
      </div>
    </div>
  );
};

// Add props interface to pass changes to parent
export interface EditorRichTextEditorRef {
  extractedChanges: any[];
  handleAcceptChange: (changeId: string) => void;
  handleRejectChange: (changeId: string) => void;
  handleChangeClick: (changeId: string) => void;
}

// Export the handler functions for parent components
export { handleAcceptChange, handleRejectChange, handleChangeClick };
