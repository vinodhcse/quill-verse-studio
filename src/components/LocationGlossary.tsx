
import React, { useState } from 'react';
import { WorldData, WorldLocation } from '@/types/world';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Edit, MapPin, Calendar, History, GitBranch } from 'lucide-react';
import { CreateLocationModal } from './CreateLocationModal';
import { EditLocationModal } from './EditLocationModal';
import { apiClient } from '@/lib/api';

interface LocationGlossaryProps {
  worldData: WorldData | null;
  worldId: string | null;
  bookId?: string;
  versionId?: string;
  onUpdate: (data: WorldData) => void;
  onEditArc?: (locationId: string) => void;
}

export const LocationGlossary: React.FC<LocationGlossaryProps> = ({
  worldData,
  worldId,
  bookId,
  versionId,
  onUpdate,
  onEditArc,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<WorldLocation | null>(null);

  const locations = worldData?.world?.locations || [];

  const handleCreateLocation = async (locationData: Omit<WorldLocation, 'id'>) => {
    if (!worldId || !bookId || !versionId) return;

    try {
      const newLocation = {
        ...locationData,
        id: `loc-${Date.now()}`,
      };

      const updatedWorld = {
        world: {
          ...worldData!.world,
          locations: [...locations, newLocation],
        },
      };

      await apiClient.patch(`/books/${bookId}/versions/${versionId}/world/${worldId}`, updatedWorld);
      onUpdate(updatedWorld);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create location:', error);
    }
  };

  const handleEditLocation = async (locationId: string, locationData: Partial<WorldLocation>) => {
    if (!worldId || !bookId || !versionId) return;

    try {
      const updatedLocations = locations.map(loc =>
        loc.id === locationId ? { ...loc, ...locationData } : loc
      );

      const updatedWorld = {
        world: {
          ...worldData!.world,
          locations: updatedLocations,
        },
      };

      await apiClient.patch(`/books/${bookId}/versions/${versionId}/world/${worldId}`, updatedWorld);
      onUpdate(updatedWorld);
      setEditingLocation(null);
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!worldId || !bookId || !versionId) return;

    try {
      const updatedLocations = locations.filter(loc => loc.id !== locationId);

      const updatedWorld = {
        world: {
          ...worldData!.world,
          locations: updatedLocations,
        },
      };

      await apiClient.patch(`/books/${bookId}/versions/${versionId}/world/${worldId}`, updatedWorld);
      onUpdate(updatedWorld);
      setEditingLocation(null);
    } catch (error) {
      console.error('Failed to delete location:', error);
    }
  };

  return (
    <div className="h-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Locations</h3>
          <p className="text-muted-foreground">Manage places and settings in your story</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus size={16} />
          Add Location
        </Button>
      </div>

      {locations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MapPin size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Locations Yet</h3>
            <p className="text-muted-foreground mb-4">Start adding locations to your story</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={16} className="mr-2" />
              Create First Location
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {locations.map((location) => (
            <Card key={location.id} className="hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={location.image} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        <MapPin size={20} />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{location.name}</CardTitle>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEditArc && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditArc(location.id)}
                        title="Edit Arc"
                      >
                        <GitBranch size={14} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingLocation(location)}
                    >
                      <Edit size={14} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {location.description}
                </p>

                {location.rulesAndBeliefs.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {location.rulesAndBeliefs.slice(0, 3).map((rule, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {rule}
                      </Badge>
                    ))}
                    {location.rulesAndBeliefs.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{location.rulesAndBeliefs.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <History size={12} />
                    <span>{location.history.length} events</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar size={12} />
                    <span>{location.arc.length} arcs</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateLocationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateLocation}
      />

      {editingLocation && (
        <EditLocationModal
          isOpen={!!editingLocation}
          onClose={() => setEditingLocation(null)}
          onSave={handleEditLocation}
          onDelete={handleDeleteLocation}
          location={editingLocation}
          bookId={bookId!}
        />
      )}
    </div>
  );
};
