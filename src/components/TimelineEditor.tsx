
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';
import { TimelineEvent } from '@/types/canvas';

interface TimelineEditorProps {
  timelineEvents: TimelineEvent[];
  selectedEventIds: string[];
  onEventsChange: (events: TimelineEvent[]) => void;
  onSelectionChange: (eventIds: string[]) => void;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  timelineEvents,
  selectedEventIds,
  onEventsChange,
  onSelectionChange
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<TimelineEvent>>({
    name: '',
    date: '',
    type: 'story',
    description: ''
  });

  const handleCreateEvent = () => {
    if (!newEvent.name?.trim() || !newEvent.date) return;

    const event: TimelineEvent = {
      id: `timeline_${Date.now()}`,
      name: newEvent.name,
      date: newEvent.date,
      type: newEvent.type as any,
      linkedNodeIds: [],
      description: newEvent.description || ''
    };

    onEventsChange([...timelineEvents, event]);
    setNewEvent({ name: '', date: '', type: 'story', description: '' });
    setIsCreating(false);
  };

  const handleDeleteEvent = (eventId: string) => {
    onEventsChange(timelineEvents.filter(e => e.id !== eventId));
    onSelectionChange(selectedEventIds.filter(id => id !== eventId));
  };

  const handleToggleSelection = (eventId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedEventIds, eventId]);
    } else {
      onSelectionChange(selectedEventIds.filter(id => id !== eventId));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">Timeline Events</h4>
        <Button
          size="sm"
          onClick={() => setIsCreating(true)}
          className="h-8"
        >
          <Plus size={16} />
          Add Event
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Create New Timeline Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Name *</Label>
              <Input
                value={newEvent.name}
                onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Event name..."
              />
            </div>
            
            <div>
              <Label>Date *</Label>
              <Input
                value={newEvent.date}
                onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                placeholder="YYYY-MM-DD or story timestamp..."
              />
            </div>

            <div>
              <Label>Type</Label>
              <Select
                value={newEvent.type}
                onValueChange={(value) => setNewEvent(prev => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="character">Character</SelectItem>
                  <SelectItem value="flashback">Flashback</SelectItem>
                  <SelectItem value="world">World</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Event description..."
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCreateEvent}
                disabled={!newEvent.name?.trim() || !newEvent.date}
              >
                Create
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {timelineEvents.map((event) => (
          <div key={event.id} className="flex items-center gap-2 p-2 border rounded">
            <Checkbox
              checked={selectedEventIds.includes(event.id)}
              onCheckedChange={(checked) => handleToggleSelection(event.id, checked as boolean)}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{event.name}</div>
              <div className="text-xs text-muted-foreground">
                {event.date} • {event.type}
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteEvent(event.id)}
              className="h-6 w-6 p-0"
            >
              <Trash2 size={12} />
            </Button>
          </div>
        ))}
      </div>

      {timelineEvents.length === 0 && !isCreating && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No timeline events yet. Create one to get started.
        </p>
      )}
    </div>
  );
};
