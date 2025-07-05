
import React from 'react';
import { Button } from '@/components/ui/button';
import { PenTool, Layout, Users, Eye, FileType, Home, Bell, Download, UserPlus, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useParams } from 'react-router-dom';

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
  const navigate = useNavigate();
  const { bookId, versionId } = useParams();

  const modes = [
    { id: 'writing' as Mode, label: 'Writing', icon: PenTool },
    { id: 'planning' as Mode, label: 'Planning', icon: Layout },
    { id: 'editing' as Mode, label: 'Editing', icon: Users },
    { id: 'formatting' as Mode, label: 'Formatting', icon: FileType },
    { id: 'reviewing' as Mode, label: 'Review', icon: Eye },
  ];

  const handleHomeClick = () => {
    navigate('/dashboard');
  };

  const handleModeChange = (mode: Mode) => {
    if (mode === 'planning' && bookId && versionId) {
      navigate(`/plan/book/${bookId}/version/${versionId}`);
    } else if (mode === 'writing' && bookId && versionId) {
      navigate(`/write/book/${bookId}/version/${versionId}`);
    } else {
      onModeChange(mode);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="flex items-center justify-between px-6 py-3">
        

        <div className="flex items-center space-x-2 bg-muted/50 rounded-xl p-1">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <Button
                key={mode.id}
                variant={currentMode === mode.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleModeChange(mode.id)}
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

        
      </div>
    </nav>
  );
};
