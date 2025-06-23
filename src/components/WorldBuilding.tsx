
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LocationGlossary } from './LocationGlossary';
import { ObjectGlossary } from './ObjectGlossary';
import { apiClient } from '@/lib/api';
import { WorldData } from '@/types/world';

interface WorldBuildingProps {
  bookId?: string;
  versionId?: string;
}

export const WorldBuilding: React.FC<WorldBuildingProps> = ({ bookId, versionId }) => {
  const { bookId: paramBookId, versionId: paramVersionId } = useParams();
  const [worldData, setWorldData] = useState<WorldData | null>(null);
  const [loading, setLoading] = useState(true);
  const [worldId, setWorldId] = useState<string | null>(null);

  const currentBookId = bookId || paramBookId;
  const currentVersionId = versionId || paramVersionId;

  useEffect(() => {
    fetchWorldData();
  }, [currentBookId, currentVersionId]);

  const fetchWorldData = async () => {
    if (!currentBookId || !currentVersionId) return;

    setLoading(true);
    try {
      // First try to get existing world data
      const response = await apiClient.get(`/books/${currentBookId}/versions/${currentVersionId}/world/all`);
      console.log('world resposne', response);
      if (response.data && response.data.length > 0) {
        const firstWorld = response.data[0];
        setWorldId(firstWorld.id);
        setWorldData(firstWorld);
      } else {
        // Create a new world if none exists
        const newWorldResponse = await apiClient.post(`/books/${currentBookId}/versions/${currentVersionId}/world`, {
          world: {
            locations: [],
            objects: []
          }
        });
        setWorldId(newWorldResponse.data.id);
        setWorldData(newWorldResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch world data:', error);
      // Create a new world on error
      try {
        const newWorldResponse = await apiClient.post(`/books/${currentBookId}/versions/${currentVersionId}/world`, {
          world: {
            locations: [],
            objects: []
          }
        });
        setWorldId(newWorldResponse.data.id);
        setWorldData(newWorldResponse.data);
      } catch (createError) {
        console.error('Failed to create world:', createError);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateWorldData = (updatedData: WorldData) => {
    setWorldData(updatedData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading World Building...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b px-6 py-4">
        <h2 className="text-2xl font-bold">World Building</h2>
        <p className="text-muted-foreground">Create and manage your story's locations and objects</p>
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
                worldData={worldData}
                worldId={worldId}
                bookId={currentBookId}
                versionId={currentVersionId}
                onUpdate={updateWorldData}
              />
            </TabsContent>

            <TabsContent value="objects" className="h-full m-0">
              <ObjectGlossary
                worldData={worldData}
                worldId={worldId}
                bookId={currentBookId}
                versionId={currentVersionId}
                onUpdate={updateWorldData}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
