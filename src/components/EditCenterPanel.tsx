
import React, { useState, useCallback } from 'react';
import { EditorRichTextEditor } from './EditorRichTextEditor';
import { RightSidebar } from './RightSidebar';
import { useBookContext } from '@/lib/BookContextProvider';
import { Mode } from './ModeNavigation';

interface EditCenterPanelProps {
  mode: Mode;
}

export const EditCenterPanel: React.FC<EditCenterPanelProps> = ({ mode }) => {
  const { state, updateChapterContent } = useBookContext();
  const [showTrackChanges, setShowTrackChanges] = useState(true);
  const [extractedChanges, setExtractedChanges] = useState<any[]>([]);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  const selectedChapter = state.selectedChapter;

  const handleContentChange = useCallback((content: any, totalCharacters: number, totalWords: number) => {
    if (selectedChapter) {
      updateChapterContent(selectedChapter.id, content, totalCharacters, totalWords);
    }
  }, [selectedChapter, updateChapterContent]);

  const handleExtractedChangesUpdate = useCallback((changes: any[]) => {
    console.log('EditCenterPanel received extracted changes:', changes);
    setExtractedChanges(changes);
  }, []);

  const handleAcceptChange = useCallback((changeId: string) => {
    console.log('Accepting change:', changeId);
    // The EditorRichTextEditor will handle the actual acceptance
  }, []);

  const handleRejectChange = useCallback((changeId: string) => {
    console.log('Rejecting change:', changeId);
    // The EditorRichTextEditor will handle the actual rejection
  }, []);

  const handleChangeClick = useCallback((changeId: string) => {
    console.log('Clicking on change:', changeId);
    // The EditorRichTextEditor will handle the focusing
  }, []);

  if (!selectedChapter) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">No Chapter Selected</h3>
          <p>Select a chapter from the sidebar to start editing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <div className="flex-1">
        <EditorRichTextEditor
          content={selectedChapter.content}
          onChange={handleContentChange}
          placeholder="Start writing your chapter..."
          blockId={selectedChapter.id}
          selectedChapter={selectedChapter}
          showTrackChanges={showTrackChanges}
          onTrackChangesToggle={setShowTrackChanges}
          onExtractedChangesUpdate={handleExtractedChangesUpdate}
          onAcceptChange={handleAcceptChange}
          onRejectChange={handleRejectChange}
          onChangeClick={handleChangeClick}
        />
      </div>
      
      {/* Pass changes to RightSidebar */}
      <div className={`transition-all duration-500 ease-in-out ${rightSidebarCollapsed ? 'w-0' : 'w-80'} flex-shrink-0`}>
        <RightSidebar
          mode={mode}
          isCollapsed={rightSidebarCollapsed}
          onToggle={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
          extractedChanges={extractedChanges}
          onAcceptChange={handleAcceptChange}
          onRejectChange={handleRejectChange}
          onChangeClick={handleChangeClick}
        />
      </div>
    </div>
  );
};
