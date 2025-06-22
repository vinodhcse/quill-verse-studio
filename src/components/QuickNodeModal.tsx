
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CanvasNode } from '@/types/canvas';

interface QuickNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (node: CanvasNode, position: { x: number; y: number }) => void;
  position: { x: number; y: number };
  sourceNodeId?: string;
}

export const QuickNodeModal: React.FC<QuickNodeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  position,
  sourceNodeId
}) => {
  const [formData, setFormData] = useState({
    type: 'Outline' as CanvasNode['type'],
    name: ''
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        type: 'Outline',
        name: ''
      });
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!formData.name.trim()) return;

    const nodeData: CanvasNode = {
      id: `node_${Date.now()}`,
      type: formData.type,
      name: formData.name,
      detail: '',
      goal: '',
      status: 'Not Completed',
      timelineEventIds: [],
      childIds: [],
      linkedNodeIds: []
    };

    onSave(nodeData, position);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add Node</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as CanvasNode['type'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Outline">Outline</SelectItem>
                <SelectItem value="Act">Act</SelectItem>
                <SelectItem value="Chapter">Chapter</SelectItem>
                <SelectItem value="SceneBeats">Scene Beats</SelectItem>
                <SelectItem value="Character">Character</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter name..."
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.name.trim()}
            >
              Create & Connect
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
