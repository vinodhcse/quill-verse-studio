
import React, { useState, useEffect } from 'react';
import { EditorRichTextEditor } from './EditorRichTextEditor';
import { useBookContext } from '@/lib/BookContextProvider';
import { Mode } from './ModeNavigation';

interface EditCenterPanelProps {
  mode: Mode;
}

export const EditCenterPanel: React.FC<EditCenterPanelProps> = ({ mode }) => {
  const { state, saveChapterContent } = useBookContext();
  const { selectedChapter } = state;
  const [showTrackChanges, setShowTrackChanges] = useState(false);
  const [extractedChanges, setExtractedChanges] = useState<any[]>([]);

  console.log('EditCenterPanel selectedChapter content:', selectedChapter?.content);

  const handleContentChange = async (content: any, totalCharacters: number, totalWords: number) => {
    if (selectedChapter) {
      try {
        await saveChapterContent(selectedChapter.id, content, totalCharacters, totalWords);
      } catch (error) {
        console.error('Failed to save chapter content:', error);
      }
    }
  };

  const handleExtractedChangesUpdate = (changes: any[]) => {
    console.log('EditCenterPanel received extractedChanges:', changes);
    setExtractedChanges(changes);
    
    // Store changes in a way that can be accessed by RightSidebar
    // We'll use a custom event to communicate with RightSidebar
    window.dispatchEvent(new CustomEvent('editorChangesUpdated', { 
      detail: { changes } 
    }));
  };

  const handleTrackChangesToggle = (show: boolean) => {
    setShowTrackChanges(show);
  };

  const handleAcceptChange = (changeId: string) => {
    console.log('Accepting change:', changeId);
    // This will be handled by the editor
  };

  const handleRejectChange = (changeId: string) => {
    console.log('Rejecting change:', changeId);
    // This will be handled by the editor
  };

  const handleChangeClick = (changeId: string) => {
    console.log('Clicking change:', changeId);
    // This will be handled by the editor
  };

  if (!selectedChapter) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <h3 className="text-lg font-medium mb-2">No Chapter Selected</h3>
          <p>Select a chapter from the sidebar to start editing.</p>
        </div>
      </div>
    );
  }

  if (mode === 'planning') {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <h3 className="text-lg font-medium mb-2">Planning Mode</h3>
          <p>Planning tools and features will be available here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <EditorRichTextEditor
        content={selectedChapter.content}
        onChange={handleContentChange}
        placeholder="Start writing your chapter..."
        blockId={selectedChapter.id}
        selectedChapter={selectedChapter}
        showTrackChanges={showTrackChanges}
        onTrackChangesToggle={handleTrackChangesToggle}
        onExtractedChangesUpdate={handleExtractedChangesUpdate}
        onAcceptChange={handleAcceptChange}
        onRejectChange={handleRejectChange}
        onChangeClick={handleChangeClick}
      />
    </div>
  );
};
