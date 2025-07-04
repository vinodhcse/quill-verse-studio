
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import WorldEntityArcCanvas from '@/components/WorldArcs/WorldEntityArcCanvas';
import { PlotCanvasProvider } from '@/contexts/PlotCanvasContext';
import { PlotCanvasData, CanvasNode } from '@/types/plotCanvas';
import { WorldLocation, WorldObject } from '@/types/world';
import { apiClient } from '@/lib/api';

const WorldEntityArcsPage: React.FC = () => {
  const { bookId, versionId } = useParams<{ bookId: string; versionId: string }>();
  const [searchParams] = useSearchParams();
  const worldEntityId = searchParams.get('worldEntityId');
  const [canvasData, setCanvasData] = useState<PlotCanvasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingCanvas, setUpdatingCanvas] = useState(false);

  console.log('WorldEntityArcsPage mounted with bookId:', bookId, 'versionId:', versionId, 'worldEntityId:', worldEntityId);

  useEffect(() => {
    fetchWorldEntityData();
  }, [bookId, versionId, worldEntityId]);

  const fetchWorldEntityData = async () => {
    if (!bookId || !versionId) return;

    setLoading(true);
    try {
      if (worldEntityId) {
        // Load specific world entity's arc
        console.log('Loading specific world entity arc for:', worldEntityId);
        const response = await apiClient.get(`/books/${bookId}/versions/${versionId}/world`);
        const worldData = response.data || { world: { locations: [], objects: [] } };
        
        // Find the world entity (could be location or object)
        const allWorldEntities = [
          ...worldData.world.locations.map((loc: WorldLocation) => ({ ...loc, entityType: 'WorldLocation' })),
          ...worldData.world.objects.map((obj: WorldObject) => ({ ...obj, entityType: 'WorldObject' }))
        ];
        
        const selectedWorldEntity = allWorldEntities.find(entity => entity.id === worldEntityId);
        console.log('Found selected world entity:', selectedWorldEntity);
        
        if (selectedWorldEntity && selectedWorldEntity.arc && 
            typeof selectedWorldEntity.arc === 'object' &&
            'nodes' in selectedWorldEntity.arc && Array.isArray(selectedWorldEntity.arc.nodes) &&
            'edges' in selectedWorldEntity.arc && Array.isArray(selectedWorldEntity.arc.edges)) {
          // World entity has proper canvas data - ensure it has required properties
          const arcData = selectedWorldEntity.arc as any;
          const properCanvasData: PlotCanvasData = {
            nodes: arcData.nodes || [],
            edges: arcData.edges || [],
            timelineEvents: arcData.timelineEvents || [],
            lastUpdated: arcData.lastUpdated || new Date().toISOString()
          };
          console.log('Loading world entity arc canvas data:', properCanvasData);
          setCanvasData(properCanvasData);
        } else {
          // Create initial node from world entity data
          const initialNode: CanvasNode = {
            id: `${worldEntityId}-arc-initial`,
            type: selectedWorldEntity?.entityType || 'WorldLocation',
            name: selectedWorldEntity?.name || 'World Entity',
            detail: 'Initial world entity state',
            goal: '',
            status: 'Not Completed',
            timelineEventIds: [],
            parentId: null,
            childIds: [],
            linkedNodeIds: [],
            position: { x: 100, y: 100 },
            characters: [],
            worlds: selectedWorldEntity ? [{ 
              id: selectedWorldEntity.id, 
              name: selectedWorldEntity.name, 
              type: selectedWorldEntity.entityType,
              locations: selectedWorldEntity.entityType === 'WorldLocation' ? [{ 
                id: selectedWorldEntity.id, 
                name: selectedWorldEntity.name, 
                selected: true 
              }] : [],
              objects: selectedWorldEntity.entityType === 'WorldObject' ? [{ 
                id: selectedWorldEntity.id, 
                name: selectedWorldEntity.name, 
                description: selectedWorldEntity.description,
                selected: true 
              }] : []
            }] : [],
            description: selectedWorldEntity?.description,
            customAttributes: selectedWorldEntity?.customAttributes || {},
            rulesAndBeliefs: selectedWorldEntity?.rulesAndBeliefs || [],
            history: selectedWorldEntity?.history || []
          };

          setCanvasData({ 
            nodes: [initialNode], 
            edges: [], 
            timelineEvents: [], 
            lastUpdated: new Date().toISOString() 
          });
        }
      } else {
        // Load all world entities as nodes
        console.log('Loading all world entities');
        const response = await apiClient.get(`/books/${bookId}/versions/${versionId}/world`);
        const worldData = response.data || { world: { locations: [], objects: [] } };
        
        console.log('Fetched world data:', worldData);

        const allWorldEntities = [
          ...worldData.world.locations.map((loc: WorldLocation) => ({ ...loc, entityType: 'WorldLocation' })),
          ...worldData.world.objects.map((obj: WorldObject) => ({ ...obj, entityType: 'WorldObject' }))
        ];

        const worldEntityNodes: CanvasNode[] = allWorldEntities.map((entity, index) => ({
          id: entity.id,
          type: entity.entityType,
          name: entity.name,
          detail: entity.description || '',
          goal: '',
          status: 'Not Completed',
          timelineEventIds: [],
          parentId: null,
          childIds: [],
          linkedNodeIds: [],
          position: { 
            x: (index % 4) * 300 + 100, 
            y: Math.floor(index / 4) * 200 + 100 
          },
          characters: [],
          worlds: [{ 
            id: entity.id, 
            name: entity.name, 
            type: entity.entityType,
            locations: entity.entityType === 'WorldLocation' ? [{ 
              id: entity.id, 
              name: entity.name, 
              selected: true 
            }] : [],
            objects: entity.entityType === 'WorldObject' ? [{ 
              id: entity.id, 
              name: entity.name, 
              description: entity.description,
              selected: true 
            }] : []
          }],
          description: entity.description,
          customAttributes: entity.customAttributes || {},
          rulesAndBeliefs: entity.rulesAndBeliefs || [],
          history: entity.history || []
        }));

        const worldEntityCanvasData: PlotCanvasData = {
          nodes: worldEntityNodes,
          edges: [],
          timelineEvents: [],
          lastUpdated: new Date().toISOString()
        };

        setCanvasData(worldEntityCanvasData);
        console.log('World entity canvas data set:', worldEntityCanvasData);
      }
    } catch (error) {
      console.error('Failed to fetch world entity data:', error);
      setCanvasData({ nodes: [], edges: [], timelineEvents: [], lastUpdated: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleCanvasUpdate = async (updatedCanvasData: PlotCanvasData) => {
    if (!bookId || !versionId) return;

    setUpdatingCanvas(true);
    try {
      console.log('Updating world entity canvas data:', updatedCanvasData);
      
      if (worldEntityId) {
        // Update specific world entity's arc
        await apiClient.patch(`/books/${bookId}/versions/${versionId}/world/entities/${worldEntityId}`, {
          arc: updatedCanvasData
        });
      }
      
      setCanvasData(updatedCanvasData);
      console.log('World entity canvas data updated successfully');
    } catch (error) {
      console.error('Failed to update world entity canvas data:', error);
    } finally {
      setUpdatingCanvas(false);
    }
  };

  return (
    <div className="relative h-screen">
      {(loading || updatingCanvas) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}
      <PlotCanvasProvider bookId={bookId} versionId={versionId}>
        <ReactFlowProvider>
          <WorldEntityArcCanvas 
            bookId={bookId} 
            versionId={versionId}
            worldEntityId={worldEntityId}
            canvasData={canvasData}
            onCanvasUpdate={handleCanvasUpdate}
          />
        </ReactFlowProvider>
      </PlotCanvasProvider>
    </div>
  );
};

export default WorldEntityArcsPage;
