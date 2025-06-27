
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PlotNodeData } from '@/types/plotCanvas';
import { TimelineEvent } from '@/types/canvas';
import { apiClient } from '@/lib/api';
import { X } from 'lucide-react';

interface NodeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodeId: string, updatedData: Partial<PlotNodeData>) => void;
  node?: PlotNodeData;
  timelineEvents: TimelineEvent[];
  onTimelineEventsChange: (events: TimelineEvent[]) => void;
  parentType?: string;
  bookId?: string;
  versionId?: string;
}

export const NodeEditModal: React.FC<NodeEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  node,
  timelineEvents,
  onTimelineEventsChange,
  parentType,
  bookId,
  versionId
}) => {
  const [formData, setFormData] = useState<Partial<PlotNodeData>>({
    type: 'Act',
    name: '',
    detail: '',
    goal: '',
    status: 'Not Completed',
    linkedNodeIds: []
  });

  const [availableCharacters, setAvailableCharacters] = useState<any[]>([]);
  const [availableWorldEntities, setAvailableWorldEntities] = useState<any[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);

  const getChildType = (parentType: string): string => {
    switch (parentType) {
      case 'Outline':
        return 'Act';
      case 'Act':
        return 'Chapter';
      case 'Chapter':
        return 'SceneBeats';
      default:
        return 'SceneBeats';
    }
  };

  useEffect(() => {
    if (node) {
      setFormData({
        type: node.type,
        name: node.name,
        detail: node.detail,
        goal: node.goal,
        status: node.status,
        linkedNodeIds: node.linkedNodeIds || []
      });
      setSelectedEntities(node.linkedNodeIds || []);
    } else {
      setFormData({
        type: parentType ? getChildType(parentType) as any : 'Act',
        name: '',
        detail: '',
        goal: '',
        status: 'Not Completed',
        linkedNodeIds: []
      });
      setSelectedEntities([]);
    }
  }, [node, parentType, isOpen]);

  useEffect(() => {
    if (isOpen && bookId && versionId) {
      fetchAvailableEntities();
    }
  }, [isOpen, bookId, versionId]);

  const fetchAvailableEntities = async () => {
    if (!bookId || !versionId) return;

    try {
      // Fetch characters
      const charactersResponse = await apiClient.get(`/books/${bookId}/versions/${versionId}/characters/all`);
      setAvailableCharacters(charactersResponse.data || []);

      // Fetch world entities (locations and objects)
      const worldResponse = await apiClient.get(`/books/${bookId}/versions/${versionId}/world/all`);
      setAvailableWorldEntities(worldResponse.data || []);
    } catch (error) {
      console.error('Failed to fetch available entities:', error);
      setAvailableCharacters([]);
      setAvailableWorldEntities([]);
    }
  };

  const handleEntitySelect = (entityId: string) => {
    if (!selectedEntities.includes(entityId)) {
      const updatedEntities = [...selectedEntities, entityId];
      setSelectedEntities(updatedEntities);
      setFormData(prev => ({ ...prev, linkedNodeIds: updatedEntities }));
    }
  };

  const handleEntityRemove = (entityId: string) => {
    const updatedEntities = selectedEntities.filter(id => id !== entityId);
    setSelectedEntities(updatedEntities);
    setFormData(prev => ({ ...prev, linkedNodeIds: updatedEntities }));
  };

  const getEntityName = (entityId: string) => {
    const character = availableCharacters.find(c => c.id === entityId);
    if (character) return character.name;
    
    const worldEntity = availableWorldEntities.find(w => w.id === entityId);
    if (worldEntity) return worldEntity.name;
    
    return entityId;
  };

  const handleSave = () => {
    if (!formData.name?.trim() || !node) {
      return;
    }

    onSave(node.id, {
      type: formData.type,
      name: formData.name,
      detail: formData.detail,
      goal: formData.goal,
      status: formData.status,
      linkedNodeIds: selectedEntities
    });
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
                <SelectItem value="WorldLocation">World Location</SelectItem>
                <SelectItem value="WorldObject">World Object</SelectItem>
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
              placeholder="Enter the goal or purpose..."
              rows={2}
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

          {/* Entity Selection for Scene Beats */}
          {formData.type === 'SceneBeats' && (
            <>
              <div>
                <Label>Characters</Label>
                <Select onValueChange={handleEntitySelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select characters..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCharacters.map((character) => (
                      <SelectItem key={character.id} value={character.id}>
                        {character.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>World Elements</Label>
                <Select onValueChange={handleEntitySelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select world elements..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWorldEntities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name} ({entity.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Entities */}
              {selectedEntities.length > 0 && (
                <div>
                  <Label>Selected Entities</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedEntities.map((entityId) => (
                      <Badge key={entityId} variant="outline" className="flex items-center gap-1">
                        {getEntityName(entityId)}
                        <X 
                          size={12} 
                          className="cursor-pointer hover:text-destructive"
                          onClick={() => handleEntityRemove(entityId)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

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
