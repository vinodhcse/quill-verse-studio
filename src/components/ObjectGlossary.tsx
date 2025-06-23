
import React, { useState } from 'react';
import { WorldData, WorldObject } from '@/types/world';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Edit, Package, Calendar, History } from 'lucide-react';
import { CreateObjectModal } from './CreateObjectModal';
import { EditObjectModal } from './EditObjectModal';
import { apiClient } from '@/lib/api';

interface ObjectGlossaryProps {
  worldData: WorldData | null;
  worldId: string | null;
  bookId?: string;
  versionId?: string;
  onUpdate: (data: WorldData) => void;
}

export const ObjectGlossary: React.FC<ObjectGlossaryProps> = ({
  worldData,
  worldId,
  bookId,
  versionId,
  onUpdate,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingObject, setEditingObject] = useState<WorldObject | null>(null);

  const objects = worldData?.world?.objects || [];

  const handleCreateObject = async (objectData: Omit<WorldObject, 'id'>) => {
    if (!worldId || !bookId || !versionId) return;

    try {
      const newObject = {
        ...objectData,
        id: `obj-${Date.now()}`,
      };

      const updatedWorld = {
        world: {
          ...worldData!.world,
          objects: [...objects, newObject],
        },
      };

      await apiClient.patch(`/books/${bookId}/versions/${versionId}/world/${worldId}`, updatedWorld);
      onUpdate(updatedWorld);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create object:', error);
    }
  };

  const handleEditObject = async (objectId: string, objectData: Partial<WorldObject>) => {
    if (!worldId || !bookId || !versionId) return;

    try {
      const updatedObjects = objects.map(obj =>
        obj.id === objectId ? { ...obj, ...objectData } : obj
      );

      const updatedWorld = {
        world: {
          ...worldData!.world,
          objects: updatedObjects,
        },
      };

      await apiClient.patch(`/books/${bookId}/versions/${versionId}/world/${worldId}`, updatedWorld);
      onUpdate(updatedWorld);
      setEditingObject(null);
    } catch (error) {
      console.error('Failed to update object:', error);
    }
  };

  const handleDeleteObject = async (objectId: string) => {
    if (!worldId || !bookId || !versionId) return;

    try {
      const updatedObjects = objects.filter(obj => obj.id !== objectId);

      const updatedWorld = {
        world: {
          ...worldData!.world,
          objects: updatedObjects,
        },
      };

      await apiClient.patch(`/books/${bookId}/versions/${versionId}/world/${worldId}`, updatedWorld);
      onUpdate(updatedWorld);
      setEditingObject(null);
    } catch (error) {
      console.error('Failed to delete object:', error);
    }
  };

  return (
    <div className="h-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Objects</h3>
          <p className="text-muted-foreground">Manage important objects and items in your story</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus size={16} />
          Add Object
        </Button>
      </div>

      {objects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Objects Yet</h3>
            <p className="text-muted-foreground mb-4">Start adding important objects to your story</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={16} className="mr-2" />
              Create First Object
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {objects.map((object) => (
            <Card key={object.id} className="hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={object.image} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        <Package size={20} />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{object.name}</CardTitle>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingObject(object)}
                    >
                      <Edit size={14} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {object.description}
                </p>

                {object.rulesAndBeliefs.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {object.rulesAndBeliefs.slice(0, 3).map((rule, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {rule}
                      </Badge>
                    ))}
                    {object.rulesAndBeliefs.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{object.rulesAndBeliefs.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <History size={12} />
                    <span>{object.history.length} events</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar size={12} />
                    <span>{object.arc.length} arcs</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateObjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateObject}
      />

      {editingObject && (
        <EditObjectModal
          isOpen={!!editingObject}
          onClose={() => setEditingObject(null)}
          onSave={handleEditObject}
          onDelete={handleDeleteObject}
          object={editingObject}
          bookId={bookId!}
        />
      )}
    </div>
  );
};
