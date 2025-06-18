// src/pages/EditPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { CollaborativeRichTextEditor } from '@/components/CollaborativeRichTextEditor';
import { PageAccessControlPlugin } from '../extensions/PageAccessControlPlugin';
import { SidebarChapterList } from '../components/EditSidebarChapterList';

interface Chapter {
  id: string;
  title: string;
  content: any;
}

export const EditPage: React.FC = () => {
  const { bookId, versionId, chapterId } = useParams();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);

  // Load chapters once
  useEffect(() => {
    async function loadChapters() {
      const resp = await apiClient.get(`/books/${bookId}/versions/${versionId}/chapters`);
      setChapters(resp.data);
      const initialIndex = resp.data.findIndex((c: Chapter) => c.id === chapterId);
      setActiveChapterIndex(initialIndex >= 0 ? initialIndex : 0);
    }
    loadChapters();
  }, [bookId, versionId, chapterId]);

  const currentChapter = chapters[activeChapterIndex] || null;
  console.log('Current Chapter:', currentChapter);
  return (
    <div className="flex h-full">
      <SidebarChapterList
        chapters={chapters}
        activeId={currentChapter?.id}
        onSelect={id => {
          const idx = chapters.findIndex(c => c.id === id);
          if (idx >= 0) setActiveChapterIndex(idx);
        }}
      />

      <div className="flex-1 p-4 bg-white">
        {currentChapter && (
          <CollaborativeRichTextEditor
            content={currentChapter.content}
            plugins={[PageAccessControlPlugin({ activeChapterIndex, index: activeChapterIndex })]}
            onChange={async (json, charCount, wordCount) => {
              await apiClient.patch(`/books/${bookId}/versions/${versionId}/chapters/${currentChapter.id}`, {
                content: json,
                metaData: { totalChars: charCount, totalWords: wordCount },
              });
              // update local state with saved content
              setChapters(prev =>
                prev.map(c =>
                  c.id === currentChapter.id ? { ...c, content: json } : c
                )
              );
            }}
          />
        )}
      </div>
    </div>
  );
};
