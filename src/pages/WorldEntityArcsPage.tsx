import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WorldEntityArcCanvas } from '@/components/WorldArcs/WorldEntityArcCanvas';
import { useBookContext } from '@/lib/BookContextProvider';
import { CanvasNode, WorldLocationAttributes, WorldObjectAttributes } from '@/types/plotCanvas';

const WorldEntityArcsPage = () => {
  const { bookId, versionId } = useParams();
  const [searchParams] = useSearchParams();
  const worldEntityId = searchParams.get('worldEntityId');
  const worldEntityType = searchParams.get('worldEntityType') as 'location' | 'object';
  const activeTab = searchParams.get('tab') || 'location';
  
  const { state } = useBookContext();
  const [locationNodes, setLocationNodes] = useState<CanvasNode[]>([]);
  const [objectNodes, setObjectNodes] = useState<CanvasNode[]>([]);

  useEffect(() => {
    if (state.currentBook) {
      // Get locations and objects from the book
      const locations = state.currentBook.worldBuilding?.locations || [];
      const objects = state.currentBook.worldBuilding?.objects || [];

      // Create default arc nodes for locations if they don't exist
      const locationArcNodes = locations.map(location => ({
        id: location.id,
        type: 'WorldLocation' as const,
        name: location.name,
        detail: location.description,
        goal: 'Initial state',
        status: 'Not Completed' as const,
        timelineEventIds: [],
        parentId: null,
        childIds: [],
        linkedNodeIds: [],
        position: { x: 100, y: 100 },
        attributes: {
          id: location.id,
          name: location.name,
          description: location.description,
          customAttributes: location.customAttributes || [],
          history: location.history || []
        } as WorldLocationAttributes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'user',
        metaData: {
          tags: ['world-entity'],
          isTemplate: false
        }
      }));

      // Create default arc nodes for objects if they don't exist
      const objectArcNodes = objects.map(obj => ({
        id: obj.id,
        type: 'WorldObject' as const,
        name: obj.name,
        detail: obj.description,
        goal: 'Initial state',
        status: 'Not Completed' as const,
        timelineEventIds: [],
        parentId: null,
        childIds: [],
        linkedNodeIds: [],
        position: { x: 100, y: 100 },
        attributes: {
          id: obj.id,
          name: obj.name,
          description: obj.description,
          customAttributes: obj.customAttributes || [],
          history: obj.history || []
        } as WorldObjectAttributes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'user',
        metaData: {
          tags: ['world-entity'],
          isTemplate: false
        }
      }));

      setLocationNodes(locationArcNodes);
      setObjectNodes(objectArcNodes);
    }
  }, [state.currentBook]);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/plan/book/${bookId}/version/${versionId}`}>
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Plan
                </Link>
              </Button>
              <h1 className="text-xl font-semibold">World Entity Arcs</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="location">Location Arcs</TabsTrigger>
            <TabsTrigger value="object">Object Arcs</TabsTrigger>
          </TabsList>

          <TabsContent value="location" className="mt-6">
            <div className="h-[600px] border rounded-lg">
              <WorldEntityArcCanvas
                nodes={locationNodes}
                onNodesChange={setLocationNodes}
                entityType="location"
                bookId={bookId!}
                versionId={versionId!}
              />
            </div>
          </TabsContent>

          <TabsContent value="object" className="mt-6">
            <div className="h-[600px] border rounded-lg">
              <WorldEntityArcCanvas
                nodes={objectNodes}
                onNodesChange={setObjectNodes}
                entityType="object"
                bookId={bookId!}
                versionId={versionId!}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WorldEntityArcsPage;
