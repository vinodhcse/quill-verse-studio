
import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, FileText, Users, Globe, Calendar, BarChart3 } from 'lucide-react';

interface PlanLeftSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  selectedBoard: string;
  onBoardSelect: (boardId: string) => void;
}

export const PlanLeftSidebar: React.FC<PlanLeftSidebarProps> = ({
  isCollapsed,
  onToggle,
  selectedBoard,
  onBoardSelect,
}) => {
  const boardOptions = [
    {
      id: 'plot-arcs',
      label: 'Plot Arcs',
      icon: FileText,
      description: 'Story structure and narrative arcs'
    },
    {
      id: 'characters',
      label: 'Characters',
      icon: Users,
      description: 'Character development and relationships'
    },
    {
      id: 'world-building',
      label: 'World Building',
      icon: Globe,
      description: 'Locations, objects, and world details'
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: Calendar,
      description: 'Story timeline and events'
    },
  ];

  if (isCollapsed) {
    return (
      <div className="w-16 border-r bg-background flex flex-col">
        <div className="p-2">
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <ChevronLeft size={16} className="rotate-180" />
          </Button>
        </div>
        <div className="flex-1 space-y-2 p-2">
          {boardOptions.map((board) => {
            const Icon = board.icon;
            return (
              <Button
                key={board.id}
                variant={selectedBoard === board.id ? 'default' : 'ghost'}
                size="sm"
                className="w-full p-2 h-10"
                onClick={() => onBoardSelect(board.id)}
              >
                <Icon size={16} />
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="border-r bg-background flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Planning Boards</h2>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <ChevronLeft size={16} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {boardOptions.map((board) => {
            const Icon = board.icon;
            return (
              <Button
                key={board.id}
                variant={selectedBoard === board.id ? 'default' : 'ghost'}
                className="w-full justify-start text-left h-auto p-3"
                onClick={() => onBoardSelect(board.id)}
              >
                <Icon size={16} className="mr-3 flex-shrink-0" />
                <div>
                  <div className="font-medium">{board.label}</div>
                  <div className="text-xs text-muted-foreground">{board.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
