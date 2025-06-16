import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, Plus, FileText, Users, Layers, GripVertical } from 'lucide-react';
import { Mode } from './ModeNavigation';
import { ChapterContextMenu } from './ChapterContextMenu';
import { apiClient } from '@/lib/api';
import { useBookContext } from '@/lib/BookContextProvider';
import { useNavigate } from 'react-router-dom';

interface LeftSidebarProps {
  mode: Mode;
  isCollapsed: boolean;
  onToggle: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  mode,
  isCollapsed,
  onToggle,
}) => {
  const { state } = useBookContext();
  const { chapters, bookId, versionId } = state;
  const navigate = useNavigate();

  const [draggedChapter, setDraggedChapter] = useState<string | null>(null);
  const [dragOverChapter, setDragOverChapter] = useState<string | null>(null);

  const handleCreateChapter = async () => {
    try {
      const newChapterData = {
        title: `Chapter ${chapters.length + 1}: New Chapter`,
        blocks: [],
        position: chapters.length + 1,
        metaData: {
          totalChars: 0,
          totaWords: 0,
          totalparagraphs: 0,
          readabilityRating: 0,
        },
      };

      const response = await apiClient.post(`/books/${bookId}/versions/${versionId}/chapters`, newChapterData);
      const newChapter = response.data;

      // Update the URL to load the new chapter
      window.location.href = `/write/book/${bookId}/version/${versionId}?Chapter=${newChapter.id}`;
    } catch (error) {
      console.error('Failed to create chapter:', error);
      alert('Failed to create chapter. Please try again.');
    }
  };

  const handleImportChapters = (file: File) => {
    console.log('Importing chapters from file:', file.name);
    // Here you would implement the actual file parsing logic
  };

  const handleDragStart = (e: React.DragEvent, chapterId: string) => {
    setDraggedChapter(chapterId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetChapterId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedChapter !== targetChapterId) {
      setDragOverChapter(targetChapterId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverChapter(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedChapter(null);
    setDragOverChapter(null);
  };

  const handleDrop = (e: React.DragEvent, targetChapterId: string) => {
    e.preventDefault();
    if (!draggedChapter || draggedChapter === targetChapterId) return;

    const draggedIndex = chapters.findIndex(ch => ch.id === draggedChapter);
    const targetIndex = chapters.findIndex(ch => ch.id === targetChapterId);

    const newChapters = [...chapters];
    const [draggedItem] = newChapters.splice(draggedIndex, 1);
    newChapters.splice(targetIndex, 0, draggedItem);

    // setChapters(newChapters);
    setDraggedChapter(null);
    setDragOverChapter(null);
  };

  const handleChapterClick = (chapterId: string) => {
    console.log('Chapter clicked:', chapterId);
    navigate(`/write/book/${bookId}/version/${versionId}?chapterId=${chapterId}`);
  };

  const renderContent = () => {
    switch (mode) {
      case 'writing':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Chapters</h3>
              <ChapterContextMenu 
                onCreateChapter={handleCreateChapter}
                onImportChapters={handleImportChapters}
              >
                <button className="p-1.5 hover:bg-accent/50 rounded-lg transition-colors">
                  <Plus size={14} />
                </button>
              </ChapterContextMenu>
            </div>
            <div className="space-y-2">
              {chapters.map((chapter, i) => {
                const isSelected = chapter.id === state.chapterId;

                return (
                  <div
                    key={chapter.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, chapter.id)}
                    onDragOver={(e) => handleDragOver(e, chapter.id)}
                    onDragLeave={handleDragLeave}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, chapter.id)}
                    onClick={() => handleChapterClick(chapter.id)}
                    className={cn(
                      "p-3 rounded-xl cursor-pointer transition-all duration-300 text-sm group hover:shadow-sm relative border border-transparent",
                      isSelected ? "bg-primary/10 text-primary border-primary/20" : "hover:bg-accent/50",
                      draggedChapter === chapter.id ? "opacity-30 scale-95 rotate-2 shadow-xl z-10" : "",
                      dragOverChapter === chapter.id && draggedChapter !== chapter.id ? 
                        "border-primary border-2 bg-primary/10 transform scale-105 shadow-lg" : ""
                    )}
                    style={{
                      transform: dragOverChapter === chapter.id && draggedChapter !== chapter.id ? 
                        'translateY(-4px) scale(1.02)' : undefined
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <GripVertical 
                        size={12} 
                        className="opacity-50 group-hover:opacity-100 cursor-grab active:cursor-grabbing" 
                      />
                      <FileText size={14} className="opacity-70 group-hover:opacity-100" />
                      <span className="truncate font-medium flex-1">{chapter.title}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 ml-6">
                      {chapter.words} words
                    </div>
                    {dragOverChapter === chapter.id && draggedChapter !== chapter.id && (
                      <div className="absolute -top-1 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-full animate-pulse shadow-sm" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      
      case 'planning':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Planning Boards</h3>
            <div className="space-y-2">
              {['Plot Outline', 'Character Arcs', 'World Building', 'Timeline'].map((board, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl cursor-pointer hover:bg-accent/50 transition-all duration-200 text-sm flex items-center space-x-2 group hover:shadow-sm"
                >
                  <Layers size={14} className="opacity-70 group-hover:opacity-100" />
                  <span className="font-medium">{board}</span>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  if (isCollapsed) return null;

  return (
    <div className="h-full bg-background/80 backdrop-blur-md border-r border-border/50 overflow-hidden">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h2 className="font-medium text-lg">
          {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </h2>
        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-accent/50 rounded-lg transition-colors"
          title="Collapse sidebar"
        >
          <ChevronLeft size={16} />
        </button>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto h-[calc(100%-73px)]">
        {renderContent()}
      </div>
    </div>
  );
};
