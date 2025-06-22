
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CanvasNode, TimelineEvent } from '@/types/canvas';
import { TimelineEditor } from './TimelineEditor';

interface NodeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (node: CanvasNode) => void;
  node?: CanvasNode;
  timelineEvents: TimelineEvent[];
  onTimelineEventsChange: (events: TimelineEvent[]) => void;
  parentType?: string;
}

export const NodeEditModal: React.FC<NodeEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  node,
  timelineEvents,
  onTimelineEventsChange,
  parentType
}) => {
  const [formData, setFormData] = useState<Partial<CanvasNode>>({
    type: 'Outline',
    name: '',
    detail: '',
    goal: '',
    status: 'Not Completed',
    timelineEventIds: []
  });

  const getChildType = (parentType: string): string => {
    switch (parentType) {
      case 'Outline':
        return 'Act';
      case 'Act':
        return 'Chapter';
      case 'Chapter':
        return 'SceneBeats';
      default:
        return 'Outline';
    }
  };

  useEffect(() => {
    if (node) {
      setFormData(node);
    } else {
      setFormData({
        type: parentType ? getChildType(parentType) as any : 'Outline',
        name: '',
        detail: '',
        goal: '',
        status: 'Not Completed',
        timelineEventIds: []
      });
    }
  }, [node, parentType, isOpen]);

  const handleSave = () => {
    if (!formData.name?.trim()) return;

    const nodeData: CanvasNode = {
      id: node?.id || `node_${Date.now()}`,
      type: formData.type as any,
      name: formData.name,
      detail: formData.detail || '',
      goal: formData.goal || '',
      status: formData.status as any,
      timelineEventIds: formData.timelineEventIds || [],
      parentId: formData.parentId,
      childIds: formData.childIds || []
    };

    onSave(nodeData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {node ? 'Edit Node' : 'Create New Node'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
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
            />
          </div>

          <div>
            <Label htmlFor="detail">Detail</Label>
            <Textarea
              id="detail"
              value={formData.detail}
              onChange={(e) => setFormData(prev => ({ ...prev, detail: e.target.value }))}
              placeholder="Enter details..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="goal">Goal</Label>
            <Textarea
              id="goal"
              value={formData.goal}
              onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
              placeholder="Enter goal..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Not Completed">Not Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Timeline Events</Label>
            <TimelineEditor
              timelineEvents={timelineEvents}
              selectedEventIds={formData.timelineEventIds || []}
              onEventsChange={onTimelineEventsChange}
              onSelectionChange={(eventIds) => 
                setFormData(prev => ({ ...prev, timelineEventIds: eventIds }))
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.name?.trim()}
            >
              {node ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
