
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty, CommandGroup } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Plus, Search, Eye, EyeOff, Link } from 'lucide-react';
import { CanvasNode, CharacterAttributes, TimelineEvent } from '@/types/plotCanvas';

interface CharacterNodeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedNode: CanvasNode) => void;
  node: CanvasNode | null;
  plotCanvasNodes?: CanvasNode[];
  timelineEvents?: TimelineEvent[];
  onCreateTimelineEvent?: (event: Partial<TimelineEvent>) => void;
}

export const CharacterNodeEditModal: React.FC<CharacterNodeEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  node,
  plotCanvasNodes = [],
  timelineEvents = [],
  onCreateTimelineEvent
}) => {
  const [formData, setFormData] = useState<CharacterAttributes>({
    aliases: [],
    traits: [],
    beliefs: [],
    motivations: [],
    internalConflicts: [],
    externalConflicts: []
  });

  const [newInputs, setNewInputs] = useState({
    alias: '',
    trait: '',
    belief: '',
    motivation: '',
    internalConflict: '',
    externalConflict: ''
  });

  const [showFullAttributes, setShowFullAttributes] = useState(false);
  const [searchPlotNodes, setSearchPlotNodes] = useState('');
  const [searchTimelineEvents, setSearchTimelineEvents] = useState('');
  const [selectedPlotNodeIds, setSelectedPlotNodeIds] = useState<string[]>([]);
  const [selectedTimelineEventIds, setSelectedTimelineEventIds] = useState<string[]>([]);
  const [showPlotNodeSearch, setShowPlotNodeSearch] = useState(false);
  const [showTimelineSearch, setShowTimelineSearch] = useState(false);
  const [newTimelineEvent, setNewTimelineEvent] = useState({ name: '', date: '', description: '' });
  const [showCreateTimeline, setShowCreateTimeline] = useState(false);

  const isFirstNode = node?.parentId === null && (!node?.linkedNodeIds || node.linkedNodeIds.length === 0);

  useEffect(() => {
    if (node && isOpen) {
      // Load attributes from node.attributes (prioritize over legacy fields)
      const nodeAttributes = node.attributes as CharacterAttributes;
      if (nodeAttributes && typeof nodeAttributes === 'object' && !Array.isArray(nodeAttributes)) {
        setFormData({
          age: nodeAttributes.age,
          birthday: nodeAttributes.birthday,
          gender: nodeAttributes.gender,
          description: nodeAttributes.description,
          image: nodeAttributes.image,
          backstory: nodeAttributes.backstory,
          aliases: nodeAttributes.aliases || [],
          traits: nodeAttributes.traits || [],
          beliefs: nodeAttributes.beliefs || [],
          motivations: nodeAttributes.motivations || [],
          internalConflicts: nodeAttributes.internalConflicts || [],
          externalConflicts: nodeAttributes.externalConflicts || [],
          relationships: nodeAttributes.relationships || [],
          goals: nodeAttributes.goals || []
        });
      }
      
      setSelectedPlotNodeIds(node.linkedNodeIds || []);
      setSelectedTimelineEventIds(node.timelineEventIds || []);
      setShowFullAttributes(isFirstNode);
    }
  }, [node, isOpen, isFirstNode]);

  const generateAttributeChangeSummary = (originalAttributes: CharacterAttributes, newAttributes: CharacterAttributes): string => {
    const changes: string[] = [];
    
    const compareArrays = (original: string[] = [], updated: string[] = [], label: string) => {
      const added = updated.filter(item => !original.includes(item));
      const removed = original.filter(item => !updated.includes(item));
      
      if (added.length > 0) {
        changes.push(`Added ${label.toLowerCase()}: ${added.join(', ')}`);
      }
      if (removed.length > 0) {
        changes.push(`Removed ${label.toLowerCase()}: ${removed.join(', ')}`);
      }
    };

    compareArrays(originalAttributes.aliases, newAttributes.aliases, 'aliases');
    compareArrays(originalAttributes.traits, newAttributes.traits, 'traits');
    compareArrays(originalAttributes.beliefs, newAttributes.beliefs, 'beliefs');
    compareArrays(originalAttributes.motivations, newAttributes.motivations, 'motivations');
    compareArrays(originalAttributes.internalConflicts, newAttributes.internalConflicts, 'internal conflicts');
    compareArrays(originalAttributes.externalConflicts, newAttributes.externalConflicts, 'external conflicts');

    return changes.length > 0 ? changes.join('; ') : 'No attribute changes';
  };

  const handleSave = () => {
    if (!node) return;

    const originalAttributes = node.attributes as CharacterAttributes;
    const changeSummary = isFirstNode ? 'Initial character state' : generateAttributeChangeSummary(originalAttributes || {}, formData);

    const updatedNode: CanvasNode = {
      ...node,
      name: node.name,
      detail: changeSummary,
      goal: node.goal || '',
      attributes: formData,
      linkedNodeIds: selectedPlotNodeIds,
      timelineEventIds: selectedTimelineEventIds
    };

    onSave(updatedNode);
    onClose();
  };

  const addItem = (field: keyof typeof newInputs, targetArray: keyof CharacterAttributes) => {
    const value = newInputs[field].trim();
    if (value) {
      setFormData(prev => ({
        ...prev,
        [targetArray]: [...(prev[targetArray] as string[] || []), value]
      }));
      setNewInputs(prev => ({ ...prev, [field]: '' }));
    }
  };

  const removeItem = (targetArray: keyof CharacterAttributes, index: number) => {
    setFormData(prev => ({
      ...prev,
      [targetArray]: (prev[targetArray] as string[] || []).filter((_, i) => i !== index)
    }));
  };

  const handleCreateTimelineEvent = () => {
    if (!newTimelineEvent.name.trim() || !newTimelineEvent.date.trim()) return;
    
    const event: Partial<TimelineEvent> = {
      name: newTimelineEvent.name,
      date: newTimelineEvent.date,
      description: newTimelineEvent.description,
      type: 'character'
    };
    
    onCreateTimelineEvent?.(event);
    setNewTimelineEvent({ name: '', date: '', description: '' });
    setShowCreateTimeline(false);
  };

  const renderArrayField = (
    label: string,
    arrayKey: keyof CharacterAttributes,
    inputKey: keyof typeof newInputs
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={newInputs[inputKey]}
          onChange={(e) => setNewInputs(prev => ({ ...prev, [inputKey]: e.target.value }))}
          placeholder={`Add ${label.toLowerCase()}...`}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addItem(inputKey, arrayKey);
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          onClick={() => addItem(inputKey, arrayKey)}
          disabled={!newInputs[inputKey].trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(formData[arrayKey] as string[] || []).map((item, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1">
            {item}
            <Button
              size="sm"
              variant="ghost"
              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => removeItem(arrayKey, index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  );

  const renderCondensedView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Character Attributes Summary</h4>
        <Button
          onClick={() => setShowFullAttributes(!showFullAttributes)}
          size="sm"
          variant="outline"
          className="flex items-center gap-2"
        >
          {showFullAttributes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showFullAttributes ? 'Hide Details' : 'Show All Attributes'}
        </Button>
      </div>
      
      {!showFullAttributes && (
        <div className="space-y-2">
          {formData.traits && formData.traits.length > 0 && (
            <div>
              <Label className="text-xs">Traits</Label>
              <div className="flex flex-wrap gap-1">
                {formData.traits.slice(0, 3).map((trait, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">{trait}</Badge>
                ))}
                {formData.traits.length > 3 && (
                  <Badge variant="outline" className="text-xs">+{formData.traits.length - 3} more</Badge>
                )}
              </div>
            </div>
          )}
          
          {formData.motivations && formData.motivations.length > 0 && (
            <div>
              <Label className="text-xs">Motivations</Label>
              <div className="flex flex-wrap gap-1">
                {formData.motivations.slice(0, 2).map((motivation, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">{motivation}</Badge>
                ))}
                {formData.motivations.length > 2 && (
                  <Badge variant="outline" className="text-xs">+{formData.motivations.length - 2} more</Badge>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Character Node: {node?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Condensed view for non-first nodes */}
          {!isFirstNode && renderCondensedView()}

          {/* Full attributes (always shown for first node, toggleable for others) */}
          {(isFirstNode || showFullAttributes) && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || undefined }))}
                    placeholder="Character age..."
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Input
                    id="gender"
                    value={formData.gender || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    placeholder="Character gender..."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Character description..."
                />
              </div>

              <div>
                <Label htmlFor="backstory">Backstory</Label>
                <Textarea
                  id="backstory"
                  value={formData.backstory || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, backstory: e.target.value }))}
                  placeholder="Character backstory..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {renderArrayField('Aliases', 'aliases', 'alias')}
                {renderArrayField('Traits', 'traits', 'trait')}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {renderArrayField('Beliefs', 'beliefs', 'belief')}
                {renderArrayField('Motivations', 'motivations', 'motivation')}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {renderArrayField('Internal Conflicts', 'internalConflicts', 'internalConflict')}
                {renderArrayField('External Conflicts', 'externalConflicts', 'externalConflict')}
              </div>
            </div>
          )}

          {/* Plot Canvas Node Linking */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Link to Plot Canvas Nodes
            </Label>
            <Popover open={showPlotNodeSearch} onOpenChange={setShowPlotNodeSearch}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Search className="h-4 w-4 mr-2" />
                  Search Plot Canvas Nodes
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search nodes..." value={searchPlotNodes} onValueChange={setSearchPlotNodes} />
                  <CommandList>
                    <CommandEmpty>No nodes found.</CommandEmpty>
                    <CommandGroup>
                      {plotCanvasNodes
                        .filter(n => n.name.toLowerCase().includes(searchPlotNodes.toLowerCase()) || 
                                    n.type.toLowerCase().includes(searchPlotNodes.toLowerCase()))
                        .map(node => (
                        <CommandItem
                          key={node.id}
                          onSelect={() => {
                            if (selectedPlotNodeIds.includes(node.id)) {
                              setSelectedPlotNodeIds(prev => prev.filter(id => id !== node.id));
                            } else {
                              setSelectedPlotNodeIds(prev => [...prev, node.id]);
                            }
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedPlotNodeIds.includes(node.id)}
                              readOnly
                            />
                            <div>
                              <div className="font-medium">{node.name}</div>
                              <div className="text-sm text-muted-foreground">{node.type}</div>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            {selectedPlotNodeIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedPlotNodeIds.map(nodeId => {
                  const node = plotCanvasNodes.find(n => n.id === nodeId);
                  return node ? (
                    <Badge key={nodeId} variant="secondary" className="flex items-center gap-1">
                      {node.name}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0"
                        onClick={() => setSelectedPlotNodeIds(prev => prev.filter(id => id !== nodeId))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Timeline Event Linking */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Link to Timeline Events
            </Label>
            <div className="flex gap-2">
              <Popover open={showTimelineSearch} onOpenChange={setShowTimelineSearch}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start">
                    <Search className="h-4 w-4 mr-2" />
                    Search Timeline Events
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search events..." value={searchTimelineEvents} onValueChange={setSearchTimelineEvents} />
                    <CommandList>
                      <CommandEmpty>No events found.</CommandEmpty>
                      <CommandGroup>
                        {timelineEvents
                          .filter(e => e.name.toLowerCase().includes(searchTimelineEvents.toLowerCase()))
                          .map(event => (
                          <CommandItem
                            key={event.id}
                            onSelect={() => {
                              if (selectedTimelineEventIds.includes(event.id)) {
                                setSelectedTimelineEventIds(prev => prev.filter(id => id !== event.id));
                              } else {
                                setSelectedTimelineEventIds(prev => [...prev, event.id]);
                              }
                            }}
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={selectedTimelineEventIds.includes(event.id)}
                                readOnly
                              />
                              <div>
                                <div className="font-medium">{event.name}</div>
                                <div className="text-sm text-muted-foreground">{event.date}</div>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              
              <Button onClick={() => setShowCreateTimeline(!showCreateTimeline)} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {showCreateTimeline && (
              <div className="border rounded p-3 space-y-2">
                <Input
                  placeholder="Event name..."
                  value={newTimelineEvent.name}
                  onChange={(e) => setNewTimelineEvent(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Event date..."
                  value={newTimelineEvent.date}
                  onChange={(e) => setNewTimelineEvent(prev => ({ ...prev, date: e.target.value }))}
                />
                <Textarea
                  placeholder="Event description..."
                  value={newTimelineEvent.description}
                  onChange={(e) => setNewTimelineEvent(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreateTimelineEvent}>Create</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowCreateTimeline(false)}>Cancel</Button>
                </div>
              </div>
            )}
            
            {selectedTimelineEventIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTimelineEventIds.map(eventId => {
                  const event = timelineEvents.find(e => e.id === eventId);
                  return event ? (
                    <Badge key={eventId} variant="secondary" className="flex items-center gap-1">
                      {event.name}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0"
                        onClick={() => setSelectedTimelineEventIds(prev => prev.filter(id => id !== eventId))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
