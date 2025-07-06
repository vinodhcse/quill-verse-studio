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
import { Button } from '@/components/ui/button';
import { useCollaboration } from '@/hooks/useCollaboration';
import { useUserContext } from '@/lib/UserContextProvider';
import { cn } from '@/lib/utils';
import './editor-styles.css';
import './collaboration-styles.css';
import { Node } from '@tiptap/core';
import { consolidateTrackChanges, extractChangesFromContent } from '@/utils/trackChangesUtils';
import { useLocation } from 'react-router-dom';
import { useClipboard } from '@/hooks/useClipboard';
import { AIRephraserModal } from '@/components/AIRephraserModal';

interface CollaborativeRichTextEditorProps {
  content: any;
  onChange: (content: any, totalCharacters: any, totalWords: any) => void;
  placeholder?: string;
  className?: string;
  blockId: string;
  selectedChapter: any;
  showTrackChanges?: boolean;
  onTrackChangesToggle?: (show: boolean) => void;
  onExtractedChangesUpdate?: (changes: any[]) => void;
  onAcceptChange?: (changeId: string) => void;
  onRejectChange?: (changeId: string) => void;
  onChangeClick?: (changeId: string) => void;
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
  onExtractedChangesUpdate,
  onAcceptChange,
  onRejectChange,
  onChangeClick,
}) => {
  const { userId, name: userName } = useUserContext();
  const location = useLocation();
  
  // Determine if we're in edit mode based on the route
  const isEditMode = location.pathname.includes('/edit');
  
  // Local state for track changes functionality
  const [trackChangesEnabled, setTrackChangesEnabled] = useState(isEditMode); // Always on for edit mode
  const [showChangesEnabled, setShowChangesEnabled] = useState(showTrackChanges);
  
  // AI Rephraser modal state
  const [showRephraserModal, setShowRephraserModal] = useState(false);
  const [selectedTextForRephrasing, setSelectedTextForRephrasing] = useState('');
  const [textBlocksForRephrasing, setTextBlocksForRephrasing] = useState<string[]>([]);
  
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
  
  const { copyToClipboard, canCopy } = useClipboard();

  // Handle rephraser modal
  const handleRephraseClick = (selectedText: string, textBlocks: string[]) => {
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
        enabled: trackChangesEnabled,
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
      
      // Pass changes to parent component
      if (onExtractedChangesUpdate) {
        onExtractedChangesUpdate(changes);
      }

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
          !showChangesEnabled && 'hide-track-changes',
          className
        ),
      },
      handleKeyDown(view, event) {
        // Handle Ctrl+C / Cmd+C
        if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
          event.preventDefault();
          const { state } = view;
          const { from, to } = state.selection;
          const selectedText = state.doc.textBetween(from, to);
          
          if (selectedText) {
            copyToClipboard(selectedText).then((success) => {
              if (!success) {
                console.log('Copy operation was blocked by clipboard control');
              }
            });
          }
          return true;
        }
        
        if (event.key === 'Enter') {
          const { selection } = view.state;
          if (selection.empty && selection.$head.pos === view.state.doc.content.size) {
            event.preventDefault();
            return true;
          }
        }
        return false;
      },
      handleClick(view, pos, event) {
        // Check if clicked on a tracked change
        const { state } = view;
        const resolvedPos = state.doc.resolve(pos);
        
        // Fix: resolvedPos.marks is a function, need to call it
        const marks = resolvedPos.marks();
        if (marks && marks.length > 0) {
          const trackChangeMark = marks.find(mark => 
            mark.type.name === 'textStyle' && mark.attrs.changeId
          );
          
          if (trackChangeMark && trackChangeMark.attrs.changeId) {
            const changeId = trackChangeMark.attrs.changeId;
            console.log('Editor: Clicked on tracked change:', changeId);
            
            // Notify sidebar to highlight this change
            window.dispatchEvent(new CustomEvent('changeFocus', {
              detail: { changeId }
            }));
          }
        }
        
        return false;
      },
      clipboardTextSerializer: () => {
        // Prevent default text serialization
        return '';
      },
    },
  });

  // Listen for sidebar events
  useEffect(() => {
    const handleFocusChange = (event: CustomEvent) => {
      const changeId = event.detail.changeId;
      handleChangeClick(changeId);
    };

    const handleAcceptChangeEvent = (event: CustomEvent) => {
      const changeId = event.detail.changeId;
      handleAcceptChange(changeId);
    };

    const handleRejectChangeEvent = (event: CustomEvent) => {
      const changeId = event.detail.changeId;
      handleRejectChange(changeId);
    };

    window.addEventListener('focusChange', handleFocusChange as EventListener);
    window.addEventListener('acceptChange', handleAcceptChangeEvent as EventListener);
    window.addEventListener('rejectChange', handleRejectChangeEvent as EventListener);

    return () => {
      window.removeEventListener('focusChange', handleFocusChange as EventListener);
      window.removeEventListener('acceptChange', handleAcceptChangeEvent as EventListener);
      window.removeEventListener('rejectChange', handleRejectChangeEvent as EventListener);
    };
  }, [editor]);

  // Handle accept/reject changes
  const handleAcceptChange = (changeId: string) => {
    console.log('EditorRichTextEditor: Accepting change:', changeId);
    if (editor) {
      editor.commands.acceptChange(changeId);
      // Update extracted changes after accepting
      setTimeout(() => {
        const updated = editor.getJSON();
        const changes = extractChangesFromContent(updated);
        setExtractedChanges(changes);
        if (onExtractedChangesUpdate) {
          onExtractedChangesUpdate(changes);
        }
      }, 100);
      
      // Dispatch event to notify sidebar
      window.dispatchEvent(new CustomEvent('changeAccepted', {
        detail: { changeId }
      }));
    }
    if (onAcceptChange) {
      onAcceptChange(changeId);
    }
  };

  const handleRejectChange = (changeId: string) => {
    console.log('EditorRichTextEditor: Rejecting change:', changeId);
    if (editor) {
      editor.commands.rejectChange(changeId);
      // Update extracted changes after rejecting
      setTimeout(() => {
        const updated = editor.getJSON();
        const changes = extractChangesFromContent(updated);
        setExtractedChanges(changes);
        if (onExtractedChangesUpdate) {
          onExtractedChangesUpdate(changes);
        }
      }, 100);
      
      // Dispatch event to notify sidebar
      window.dispatchEvent(new CustomEvent('changeRejected', {
        detail: { changeId }
      }));
    }
    if (onRejectChange) {
      onRejectChange(changeId);
    }
  };

  // Handle clicking on a change to focus it
  const handleChangeClick = (changeId: string) => {
    console.log('EditorRichTextEditor: Focusing change:', changeId);
    if (editor) {
      // Find the change in the document and scroll to it
      const { state } = editor;
      let found = false;
      
      state.doc.descendants((node, pos) => {
        if (!found && node.marks) {
          const trackChangeMark = node.marks.find(mark => 
            mark.type.name === 'textStyle' && mark.attrs.changeId === changeId
          );
          if (trackChangeMark) {
            // Focus the editor and set selection to this position
            editor.commands.focus();
            editor.commands.setTextSelection({ from: pos, to: pos + node.nodeSize });
            
            // Add a visual highlight temporarily
            const element = editor.view.dom.querySelector(`[data-change-id="${changeId}"]`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              element.classList.add('highlighted-change');
              setTimeout(() => {
                element.classList.remove('highlighted-change');
              }, 2000);
            }

            found = true;
            return false; // Stop searching
          }
        }
      });
    }
    if (onChangeClick) {
      onChangeClick(changeId);
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
      if (onExtractedChangesUpdate) {
        onExtractedChangesUpdate(changes);
      }
      
      console.log('Editor content set on load.');
    } else {
      editor.commands.clearContent();
    }
  }, [editor, content]);

  // Update track changes when trackChangesEnabled changes
  useEffect(() => {
    if (editor) {
      editor.commands.toggleTrackChanges(trackChangesEnabled);
    }
  }, [editor, trackChangesEnabled]);

  // Update visibility when showChangesEnabled changes
  useEffect(() => {
    if (editor) {
      // Update CSS classes
      const editorElement = editor.view.dom;
      if (showChangesEnabled) {
        editorElement.classList.remove('hide-track-changes');
      } else {
        editorElement.classList.add('hide-track-changes');
      }
    }
    
    // Also update parent component and control sidebar visibility
    if (onTrackChangesToggle) {
      onTrackChangesToggle(showChangesEnabled);
    }

    // Dispatch event to control sidebar visibility
    window.dispatchEvent(new CustomEvent('toggleSidebarChanges', {
      detail: { showChanges: showChangesEnabled }
    }));
  }, [editor, showChangesEnabled]);

  const handleTrackChangesToggle = (enabled: boolean) => {
    if (isEditMode) {
      // In edit mode, track changes should always be on
      return;
    }
    setTrackChangesEnabled(enabled);
  };

  const handleShowChangesToggle = (show: boolean) => {
    setShowChangesEnabled(show);
  };

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
    <div className="h-full flex flex-col bg-background/50 rounded-2xl border border-border/50 shadow-lg backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-background/80">
        <EditModeSelector 
          currentMode={editMode} 
          onModeChange={setEditMode} 
          currentUser={currentUser}
          trackChangesEnabled={trackChangesEnabled}
          showChangesEnabled={showChangesEnabled}
          onTrackChangesToggle={handleTrackChangesToggle}
          onShowChangesToggle={handleShowChangesToggle}
          isEditMode={isEditMode}
          fileStatus="Auto-saved"
        />
        
        {/* Add clipboard status indicator */}
        {window.__TAURI__ && (
          <div className={`text-xs px-2 py-1 rounded-full ${
            canCopy 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {canCopy ? 'Copy Enabled' : 'Copy Restricted'}
          </div>
        )}
      </div>

      <EditorToolbar editor={editor} />

      <div className="flex-1 overflow-hidden">
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto relative">
          <TextContextMenu editor={editor} onRephraseClick={handleRephraseClick}>
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
      </div>

      {/* AI Rephraser Modal */}
      <AIRephraserModal
        isOpen={showRephraserModal}
        onClose={() => setShowRephraserModal(false)}
        selectedText={selectedTextForRephrasing}
        textBlocks={textBlocksForRephrasing}
        bookId={state.bookId || ''}
        versionId={state.versionId || ''}
        chapterId={selectedChapter?.id || ''}
        onApplyChanges={handleApplyRephrasedText}
      />
    </div>
  );
};

// Export interface for parent components to use
export interface EditorRichTextEditorRef {
  extractedChanges: any[];
  handleAcceptChange: (changeId: string) => void;
  handleRejectChange: (changeId: string) => void;
  handleChangeClick: (changeId: string) => void;
}
