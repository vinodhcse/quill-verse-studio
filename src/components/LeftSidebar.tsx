
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus, FileText, Users, Layers, GripVertical } from 'lucide-react';
import { Mode } from './ModeNavigation';
import { ChapterContextMenu } from './ChapterContextMenu';

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
  const [chapters, setChapters] = useState([
    { id: '1', title: 'Chapter 1: Beginning', words: 2340 },
    { id: '2', title: 'Chapter 2: The Journey', words: 1890 },
    { id: '3', title: 'Chapter 3: Conflict', words: 2120 },
  ]);

  const [draggedChapter, setDraggedChapter] = useState<string | null>(null);
  const [dragOverChapter, setDragOverChapter] = useState<string | null>(null);

  const handleCreateChapter = () => {
    const newChapter = {
      id: String(chapters.length + 1),
      title: `Chapter ${chapters.length + 1}: New Chapter`,
      words: 0,
    };
    setChapters([...chapters, newChapter]);
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
    setDragOverChapter(targetChapterId);
  };

  const handleDragLeave = () => {
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

    setChapters(newChapters);
    setDraggedChapter(null);
    setDragOverChapter(null);
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
              {chapters.map((chapter, i) => (
                <div
                  key={chapter.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, chapter.id)}
                  onDragOver={(e) => handleDragOver(e, chapter.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, chapter.id)}
                  className={cn(
                    "p-3 rounded-xl cursor-pointer transition-all duration-200 text-sm group hover:shadow-sm",
                    i === 0 ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-accent/50",
                    draggedChapter === chapter.id ? "opacity-50" : "",
                    dragOverChapter === chapter.id ? "border-2 border-primary/50" : ""
                  )}
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
                </div>
              ))}
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
            
            <div className="pt-4 border-t border-border/50">
              <h4 className="text-sm font-medium mb-3">Characters</h4>
              <div className="space-y-1">
                {['Sarah Chen', 'Marcus Williams', 'Dr. Elena Rodriguez'].map((character, i) => (
                  <div key={i} className="text-xs p-2 hover:bg-accent/50 rounded-lg cursor-pointer transition-colors font-medium">
                    {character}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'editing':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Collaborators</h3>
            <div className="space-y-3">
              {[
                { name: 'Alex Thompson', role: 'Editor', status: 'active' },
                { name: 'Maria Garcia', role: 'Reviewer', status: 'pending' },
              ].map((user, i) => (
                <div key={i} className="p-3 rounded-xl border border-border/50 text-sm hover:shadow-sm transition-all duration-200">
                  <div className="flex items-center space-x-2">
                    <Users size={14} className="opacity-70" />
                    <span className="font-medium">{user.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 ml-6">
                    {user.role} • {user.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="text-sm text-muted-foreground text-center py-8">
            Tools will appear here
          </div>
        );
    }
  };

  return (
    <div className={cn(
      "fixed left-4 top-20 bottom-4 z-40 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-auto" : "w-64"
    )}>
      {isCollapsed ? (
        <div className="bg-background/80 backdrop-blur-md border border-border/50 rounded-2xl shadow-lg p-2">
          <button
            onClick={onToggle}
            className="p-2 hover:bg-accent/50 rounded-xl transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      ) : (
        <div className="bg-background/80 backdrop-blur-md border border-border/50 rounded-2xl shadow-lg w-full h-full flex flex-col overflow-hidden">
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
          
          <div className="flex-1 p-4 overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      )}
    </div>
  );
};
