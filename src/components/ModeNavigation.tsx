
import React from 'react';
import { Button } from '@/components/ui/button';
import { PenTool, Layout, Users, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Mode = 'writing' | 'planning' | 'editing';

interface ModeNavigationProps {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
  leftSidebarCollapsed: boolean;
  rightSidebarCollapsed: boolean;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
}

export const ModeNavigation: React.FC<ModeNavigationProps> = ({
  currentMode,
  onModeChange,
  leftSidebarCollapsed,
  rightSidebarCollapsed,
  onToggleLeftSidebar,
  onToggleRightSidebar,
}) => {
  const modes = [
    { id: 'writing' as Mode, label: 'Writing', icon: PenTool },
    { id: 'planning' as Mode, label: 'Planning', icon: Layout },
    { id: 'editing' as Mode, label: 'Editing', icon: Users },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleLeftSidebar}
            className="h-8 w-8 p-0 rounded-lg hover:bg-accent/50"
            title={leftSidebarCollapsed ? "Show left sidebar" : "Hide left sidebar"}
          >
            {leftSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>

        <div className="flex items-center space-x-2 bg-muted/50 rounded-xl p-1">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <Button
                key={mode.id}
                variant={currentMode === mode.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onModeChange(mode.id)}
                className={cn(
                  "h-8 px-3 rounded-lg transition-all duration-200",
                  currentMode === mode.id 
                    ? "bg-background shadow-sm" 
                    : "hover:bg-background/50"
                )}
              >
                <Icon size={14} className="mr-1.5" />
                {mode.label}
              </Button>
            );
          })}
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleRightSidebar}
            className="h-8 w-8 p-0 rounded-lg hover:bg-accent/50"
            title={rightSidebarCollapsed ? "Show right sidebar" : "Hide right sidebar"}
          >
            {rightSidebarCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </Button>
        </div>
      </div>
    </nav>
  );
};
