
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { EditMode, User } from '@/types/collaboration';
import { Edit, MessageSquare, Eye, EyeOff, GitBranch, GitBranchPlus } from 'lucide-react';

interface EditModeSelectorProps {
  currentMode: EditMode;
  onModeChange: (mode: EditMode) => void;
  currentUser: User;
  trackChangesEnabled?: boolean;
  showChangesEnabled?: boolean;
  onTrackChangesToggle?: (enabled: boolean) => void;
  onShowChangesToggle?: (enabled: boolean) => void;
  isEditMode?: boolean;
  fileStatus?: string;
}

export const EditModeSelector: React.FC<EditModeSelectorProps> = ({
  currentMode,
  onModeChange,
  currentUser,
  trackChangesEnabled = false,
  showChangesEnabled = false,
  onTrackChangesToggle,
  onShowChangesToggle,
  isEditMode = false,
  fileStatus = 'Auto-saved',
}) => {
  return (
    <div className="flex items-center space-x-3 p-2 border rounded-lg bg-background/50">
      {/* Track Changes Toggle */}
      <div className="flex items-center space-x-1">
        <Toggle
          pressed={trackChangesEnabled}
          onPressedChange={onTrackChangesToggle}
          disabled={isEditMode}
          className="h-8 text-xs"
          title={isEditMode ? "Track changes is always on in edit mode" : "Toggle track changes"}
        >
          <GitBranch size={14} className="mr-1" />
          Track Changes
        </Toggle>
      </div>

      <div className="w-px h-6 bg-border" />

      {/* Show Changes Toggle */}
      <div className="flex items-center space-x-1">
        <Toggle
          pressed={showChangesEnabled}
          onPressedChange={onShowChangesToggle}
          className="h-8 text-xs"
          title="Toggle changes visibility"
        >
          {showChangesEnabled ? <Eye size={14} className="mr-1" /> : <EyeOff size={14} className="mr-1" />}
          Show Changes
        </Toggle>
      </div>

      <div className="w-px h-6 bg-border" />

      {/* File Status */}
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-xs text-muted-foreground">{fileStatus}</span>
      </div>
    </div>
  );
};
