
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ReactFlowProvider, Node } from '@xyflow/react';
import { WorldEntityArcCanvas } from '@/components/WorldArcs/WorldEntityArcCanvas';
import { PlanLeftSidebar } from '@/components/PlanLeftSidebar';
import { apiClient } from '@/lib/api';
import { PlotCanvasData } from '@/types/plotCanvas';

const WorldEntityArcsPage: React.FC = () => {
  const { bookId, versionId } = useParams<{ bookId: string; versionId: string }>();
  const [searchParams] = useSearchParams();
  const selectedEntityType = searchParams.get('entityType') || 'character';

  const [canvasData, setCanvasData] = useState<PlotCanvasData>({
    nodes: [],
    edges: [],
    timelineEvents: [],
    nodePositions: {},
    lastUpdated: new Date().toISOString()
  });

  const fetchCanvasData = async () => {
    if (!bookId || !versionId) return;

    try {
      const endpoint = `/books/${bookId}/versions/${versionId}/worldEntityArcs/${selectedEntityType}`;
      const response = await apiClient.get(endpoint);
      setCanvasData(response.data);
    } catch (error) {
      console.error('Failed to fetch canvas data:', error);
    }
  };

  useEffect(() => {
    fetchCanvasData();
  }, [bookId, versionId, selectedEntityType]);

  const handleCanvasUpdate = async (data: PlotCanvasData) => {
    if (!bookId || !versionId) return;

    try {
      const endpoint = `/books/${bookId}/versions/${versionId}/worldEntityArcs/${selectedEntityType}`;
      await apiClient.patch(endpoint, data);
      setCanvasData(data);
    } catch (error) {
      console.error('Failed to save canvas data:', error);
      setCanvasData(data);
    }
  };

  const onNodeDragStop = (event: any, node: Node) => {
    console.log('Node drag stopped:', node);
    const updatedNodes = canvasData.nodes.map((canvasNode) => {
      if (canvasNode.id === node.id) {
        return {
          ...canvasNode,
          position: node.position,
        };
      }
      return canvasNode;
    });

    const updatedCanvasData = { 
      ...canvasData, 
      nodes: updatedNodes,
      timelineEvents: [],
      lastUpdated: new Date().toISOString()
    };
    handleCanvasUpdate(updatedCanvasData);
  };

  const renderEntityCanvas = () => {
    const emptyCanvasData = {
      nodes: [],
      edges: [],
      timelineEvents: [],
      nodePositions: {},
      lastUpdated: new Date().toISOString()
    };

    switch (selectedEntityType) {
      case 'character':
        return (
          <WorldEntityArcCanvas
            bookId={bookId}
            versionId={versionId}
            canvasData={canvasData || emptyCanvasData}
            onCanvasUpdate={handleCanvasUpdate}
            onNodeDragStop={onNodeDragStop}
          />
        );
      case 'location':
        return (
          <WorldEntityArcCanvas
            bookId={bookId}
            versionId={versionId}
            canvasData={canvasData || emptyCanvasData}
            onCanvasUpdate={handleCanvasUpdate}
            onNodeDragStop={onNodeDragStop}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">World Entity Arcs</h1>
            <p className="text-muted-foreground">Visualize and manage arcs for characters and locations</p>
          </div>
          <div>
            <select
              className="border rounded px-2 py-1"
              value={selectedEntityType}
              onChange={(e) => {
                const newEntityType = e.target.value;
                searchParams.set('entityType', newEntityType);
                window.history.replaceState(null, '', `?${searchParams.toString()}`);
                fetchCanvasData();
              }}
            >
              <option value="character">Character Arcs</option>
              <option value="location">Location Arcs</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (if needed) */}
        {/* Main Content */}
        <div className="flex-1 p-4">
          <ReactFlowProvider>
            {renderEntityCanvas()}
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
};

export default WorldEntityArcsPage;
