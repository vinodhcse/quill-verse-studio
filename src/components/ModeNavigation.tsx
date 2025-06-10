
import React from 'react';
import { cn } from '@/lib/utils';
import { BookOpen, Edit3, FileText, Users, Eye } from 'lucide-react';

export type Mode = 'planning' | 'writing' | 'formatting' | 'editing' | 'reviewing';

interface ModeNavigationProps {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
}

const modes = [
  { id: 'planning' as Mode, label: 'Planning', icon: BookOpen },
  { id: 'writing' as Mode, label: 'Writing', icon: Edit3 },
  { id: 'formatting' as Mode, label: 'Formatting', icon: FileText },
  { id: 'editing' as Mode, label: 'Editing', icon: Users },
  { id: 'reviewing' as Mode, label: 'Reviewing', icon: Eye },
];

export const ModeNavigation: React.FC<ModeNavigationProps> = ({
  currentMode,
  onModeChange,
}) => {
  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-primary">AuthorStudio</h1>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            Beta
          </span>
        </div>
        
        <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => onModeChange(mode.id)}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  currentMode === mode.id
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <Icon size={16} />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-muted-foreground">Auto-saved</span>
          </div>
          <button className="text-sm text-primary hover:text-primary/80">
            Share
          </button>
        </div>
      </div>
    </nav>
  );
};
