
import React, { useState, useEffect } from 'react';
import { CollaborativeRichTextEditor } from './CollaborativeRichTextEditor';
import { useBookContext } from '@/lib/BookContextProvider';
import { Chapter } from '@/types/collaboration';

interface CenterPanelProps {
  mode: 'writing' | 'editing' | 'planning';
  trackChanges: boolean;
  showComments: boolean;
}

export const CenterPanel: React.FC<CenterPanelProps> = ({
  mode,
  trackChanges,
  showComments
}) => {
  const { state, dispatch, loading } = useBookContext();
  const { selectedChapter } = state;
  const [content, setContent] = useState('');

  useEffect(() => {
    console.log('CenterPanel - selectedChapter changed:', selectedChapter);
    if (selectedChapter) {
      // Handle different content formats
      let chapterContent = selectedChapter.content;
      
      if (typeof chapterContent === 'string') {
        try {
          // Try to parse as JSON first
          const parsed = JSON.parse(chapterContent);
          chapterContent = parsed;
        } catch (error) {
          // If parsing fails, use as HTML string
          console.log('Content is not JSON, using as HTML string');
        }
      }
      
      console.log('CenterPanel - setting content:', chapterContent);
      setContent(chapterContent || '');
    } else {
      setContent('');
    }
  }, [selectedChapter]);

  const handleContentChange = (newContent: string, totalCharacters?: number, totalWords?: number) => {
    console.log('CenterPanel - content changed:', newContent);
    setContent(newContent);
    
    if (selectedChapter) {
      const updatedChapter: Chapter = {
        ...selectedChapter,
        content: newContent,
        wordCount: totalWords || 0,
        lastModified: new Date().toISOString()
      };
      
      dispatch({ type: 'SET_SELECTED_CHAPTER', payload: updatedChapter });
    }
  };

  if (mode === 'planning') {
    return (
      <div className="h-full flex items-center justify-center bg-background/50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Planning Mode</h2>
          <p className="text-muted-foreground">
            This is where your planning tools will be displayed.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chapter...</p>
        </div>
      </div>
    );
  }

  if (!selectedChapter) {
    return (
      <div className="h-full flex items-center justify-center bg-background/50">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Chapter Selected</h2>
          <p className="text-muted-foreground">
            Select a chapter from the sidebar to start writing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background/30 backdrop-blur-sm">
      <CollaborativeRichTextEditor
        content={content}
        onChange={handleContentChange}
        placeholder={`Start writing "${selectedChapter.title}"...`}
        trackChanges={trackChanges}
        showComments={showComments}
        userName="Current User"
        userColor="#3b82f6"
        className="h-full"
        selectedChapter={selectedChapter}
      />
    </div>
  );
};
