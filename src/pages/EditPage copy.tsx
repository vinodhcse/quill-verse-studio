
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useBookContext } from '@/lib/BookContextProvider';
import { Chapter, Book as BookDetails } from '@/types/collaboration';
import { CollaborativeRichTextEditor } from '@/components/CollaborativeRichTextEditor';
import { EditLeftSidebar } from '@/components/EditLeftSidebar';
import { RightSidebar } from '@/components/RightSidebar';
import { ModeNavigation, Mode } from '@/components/ModeNavigation';
import { CenterPanel } from '@/components/CenterPanel';

const EditPageCopy = () => {
  const { bookId, versionId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const chapterId = queryParams.get('chapterId');
  
  const { state, updateChapterContent } = useBookContext();
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [leftSidebarVisible, setLeftSidebarVisible] = useState(true);
  const [rightSidebarVisible, setRightSidebarVisible] = useState(true);
  const [currentMode, setCurrentMode] = useState<Mode>('writing');

  // Find the selected chapter
  useEffect(() => {
    if (state.currentBook && chapterId) {
      const chapter = state.currentBook.chapters?.find(ch => ch.id === chapterId);
      if (chapter) {
        setSelectedChapter(chapter);
      }
    }
  }, [state.currentBook, chapterId]);

  const handleChapterContentChange = async (content: any, charCount: any, wordCount: any) => {
    if (selectedChapter && bookId && versionId) {
      await updateChapterContent(bookId, versionId, selectedChapter.id, content, charCount, wordCount);
    }
  };

  if (!state.currentBook || !selectedChapter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b">
        <ModeNavigation 
          currentMode={currentMode}
          onModeChange={setCurrentMode}
          leftSidebarCollapsed={!leftSidebarVisible}
          rightSidebarCollapsed={!rightSidebarVisible}
          onToggleLeftSidebar={() => setLeftSidebarVisible(!leftSidebarVisible)}
          onToggleRightSidebar={() => setRightSidebarVisible(!rightSidebarVisible)}
        />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        {leftSidebarVisible && (
          <div className="w-64 border-r bg-background">
            <EditLeftSidebar
              mode={currentMode}
              isCollapsed={false}
              onToggle={() => setLeftSidebarVisible(false)}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-4">
            <CollaborativeRichTextEditor
              content={selectedChapter.content || { type: 'doc', content: [] }}
              onChange={handleChapterContentChange}
              blockId={`${selectedChapter.id}`}
              selectedChapter={selectedChapter}
            />
          </div>
        </div>

        {/* Right Sidebar */}
        {rightSidebarVisible && (
          <div className="w-80 border-l bg-background">
            <RightSidebar
              mode={currentMode}
              isCollapsed={false}
              onToggle={() => setRightSidebarVisible(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EditPageCopy;
