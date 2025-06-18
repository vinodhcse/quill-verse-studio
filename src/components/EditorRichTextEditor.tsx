
import React, { useEffect } from 'react';
import { EditorToolbar } from './EditorToolbar';
import { EditModeSelector } from './EditModeSelector';
import { TrackChangesToggle } from './TrackChangesToggle';
import { EditorContentArea } from './EditorContentArea';
import { EditorStatusBar } from './EditorStatusBar';
import { useCollaboration } from '@/hooks/useCollaboration';
import { useUserContext } from '@/lib/UserContextProvider';
import { useEditorSetup } from '@/hooks/useEditorSetup';
import { useTrackChanges } from '@/hooks/useTrackChanges';
import { consolidateTrackChanges } from '@/utils/trackChangesUtils';
import './editor-styles.css';
import './collaboration-styles.css';

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
  const {
    currentUser,
    editMode,
    setEditMode,
  } = useCollaboration();

  const handleContentUpdate = (content: any, totalCharacters: number, totalWords: number) => {
    const consolidatedContent = consolidateTrackChanges(content);
    console.log('Saving consolidated content:', consolidatedContent);
    onChange(consolidatedContent, totalCharacters, totalWords);
  };

  const { editor, initialContentLoaded } = useEditorSetup({
    placeholder,
    userId: userId || '',
    userName: userName || '',
    showTrackChanges,
    editMode,
    className,
    onUpdate: handleContentUpdate,
    onExtractedChangesUpdate,
  });

  const {
    extractedChanges,
    updateExtractedChanges,
    handleAcceptChange,
    handleRejectChange,
    handleChangeClick,
  } = useTrackChanges({
    editor,
    onExtractedChangesUpdate,
    onAcceptChange,
    onRejectChange,
    onChangeClick,
  });

  // Load content only once
  useEffect(() => {
    if (!editor || initialContentLoaded.current) return;

    if (content?.type === 'doc') {
      editor.commands.setContent(content);
      initialContentLoaded.current = true;
      
      updateExtractedChanges(content);
      console.log('Editor content set on load.');
    } else {
      editor.commands.clearContent();
    }
  }, [editor, content, updateExtractedChanges]);

  // Update track changes when showTrackChanges changes
  useEffect(() => {
    if (editor) {
      editor.commands.toggleTrackChanges(showTrackChanges);
      
      const editorElement = editor.view.dom;
      if (showTrackChanges) {
        editorElement.classList.remove('hide-track-changes');
      } else {
        editorElement.classList.add('hide-track-changes');
      }
    }
  }, [editor, showTrackChanges]);

  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
        initialContentLoaded.current = false; 
        console.log('Editor destroyed on unmount');
      }
    };
  }, [editor]);

  if (!editor) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="relative inline-block w-12 h-12">
          <span className="absolute inline-block w-full h-full border-4 border-t-primary border-b-secondary rounded-full animate-spin"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background/50 rounded-2xl border border-border/50 shadow-lg backdrop-blur-sm overflow-hidden">
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

      <EditorContentArea editor={editor} />

      <EditorStatusBar editor={editor} editMode={editMode} />
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
