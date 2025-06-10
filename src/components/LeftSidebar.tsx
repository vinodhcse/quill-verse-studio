
import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus, FileText, Users, Layers } from 'lucide-react';
import { Mode } from './ModeNavigation';

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
  const renderContent = () => {
    switch (mode) {
      case 'writing':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Chapters</h3>
              <button className="p-1 hover:bg-muted rounded">
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {['Chapter 1: Beginning', 'Chapter 2: The Journey', 'Chapter 3: Conflict'].map((chapter, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-2 rounded-md cursor-pointer transition-colors text-sm",
                    i === 0 ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <FileText size={14} />
                    <span className="truncate">{chapter}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    2,340 words
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
                  className="p-2 rounded-md cursor-pointer hover:bg-muted transition-colors text-sm flex items-center space-x-2"
                >
                  <Layers size={14} />
                  <span>{board}</span>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Characters</h4>
              <div className="space-y-1">
                {['Sarah Chen', 'Marcus Williams', 'Dr. Elena Rodriguez'].map((character, i) => (
                  <div key={i} className="text-xs p-1 hover:bg-muted rounded cursor-pointer">
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
            <div className="space-y-2">
              {[
                { name: 'Alex Thompson', role: 'Editor', status: 'active' },
                { name: 'Maria Garcia', role: 'Reviewer', status: 'pending' },
              ].map((user, i) => (
                <div key={i} className="p-2 rounded-md border text-sm">
                  <div className="flex items-center space-x-2">
                    <Users size={14} />
                    <span className="font-medium">{user.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user.role} • {user.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="text-sm text-muted-foreground">
            {mode.charAt(0).toUpperCase() + mode.slice(1)} tools will appear here
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "border-r bg-background transition-all duration-300 flex flex-col",
        isCollapsed ? "w-12" : "w-64"
      )}
    >
      <div className="p-4 border-b flex items-center justify-between">
        {!isCollapsed && (
          <h2 className="font-medium text-sm">
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </h2>
        )}
        <button
          onClick={onToggle}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
      
      {!isCollapsed && (
        <div className="flex-1 p-4 overflow-y-auto">
          {renderContent()}
        </div>
      )}
    </div>
  );
};
