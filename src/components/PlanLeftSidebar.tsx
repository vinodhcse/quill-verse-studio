
import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, Layers } from 'lucide-react';

interface PlanLeftSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  selectedBoard: string;
  onBoardSelect: (board: string) => void;
}

export const PlanLeftSidebar: React.FC<PlanLeftSidebarProps> = ({
  isCollapsed,
  onToggle,
  selectedBoard,
  onBoardSelect,
}) => {
  const planningBoards = [
    { id: 'plot-outline', name: 'Plot Outline' },
    { id: 'character-arcs', name: 'Character Arcs' },
    { id: 'world-building', name: 'World Building' },
    { id: 'timeline', name: 'Timeline' },
  ];

  if (isCollapsed) return null;

  return (
    <div className="h-full bg-background/80 backdrop-blur-md border-r border-border/50 overflow-hidden">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h2 className="font-medium text-lg">Planning Boards</h2>
        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-accent/50 rounded-lg transition-colors"
          title="Collapse sidebar"
        >
          <ChevronLeft size={16} />
        </button>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto h-[calc(100%-73px)]">
        <div className="space-y-2">
          {planningBoards.map((board) => (
            <div
              key={board.id}
              onClick={() => onBoardSelect(board.id)}
              className={cn(
                "p-3 rounded-xl cursor-pointer transition-all duration-200 text-sm flex items-center space-x-2 group hover:shadow-sm",
                selectedBoard === board.id 
                  ? "bg-primary/10 text-primary border-primary/20 border" 
                  : "hover:bg-accent/50"
              )}
            >
              <Layers size={14} className="opacity-70 group-hover:opacity-100" />
              <span className="font-medium">{board.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
