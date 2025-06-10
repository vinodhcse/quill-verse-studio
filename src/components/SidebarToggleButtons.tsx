
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarToggleButtonsProps {
  leftSidebarCollapsed: boolean;
  rightSidebarCollapsed: boolean;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
}

export const SidebarToggleButtons: React.FC<SidebarToggleButtonsProps> = ({
  leftSidebarCollapsed,
  rightSidebarCollapsed,
  onToggleLeftSidebar,
  onToggleRightSidebar,
}) => {
  return (
    <>
      {/* Left sidebar toggle button */}
      <div className="fixed left-2 top-1/2 -translate-y-1/2 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleLeftSidebar}
          className={cn(
            "h-12 w-8 p-0 rounded-r-lg rounded-l-none border-l-0 bg-background/80 backdrop-blur-sm shadow-lg hover:bg-accent/50 transition-all duration-200",
            leftSidebarCollapsed ? "translate-x-0" : "translate-x-64"
          )}
          title={leftSidebarCollapsed ? "Show left sidebar" : "Hide left sidebar"}
        >
          {leftSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>

      {/* Right sidebar toggle button */}
      <div className="fixed right-2 top-1/2 -translate-y-1/2 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleRightSidebar}
          className={cn(
            "h-12 w-8 p-0 rounded-l-lg rounded-r-none border-r-0 bg-background/80 backdrop-blur-sm shadow-lg hover:bg-accent/50 transition-all duration-200",
            rightSidebarCollapsed ? "translate-x-0" : "-translate-x-80"
          )}
          title={rightSidebarCollapsed ? "Show right sidebar" : "Hide right sidebar"}
        >
          {rightSidebarCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </Button>
      </div>
    </>
  );
};
