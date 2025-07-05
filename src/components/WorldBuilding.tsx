import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Globe, MapPin, Package, GitBranch } from 'lucide-react';
import { LocationGlossary } from './LocationGlossary';
import { ObjectGlossary } from './ObjectGlossary';
import { fetchAllWorlds, createWorld, deleteWorld } from '@/lib/api';
import { WorldData } from '@/types/world';

interface World {
  id: string;
  name: string;
  description?: string;
  world: {
    locations: any[];
    objects: any[];
  };
}

interface WorldBuildingProps {
  bookId?: string;
  versionId?: string;
}

export const WorldBuilding: React.FC<WorldBuildingProps> = ({ bookId, versionId }) => {
  const { bookId: paramBookId, versionId: paramVersionId } = useParams();
  const navigate = useNavigate();
  const [worlds, setWorlds] = useState<World[]>([]);
  const [selectedWorld, setSelectedWorld] = useState<World | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorldName, setNewWorldName] = useState('');

  const currentBookId = bookId || paramBookId;
  const currentVersionId = versionId || paramVersionId;

  useEffect(() => {
    fetchWorlds();
  }, [currentBookId, currentVersionId]);

  const fetchWorlds = async () => {
    if (!currentBookId || !currentVersionId) return;

    setLoading(true);
    try {
      const response = await fetchAllWorlds(currentBookId, currentVersionId);
      console.log('Worlds response:', response);
      if (response && response.length > 0) {
        setWorlds(response);
        setSelectedWorld(response[0]);
      }
    } catch (error) {
      console.error('Failed to fetch worlds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorld = async () => {
    if (!currentBookId || !currentVersionId || !newWorldName.trim()) return;

    try {
      const newWorldData = {
        name: newWorldName,
        world: {
          locations: [],
          objects: []
        }
      };
      
      const createdWorld = await createWorld(currentBookId, currentVersionId, newWorldData);
      const worldWithName = { ...createdWorld, name: newWorldName };
      
      setWorlds([...worlds, worldWithName]);
      setSelectedWorld(worldWithName);
      setNewWorldName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create world:', error);
    }
  };

  const updateWorld = (updatedData: WorldData) => {
    if (selectedWorld) {
      const updatedWorld = { ...selectedWorld, world: updatedData.world };
      setSelectedWorld(updatedWorld);
      setWorlds(worlds.map(w => w.id === selectedWorld.id ? updatedWorld : w));
    }
  };

  const handleDeleteWorld = async (worldId: string) => {
    if (!currentBookId || !currentVersionId) return;

    const confirmDelete = window.confirm('Are you sure you want to delete this world? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      await deleteWorld(currentBookId, currentVersionId, worldId);
      const updatedWorlds = worlds.filter(w => w.id !== worldId);
      setWorlds(updatedWorlds);
      
      if (selectedWorld?.id === worldId) {
        setSelectedWorld(updatedWorlds.length > 0 ? updatedWorlds[0] : null);
      }
    } catch (error) {
      console.error('Failed to delete world:', error);
    }
  };

  const handleEditArc = (entityId: string, entityType: 'WorldLocation' | 'WorldObject') => {
    if (!currentBookId || !currentVersionId) return;
    
    const url = `/plan/book/${currentBookId}/version/${currentVersionId}?boards=plot-arcs&tab=world-entity-arcs&worldId=${selectedWorld?.id}&worldEntityId=${entityId}&worldEntityType=${entityType}`;
    navigate(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading World Building...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Worlds Sidebar */}
      <div className="w-80 border-r bg-background/50">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Globe size={20} />
              Worlds
            </h3>
            <Button 
              size="sm" 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1"
            >
              <Plus size={14} />
              New
            </Button>
          </div>

          {isCreating && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <Input
                placeholder="World name"
                value={newWorldName}
                onChange={(e) => setNewWorldName(e.target.value)}
                className="mb-2"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateWorld()}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateWorld} disabled={!newWorldName.trim()}>
                  Create
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="p-2 space-y-2 overflow-y-auto">
          {worlds.map((world) => (
            <Card 
              key={world.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedWorld?.id === world.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedWorld(world)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">{world.name}</CardTitle>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <MapPin size={10} />
                        {world.world?.locations?.length || 0}
                      </Badge>
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <Package size={10} />
                        {world.world?.objects?.length || 0}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteWorld(world.id);
                    }}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}

          {worlds.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Globe size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No worlds created yet</p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setIsCreating(true)}
                className="mt-2"
              >
                Create First World
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* World Content */}
      <div className="flex-1 flex flex-col">
        {selectedWorld ? (
          <>
            <div className="border-b px-6 py-4">
              <h2 className="text-2xl font-bold">{selectedWorld.name}</h2>
              <p className="text-muted-foreground">Manage locations and objects in this world</p>
            </div>

            <div className="flex-1">
              <Tabs defaultValue="locations" className="h-full flex flex-col">
                <div className="border-b px-6 py-2">
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="locations">Locations</TabsTrigger>
                    <TabsTrigger value="objects">Objects</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1">
                  <TabsContent value="locations" className="h-full m-0">
                    <LocationGlossary
                      worldData={selectedWorld}
                      worldId={selectedWorld.id}
                      bookId={currentBookId}
                      versionId={currentVersionId}
                      onUpdate={updateWorld}
                      onEditArc={(locationId) => handleEditArc(locationId, 'WorldLocation')}
                    />
                  </TabsContent>

                  <TabsContent value="objects" className="h-full m-0">
                    <ObjectGlossary
                      worldData={selectedWorld}
                      worldId={selectedWorld.id}
                      bookId={currentBookId}
                      versionId={currentVersionId}
                      onUpdate={updateWorld}
                      onEditArc={(objectId) => handleEditArc(objectId, 'WorldObject')}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Globe size={64} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No World Selected</h3>
              <p className="text-muted-foreground mb-4">Select a world from the sidebar or create a new one</p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus size={16} className="mr-2" />
                Create World
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
