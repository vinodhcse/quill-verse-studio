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

export const EditLeftSidebar: React.FC<LeftSidebarProps> = ({
  mode,
  isCollapsed,
  onToggle,
}) => {
  const { state, dispatch } = useBookContext();
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
      window.location.href = `/edit/book/${bookId}/version/${versionId}?Chapter=${newChapter.id}`;
    } catch (error) {
      console.error('Failed to create chapter:', error);
      alert('Failed to create chapter. Please try again.');
    }
  };

  const handleImportChapters = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Start Import Job
      const startJobResponse = await apiClient.post(`/books/${bookId}/versions/${versionId}/import-docx`, formData);
      const jobId = startJobResponse.data.jobId;

      // Show modal with progress bar
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50';
      modal.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-lg w-96 animate-fadeIn">
          <h2 class="text-lg font-semibold mb-4">Importing Chapters</h2>
          <div class="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div id="progress-bar" class="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-500 ease-in-out" style="width: 0%;"></div>
          </div>
          <p id="progress-status" class="text-sm mt-2">Status: In Progress</p>
        </div>
      `;
      document.body.appendChild(modal);

      // Track Job Status
      const trackJobStatus = async () => {
        try {
          const jobStatusResponse = await apiClient.get(`/jobs/${jobId}`);
          const { status, totalChapters, completedChapters } = jobStatusResponse.data;

          // Calculate progress
          const progress = (completedChapters / totalChapters) * 100;

          // Update progress bar and status
          const progressBar = document.getElementById('progress-bar');
          const progressStatus = document.getElementById('progress-status');
          if (progressBar) progressBar.style.width = `${progress || 0}%`;
          if (progressStatus) progressStatus.textContent = `Status: ${status} (${Math.round(progress)}%)`;

          if (status === 'Completed') {
            setTimeout(async () => {
              alert('Chapters imported successfully!');
              modal.remove();
              // Refresh chapters
              const updatedChapters = await apiClient.get(`/books/${bookId}/versions/${versionId}/chapters`);
              dispatch({ type: 'SET_CHAPTERS', payload: updatedChapters.data });
            }, 500); // Delay to show final animation
          } else if (status === 'Failed') {
            alert('Failed to import chapters. Please try again.');
            modal.remove();
          } else {
            setTimeout(trackJobStatus, 2000); // Poll every 2 seconds
          }
        } catch (error) {
          console.error('Error tracking job status:', error);
          alert('An error occurred while tracking the import job.');
          modal.remove();
        }
      };

      trackJobStatus();
    } catch (error) {
      console.error('Failed to start import job:', error);
      alert('Failed to import chapters. Please try again.');
    }
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

  const handleDrop = async (e: React.DragEvent, targetChapterId: string) => {
      e.preventDefault();
      if (!draggedChapter || draggedChapter === targetChapterId) return;

      const draggedIndex = chapters.findIndex(ch => ch.id === draggedChapter);
      const targetIndex = chapters.findIndex(ch => ch.id === targetChapterId);

      const newChapters = [...chapters];
      const [draggedItem] = newChapters.splice(draggedIndex, 1);
      newChapters.splice(targetIndex, 0, draggedItem);

      try {
        // Update chapter order in the backend
        const reorderedChapters = newChapters.map((chapter, index) => ({ id: chapter.id, position: index + 1 }));
        await apiClient.patch(`/books/${bookId}/versions/${versionId}/chapters/reorder`, { chapters: reorderedChapters });

        // Update local state
        dispatch({ type: 'SET_CHAPTERS', payload: newChapters });
      } catch (error) {
        console.error('Failed to reorder chapters:', error);
        alert('Failed to reorder chapters. Please try again.');
      }

      setDraggedChapter(null);
      setDragOverChapter(null);
    };

  const handleChapterClick = (chapterId: string) => {
    console.log('Chapter clicked:', chapterId);
    navigate(`/edit/book/${bookId}/version/${versionId}?chapterId=${chapterId}`);
  };

  const handleDeleteChapter = async (chapterId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this chapter?');
    if (!confirmDelete) return;

    try {
      const deletedResponse = await apiClient.delete(`/books/${bookId}/versions/${versionId}/chapters/${chapterId}`);
      console.log('Chapter deleted successfully', deletedResponse);

      const updatedChapters = chapters.filter(ch => ch.id !== chapterId);
      dispatch({ type: 'SET_CHAPTERS', payload: updatedChapters });

      if (state.chapterId === chapterId && updatedChapters.length > 0) {
        const firstChapter = updatedChapters[0];
        dispatch({ type: 'SET_SELECTED_CHAPTER', payload: firstChapter });
        navigate(`/edit/book/${bookId}/version/${versionId}?chapterId=${firstChapter.id}`);
      }
    } catch (error) {
      console.error('Failed to delete chapter:', error);
      alert('Failed to delete chapter. Please try again.');
    }
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
                     
                      <span className="flex-1 truncate">{i+1}.{ } {chapter.title}</span>
                       <GripVertical size={16} />
                      <button
                        className="text-red-500 hover:text-red-700 p-1 rounded-full transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChapter(chapter.id);
                        }}
                        title="Delete Chapter"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7L7 19M7 7l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-xs text-muted-foreground">Words2: {chapter?.content?.metadata?.totalWords || 0}</div>
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
