
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { BookDetails, Chapter } from '@/types/collaboration';
import { EditLeftSidebar } from '@/components/EditLeftSidebar';
import { EditCenterPanel } from '@/components/EditCenterPanel';
import { RightSidebar } from '@/components/RightSidebar';
import { Header } from '@/components/Header';
import { CollaborativeRichTextEditor } from '@/components/CollaborativeRichTextEditor';

const EditPage = () => {
  const { bookId, versionId, chapterId } = useParams();
  const [bookDetails, setBookDetails] = useState<BookDetails | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [content, setContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leftSidebarVisible, setLeftSidebarVisible] = useState(true);
  const [rightSidebarVisible, setRightSidebarVisible] = useState(true);

  useEffect(() => {
    const fetchBookAndChapter = async () => {
      if (!bookId || !versionId) return;

      try {
        setIsLoading(true);
        
        // Fetch book details
        const bookResponse = await apiClient.get(`/books/${bookId}`);
        setBookDetails(bookResponse.data);

        // If chapterId is provided, fetch that specific chapter
        if (chapterId) {
          const chapterResponse = await apiClient.get(`/books/${bookId}/versions/${versionId}/chapters/${chapterId}`);
          const chapter = chapterResponse.data;
          setSelectedChapter(chapter);
          
          // Set content from chapter
          if (chapter.content) {
            try {
              const parsedContent = typeof chapter.content === 'string' 
                ? JSON.parse(chapter.content) 
                : chapter.content;
              setContent(parsedContent);
            } catch (error) {
              console.error('Error parsing chapter content:', error);
              setContent({ type: 'doc', content: [] });
            }
          } else {
            setContent({ type: 'doc', content: [] });
          }
        }
      } catch (error) {
        console.error('Error fetching book or chapter:', error);
        setContent({ type: 'doc', content: [] });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookAndChapter();
  }, [bookId, versionId, chapterId]);

  const handleContentChange = async (json: any, charCount: any, wordCount: any) => {
    if (!selectedChapter || !bookId || !versionId) return;

    try {
      await apiClient.patch(`/books/${bookId}/versions/${versionId}/chapters/${selectedChapter.id}`, {
        content: JSON.stringify(json),
        wordCount: wordCount
      });
      
      setContent(json);
      console.log('Chapter content saved successfully');
    } catch (error) {
      console.error('Failed to save chapter:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="relative inline-block w-12 h-12">
          <span className="absolute inline-block w-full h-full border-4 border-t-primary border-b-secondary rounded-full animate-spin"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/10">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {leftSidebarVisible && (
          <EditLeftSidebar
            bookDetails={bookDetails}
            selectedChapter={selectedChapter}
            onChapterSelect={setSelectedChapter}
            onToggleVisible={() => setLeftSidebarVisible(!leftSidebarVisible)}
          />
        )}
        
        <div className="flex-1 flex flex-col min-w-0">
          {selectedChapter ? (
            <EditCenterPanel
              selectedChapter={selectedChapter}
              onChapterSelect={setSelectedChapter}
              leftSidebarVisible={leftSidebarVisible}
              rightSidebarVisible={rightSidebarVisible}
              onToggleLeftSidebar={() => setLeftSidebarVisible(!leftSidebarVisible)}
              onToggleRightSidebar={() => setRightSidebarVisible(!rightSidebarVisible)}
              editor={
                <CollaborativeRichTextEditor
                  content={content}
                  onChange={handleContentChange}
                  blockId={selectedChapter.id}
                  selectedChapter={selectedChapter}
                />
              }
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="text-lg font-medium mb-2">No Chapter Selected</h3>
                <p className="text-muted-foreground">
                  Select a chapter from the sidebar to start editing
                </p>
              </div>
            </div>
          )}
        </div>
        
        {rightSidebarVisible && (
          <RightSidebar onToggleVisible={() => setRightSidebarVisible(!rightSidebarVisible)} />
        )}
      </div>
    </div>
  );
};

export default EditPage;
