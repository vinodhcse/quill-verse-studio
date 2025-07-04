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
  renderWorldSelectors?: (worlds: Array<{ id: string; name: string; locations?: Array<{ id: string; name: string }>; objects?: Array<{ id: string; name: string }> }>) => JSX.Element;
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
  versionId,
  renderWorldSelectors
}) => {
  const [formData, setFormData] = useState<Partial<PlotNodeData>>({
    type: 'Act',
    name: '',
    detail: '',
    goal: '',
    status: 'Not Completed',
    characters: [],
    worlds: [],
    worldObjects: [],
    worldLocations: [],
    linkedNodeIds: []
  });

  const [availableCharacters, setAvailableCharacters] = useState<any[]>([]);
  const [availableWorldEntities, setAvailableWorldEntities] = useState<any[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [selectedWorldLocations, setSelectedWorldLocations] = useState<string[]>([]);
  const [selectedWorldObjects, setSelectedWorldObjects] = useState<string[]>([]);
  const [selectedWorlds, setSelectedWorlds] = useState<string[]>([]);
  const [availableChapters, setAvailableChapters] = useState<any[]>([]);
  const [availableSceneBeats, setAvailableSceneBeats] = useState<any[]>([]);


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
      console.log('PlotNode data:', node);
      console.log('Characters in node:', node.characters);
      setFormData({
        ...node,
        worlds: node.worlds?.map(world => ({
          id: world.id,
          name: world.name,
          type: world.type || "default",
          locations: world.locations || [],
          objects: world.objects || []
        })) || []
      });
    }
  }, [node]);

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

  const handleCharacterRemove = (characterId: string) => {
    setFormData(prev => ({
      ...prev,
      characters: prev.characters?.filter(character => character.id !== characterId) || []
    }));
  };

  const handleEntityRemove = (entityId: string) => {
    const updatedEntities = selectedEntities.filter(id => id !== entityId);
    setSelectedEntities(updatedEntities);
    setFormData(prev => ({ ...prev, linkedNodeIds: updatedEntities }));
  };

  const handleWorldSelect = (worldId: string) => {
    if (!formData.worlds?.find(world => world.id === worldId)) {
      const selectedWorld = availableWorldEntities.find(world => world.id === worldId);
      if (selectedWorld) {
        setFormData(prev => ({
          ...prev,
          worlds: [...(prev.worlds || []), {
            id: selectedWorld.id,
            name: selectedWorld.name,
            type: selectedWorld.type,
            locations: selectedWorld.locations || [],
            objects: selectedWorld.objects || []
          }]
        }));
      }
    }
  };

  const handleWorldRemove = (worldId: string) => {
    setFormData(prev => ({
      ...prev,
      worlds: prev.worlds?.filter(world => world.id !== worldId) || []
    }));
  };

  const getEntityName = (entityId: string) => {
    const character = availableCharacters.find(c => c.id === entityId);
    if (character) return character.name;
    
    const worldEntity = availableWorldEntities.find(w => w.id === entityId);
    if (worldEntity) return worldEntity.name;
    
    return entityId;
  };

  const generateUniqueId = () => {
    return `id-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleSave = async () => {
    console.log('Saving node data:', formData);
    const updatedNodeData = {
        ...node,
        characters: formData.characters?.map(character => ({
            id: character.id,
            name: character.name,
            type: character.type, // Added type property
            attributes: character.attributes?.map(attribute => ({
                id: attribute.id || generateUniqueId(), // Ensure id exists
                name: attribute.name,
                value: attribute.value,
            })) || [],
        })) || [],
        worlds: formData.worlds?.map(world => ({
            id: world.id,
            name: world.name,
            type: world.type,
            locations: world.locations || [],
            objects: world.objects?.map(object => ({
                id: object.id || generateUniqueId(), // Ensure id exists
                name: object.name,
                description: object.description,
                selected: object.selected,
            })) || [],
        })) || [],
    };

    try {
        await onSave(node?.id || '', updatedNodeData);
        onClose();
    } catch (error) {
        console.error('Failed to save node data:', error);
    }
};

  const handleCharacterMultiSelect = (selectedIds: string[]) => {
    setFormData(prev => ({
      ...prev,
      characters: selectedIds.map(id => {
        const character = availableCharacters.find(c => c.id === id);
        return character ? {
          id: character.id,
          name: character.name,
          image: character.image,
          type: character.type
        } : { id, name: id, type: "unknown" };
      })
    }));
  };

  const handleWorldMultiSelect = (selectedIds: string[]) => {
    setFormData(prev => ({
      ...prev,
      worlds: selectedIds.map(id => {
        const world = availableWorldEntities.find(w => w.id === id);
        return world ? {
          id: world.id,
          name: world.name,
          type: world.type,
          locations: [],
          objects: []
        } : { id, name: id, type: "unknown", locations: [], objects: [] };
      })
    }));
  };

  const handleWorldLocationsAndObjects = async (worldIds: string[]) => {
    const updatedWorlds = await Promise.all(
      worldIds.map(async worldId => {
        const world = availableWorldEntities.find(w => w.id === worldId);
        const locations = world?.locations || [];
        const objects = world?.objects || [];
        return {
          id: worldId,
          name: world?.name || worldId,
          type: world?.type || "default",
          locations,
          objects
        };
      })
    );
    setFormData(prev => ({ ...prev, worlds: updatedWorlds }));
  };

  const handleWorldSelectionChange = (worldId: string, type: 'locations' | 'objects', selectedIds: string[]) => {
    setFormData(prev => ({
      ...prev,
      worlds: prev.worlds?.map(world => (
        world.id === worldId ? {
          ...world,
          [type]: selectedIds.map(id => {
            const entity = availableWorldEntities.find(w => w.id === worldId)?.[type]?.find(item => item.id === id);
            return entity ? { id: entity.id, name: entity.name, description: entity.description, image: entity.image, customAttributes: entity.customAttributes } : { id, name: id };
          })
        } : world
      )) || []
    }));
  };

  const renderCharacterDisplay = (character: { id: string; name: string; image?: string }) => {
    const initials = character.name
      .split(' ')
      .map(part => part[0])
      .join('');

    return (
      <div
        key={character.id}
        className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-gray-100 cursor-pointer"
        onClick={() => onNavigateToEntity(character.id)}
      >
        {character.image ? (
          <img
            src={character.image}
            alt={character.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="text-sm font-bold text-gray-600">{initials}</span>
        )}
      </div>
    );
  };

  const renderWorldEntityDisplay = (entity: { id: string; name: string; image?: string }) => {
    return (
      <div
        key={entity.id}
        className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-gray-100 cursor-pointer"
        onClick={() => onNavigateToEntity(entity.id)}
      >
        {entity.image ? (
          <img
            src={entity.image}
            alt={entity.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="text-sm font-bold text-gray-600">{entity.name[0]}</span>
        )}
      </div>
    );
  };

  const onNavigateToEntity = (entityId: string) => {
    // Logic to navigate to the corresponding entity's arc
    console.log(`Navigating to entity arc with ID: ${entityId}`);
    // Replace the above with actual navigation logic, e.g., routing or state updates
  };

  const handleAttributeChange = (characterId: string, index: number, field: 'name' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      characters: prev.characters?.map(character => {
        if (character.id === characterId) {
          const updatedAttributes = [...(character.attributes || [])];
          updatedAttributes[index] = {
            ...updatedAttributes[index],
            [field]: value
          };
          return {
            ...character,
            attributes: updatedAttributes
          };
        }
        return character;
      }) || []
    }));
  };

  const addAttribute = (characterId: string) => {
    setFormData(prev => ({
      ...prev,
      characters: prev.characters?.map(character => {
        if (character.id === characterId) {
          return {
            ...character,
            attributes: [...(character.attributes || []), { id: generateUniqueId(), name: '', value: '' }]
          };
        }
        return character;
      }) || []
    }));
  };

  const handleObjectChange = (worldEntityId: string, index: number, field: 'name' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      worlds: prev.worlds?.map(world => {
        if (world.id === worldEntityId) {
          const updatedObjects = [...(world.objects || [])];
          updatedObjects[index] = {
            ...updatedObjects[index],
            [field]: value
          };
          return {
            ...world,
            objects: updatedObjects
          };
        }
        return world;
      }) || []
    }));
  };

  const addObject = (worldEntityId: string) => {
    setFormData(prev => ({
      ...prev,
      worlds: prev.worlds?.map(world => {
        if (world.id === worldEntityId) {
          return {
            ...world,
            objects: [...(world.objects || []), { id: generateUniqueId(), name: '', description: '' }]
          };
        }
        return world;
      }) || []
    }));
  };

  const renderCharacterAttributesEditor = (character) => {
    const attributeFields = [
      'aliases', 'age', 'birthday', 'gender', 'description', 'image', 'traits',
      'backstory', 'beliefs', 'motivations', 'internalConflicts', 'externalConflicts',
      'relationships', 'goals', 'arc'
    ];

    return (
      <div>
        <h3 className="text-lg font-semibold">{character.name} Attributes</h3>
        {attributeFields.map(field => (
          <div key={field} className="mb-4">
            <Label htmlFor={field}>{field.charAt(0).toUpperCase() + field.slice(1)}</Label>
            {Array.isArray(character[field]) ? (
              <Textarea
                id={field}
                value={(character[field] || []).join(', ')}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  characters: prev.characters?.map(c => c.id === character.id ? {
                    ...c,
                    [field]: e.target.value.split(',').map(item => item.trim())
                  } : c)
                }))}
                placeholder={`Enter ${field}...`}
                rows={2}
              />
            ) : (
              <Input
                id={field}
                value={character[field] || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  characters: prev.characters?.map(c => c.id === character.id ? {
                    ...c,
                    [field]: e.target.value
                  } : c)
                }))}
                placeholder={`Enter ${field}...`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderAttributeSummary = () => {
    const originalAttributes = node?.characters?.find(c => c.id === formData.characters?.[0]?.id) || {};
    const currentAttributes = formData.characters?.[0] || {};

    const added = Object.keys(currentAttributes).filter(key => {
      const originalValue = originalAttributes[key];
      const currentValue = currentAttributes[key];
      return Array.isArray(currentValue) ? currentValue.some(item => !originalValue?.includes(item)) : currentValue && !originalValue;
    });

    const removed = Object.keys(originalAttributes).filter(key => {
      const originalValue = originalAttributes[key];
      const currentValue = currentAttributes[key];
      return Array.isArray(originalValue) ? originalValue.some(item => !currentValue?.includes(item)) : originalValue && !currentValue;
    });

    const replaced = Object.keys(currentAttributes).filter(key => {
      const originalValue = originalAttributes[key];
      const currentValue = currentAttributes[key];
      return originalValue && currentValue && originalValue !== currentValue;
    });

    return (
      <div>
        <h3>Summary of Changes</h3>
        <p>Added: {added.join(', ')}</p>
        <p>Removed: {removed.join(', ')}</p>
        <p>Replaced: {replaced.join(', ')}</p>
      </div>
    );
  };

  const renderChapterAndSceneBeatSelectors = () => (
    <div>
      <Label htmlFor="chapter">Chapter</Label>
      <Select value={formData.chapter as string} onValueChange={value => setFormData(prev => ({ ...prev, chapter: value }))}>
        {availableChapters.map(chapter => (
          <SelectItem key={chapter.id} value={chapter.id}>{chapter.name}</SelectItem>
        ))}
      </Select>

      <Label htmlFor="sceneBeat">Scene Beat</Label>
      <Select value={formData.sceneBeat as string} onValueChange={value => setFormData(prev => ({ ...prev, sceneBeat: value }))}>
        {availableSceneBeats.map(sceneBeat => (
          <SelectItem key={sceneBeat.id} value={sceneBeat.id}>{sceneBeat.name}</SelectItem>
        ))}
      </Select>
    </div>
  );

  const renderWorldEntityEditor = (worldEntity) => {
    return (
      <div>
        <h3 className="text-lg font-semibold">{worldEntity.name} Objects</h3>
        {worldEntity.objects?.map(object => (
          <div key={object.id} className="flex gap-2 mb-2">
            <Input
              value={object.name}
              onChange={(e) => handleObjectChange(worldEntity.id, worldEntity.objects.findIndex(o => o.id === object.id), 'name', e.target.value)}
              placeholder="Object Name"
              className="flex-1"
            />
            <Textarea
              value={object.description}
              onChange={(e) => handleObjectChange(worldEntity.id, worldEntity.objects.findIndex(o => o.id === object.id), 'description', e.target.value)}
              placeholder="Object Description"
              className="flex-1"
              rows={2}
            />
            <Button
              variant="destructive"
              onClick={() => setFormData(prev => ({
                ...prev,
                worlds: prev.worlds?.map(w => w.id === worldEntity.id ? {
                  ...w,
                  objects: w.objects?.filter(o => o.id !== object.id)
                } : w)
              }))}
            >
              <X size={16} />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          onClick={() => addObject(worldEntity.id)}
          className="mt-2"
        >
          Add Object
        </Button>
      </div>
    );
  };

  const handleSaveCharacterArc = async (nodeId: string, updatedData: Partial<PlotNodeData>) => {
    if (!bookId || !versionId) return;

    try {
      const response = await apiClient.patch(`/books/${bookId}/versions/${versionId}/characters/${nodeId}`, {
        arcs: updatedData,
      });
      console.log('Character arc saved successfully:', response.data);
    } catch (error) {
      console.error('Failed to save character arc:', error);
    }
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
                <select
                  multiple
                  onChange={e => handleCharacterMultiSelect(Array.from(e.target.selectedOptions).map(opt => opt.value))}
                  value={formData.characters?.map(character => character.id) || []}
                  className="w-full p-2 border rounded"
                >
                  {availableCharacters.map(character => (
                    <option key={character.id} value={character.id}>
                      {character.name}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.characters?.map(character => (
                    <Badge key={character.id} variant="outline" className="flex items-center gap-1">
                      {character.name}
                      <X 
                        size={12} 
                        className="cursor-pointer hover:text-destructive"
                        onClick={() => handleCharacterRemove(character.id)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Worlds</Label>
                <select
                  multiple
                  onChange={e => handleWorldSelect(e.target.value)}
                  value={formData.worlds?.map(world => world.id) || []}
                  className="w-full p-2 border rounded"
                >
                  {availableWorldEntities.map(world => (
                    <option key={world.id} value={world.id}>
                      {world.name}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.worlds?.map(world => (
                    <Badge key={world.id} variant="outline" className="flex items-center gap-1">
                      {world.name}
                      <X 
                        size={12} 
                        className="cursor-pointer hover:text-destructive"
                        onClick={() => handleWorldRemove(world.id)}
                      />
                    </Badge>
                  ))}
                </div>
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

          {/* World selectors for locations and objects */}
          {formData.worlds?.map(world => (
            <div key={world.id}>
              <Label>{world.name} Locations</Label>
              <select
                multiple
                onChange={e => handleWorldSelectionChange(world.id, 'locations', Array.from(e.target.selectedOptions).map(opt => opt.value))}
                value={world.locations?.map(location => location.id) || []}
                className="w-full p-2 border rounded"
              >
                {availableWorldEntities.find(w => w.id === world.id)?.locations?.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>

              <Label>{world.name} Objects</Label>
              <select
                multiple
                onChange={e => handleWorldSelectionChange(world.id, 'objects', Array.from(e.target.selectedOptions).map(opt => opt.value))}
                value={world.objects?.map(object => object.id) || []}
                className="w-full p-2 border rounded"
              >
                {availableWorldEntities.find(w => w.id === world.id)?.objects?.map(object => (
                  <option key={object.id} value={object.id}>
                    {object.name}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Edit Character Attributes and World Entity Objects */}
          {formData.characters?.map(character => (
            <div key={character.id} className="mt-4">
              <h3 className="text-lg font-semibold">{character.name}</h3>
              {renderCharacterAttributesEditor(character)}
            </div>
          ))}

          {formData.worlds?.map(worldEntity => (
            <div key={worldEntity.id} className="mt-4">
              <h3 className="text-lg font-semibold">{worldEntity.name}</h3>
              {renderWorldEntityEditor(worldEntity)}
            </div>
          ))}

          {renderAttributeSummary()}

          {renderChapterAndSceneBeatSelectors()}

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

        {/* Inside SceneBeats node display logic */}
        {formData.type === 'SceneBeats' && (
          <div className="flex flex-wrap gap-2">
            {formData.characters?.map(character => renderCharacterDisplay(character))}
            {formData.worlds?.flatMap(world => [
              ...world.locations.map(location => renderWorldEntityDisplay(location)),
              ...world.objects.map(object => renderWorldEntityDisplay(object))
            ])}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
