
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface TrackChangesToggleProps {
  showChanges: boolean;
  onToggle: (show: boolean) => void;
}

export const TrackChangesToggle: React.FC<TrackChangesToggleProps> = ({
  showChanges,
  onToggle,
}) => {
  return (
    <Button
      variant={showChanges ? "default" : "outline"}
      size="sm"
      onClick={() => onToggle(!showChanges)}
      className="flex items-center space-x-2"
    >
      {showChanges ? <Eye size={16} /> : <EyeOff size={16} />}
      <span>{showChanges ? 'Hide' : 'Show'} Tracked Changes</span>
    </Button>
  );
};
