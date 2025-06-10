
import React from 'react';
import { Button } from '@/components/ui/button';
import { PenTool, Layout, Users, Eye, FileType, Home, Bell, Download, UserPlus, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Mode = 'writing' | 'planning' | 'editing' | 'formatting' | 'reviewing';

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
}) => {
  const modes = [
    { id: 'writing' as Mode, label: 'Writing', icon: PenTool },
    { id: 'planning' as Mode, label: 'Planning', icon: Layout },
    { id: 'editing' as Mode, label: 'Editing', icon: Users },
    { id: 'formatting' as Mode, label: 'Formatting', icon: FileType },
    { id: 'reviewing' as Mode, label: 'Review', icon: Eye },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 rounded-lg hover:bg-accent/50"
          >
            <Home size={16} className="mr-1.5" />
            AuthorStudio
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
                    ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" 
                    : "hover:bg-background/50 text-foreground"
                )}
              >
                <Icon size={14} className="mr-1.5" />
                {mode.label}
              </Button>
            );
          })}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg hover:bg-accent/50"
            title="Save"
          >
            <Save size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg hover:bg-accent/50"
            title="Notifications"
          >
            <Bell size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg hover:bg-accent/50"
            title="Invite"
          >
            <UserPlus size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg hover:bg-accent/50"
            title="Install App"
          >
            <Download size={16} />
          </Button>
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
            <span className="text-xs font-medium">JD</span>
          </div>
        </div>
      </div>
    </nav>
  );
};
