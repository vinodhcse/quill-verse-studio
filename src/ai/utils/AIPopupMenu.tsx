import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export interface AIPopupMenuProps {
  position: { top: number; left: number };
  onAccept: () => void;
  onReject: (originalContent) => void;
  onStop: () => void;
  visible: boolean;
  disabled: boolean;
  originalSlice: {};
}

export const AIPopupMenu: React.FC<AIPopupMenuProps> = ({
  position,
  onAccept,
  onReject,
  onStop,
  visible,
  disabled,
  originalSlice
}) => {
  if (!visible) return null;

  return (
    <Card
      className="absolute z-50 shadow-xl flex items-center space-x-2 p-2 rounded-xl"
      style={{ top: position.top, left: position.left, position: 'absolute' }}
    >
      {disabled && <Loader2 size={16} className="animate-spin text-muted-foreground mr-2" />}
      <Button onClick={onAccept} disabled={disabled} variant="default">
        Accept
      </Button>
      <Button onClick={() => {onReject(originalSlice)}} disabled={disabled} variant="destructive">
        Reject
      </Button>
      <Button onClick={onStop} variant="outline">
        Stop
      </Button>
    </Card>
  );
};
