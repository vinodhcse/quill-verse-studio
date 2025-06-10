
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditMode, User } from '@/types/collaboration';
import { Edit, MessageSquare, Eye } from 'lucide-react';

interface EditModeSelectorProps {
  currentMode: EditMode;
  onModeChange: (mode: EditMode) => void;
  currentUser: User;
}

export const EditModeSelector: React.FC<EditModeSelectorProps> = ({
  currentMode,
  onModeChange,
  currentUser
}) => {
  const modes = [
    {
      key: 'edit' as EditMode,
      label: 'Edit',
      icon: Edit,
      description: 'Save changes directly',
      allowedRoles: ['author'],
    },
    {
      key: 'suggest' as EditMode,
      label: 'Suggest',
      icon: MessageSquare,
      description: 'Add changes as suggestions',
      allowedRoles: ['editor', 'author'],
    },
    {
      key: 'review' as EditMode,
      label: 'Review',
      icon: Eye,
      description: 'View and accept/reject changes',
      allowedRoles: ['author', 'reviewer'],
    },
  ];

  const availableModes = modes.filter(mode => 
    mode.allowedRoles.includes(currentUser.role)
  );

  return (
    <div className="flex items-center space-x-2 p-2 border rounded-lg bg-background/50">
      <div className="flex items-center space-x-1">
        <Badge variant="outline" className="text-xs">
          {currentUser.name} ({currentUser.role})
        </Badge>
      </div>
      
      <div className="w-px h-6 bg-border" />
      
      <div className="flex items-center space-x-1">
        {availableModes.map((mode) => {
          const Icon = mode.icon;
          return (
            <Button
              key={mode.key}
              variant={currentMode === mode.key ? "default" : "ghost"}
              size="sm"
              onClick={() => onModeChange(mode.key)}
              className="h-8"
              title={mode.description}
            >
              <Icon size={14} className="mr-1" />
              {mode.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
