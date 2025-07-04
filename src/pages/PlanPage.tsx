import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { PlanLeftSidebar } from '@/components/PlanLeftSidebar';
import PlotCanvas from '@/components/PlotCanvas';
import CharacterArcPage from '@/pages/CharacterArcPage';
import { CharacterGlossary } from '@/components/CharacterGlossary';
import { WorldBuilding } from '@/components/WorldBuilding';
import { useBookContext } from '@/lib/BookContextProvider';
import { apiClient } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlotCanvasData } from '@/types/plotCanvas';
import { PlotCanvasProvider } from '@/contexts/PlotCanvasContext';

// Sample data for demonstration
const SAMPLE_CANVAS_DATA: PlotCanvasData = {
  nodes: [ 
  ],
  edges: [],
    timelineEvents: [],
    nodePositions: {},    
  lastUpdated: "2025-06-28T10:00:00Z"
};

const PlanPage: React.FC = () => {
  const { bookId, versionId } = useParams<{ bookId: string; versionId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedBoard = searchParams.get('boards') || 'plot-arcs';
  const selectedTab = searchParams.get('tab') || 'plot-outline';
  const characterId = searchParams.get('characterId');

  const [canvasData, setCanvasData] = useState<PlotCanvasData | null>(SAMPLE_CANVAS_DATA);
  const [loading, setLoading] = useState(false);

  const fetchCanvasData = async (boardType: string) => {
    if (!bookId || !versionId || boardType === 'characters' || boardType === 'world-building') return;

    setLoading(true);
    try {
      let endpoint = '';
      switch (boardType) {
        case 'plot-arcs':
          endpoint = `/books/${bookId}/versions/${versionId}/plotCanvas`;
          break;
        case 'timeline':
          endpoint = `/books/${bookId}/versions/${versionId}/timelineCanvas`;
          break;
        default:
          endpoint = `/books/${bookId}/versions/${versionId}/plotCanvas`;
      }

      const response = await apiClient.get(endpoint);
      setCanvasData(response.data || SAMPLE_CANVAS_DATA);
    } catch (error) {
      console.error('Failed to fetch canvas data:', error);
      setCanvasData(SAMPLE_CANVAS_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCanvasData(selectedBoard);
  }, [selectedBoard, bookId, versionId]);

  const handleBoardSelect = (boardId: string) => {
    setSearchParams({ boards: boardId });
  };

  const handleTabSelect = (tabId: string) => {
    setSearchParams({ boards: 'plot-arcs', tab: tabId });
  };

  /*const handleCanvasUpdate = (updatedCanvasData: PlotCanvasData) => {
    setCanvasData(updatedCanvasData);
  };*/

  const handleCanvasUpdate = async (data: any) => {
    if (!bookId || !versionId) return;

    try {
      let endpoint = '';
      switch (selectedBoard) {
        case 'plot-arcs':
          endpoint = `/books/${bookId}/versions/${versionId}/plotCanvas`;
          break;
        case 'timeline':
          endpoint = `/books/${bookId}/versions/${versionId}/timelineCanvas`;
          break;
        default:
          endpoint = `/books/${bookId}/versions/${versionId}/plotCanvas`;
      }

      await apiClient.patch(endpoint, data);
      setCanvasData(data);
    } catch (error) {
      console.error('Failed to save canvas data:', error);
      // Update local state even if save fails
      setCanvasData(data);
    }
  };

  const onNodeDragStop = (event: any, node: Node) => {
    if (!canvasData) return;
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

    const updatedCanvasData = { ...canvasData, nodes: updatedNodes };
    handleCanvasUpdate(updatedCanvasData);
  };

  const renderBoardContent = () => {
    switch (selectedBoard) {
      case 'plot-arcs':
        return (
          <Tabs value={selectedTab} className="flex-1 flex flex-col" onValueChange={handleTabSelect}>
            <div className="border-b px-4 py-2">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="plot-outline">Plot Outline</TabsTrigger>
                <TabsTrigger value="character-arcs">Character Arcs</TabsTrigger>
                <TabsTrigger value="world-entity-arcs">World Entity Arcs</TabsTrigger>
                <TabsTrigger value="timeline-arc">Timeline Arc</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1">
              <TabsContent value="plot-outline" className="h-full m-0">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-lg">Loading Plot Outline...</div>
                  </div>
                ) : (
                  <PlotCanvasProvider bookId={bookId} versionId={versionId}>
                    <ReactFlowProvider>
                      <PlotCanvas
                        bookId={bookId}
                        versionId={versionId}
                        canvasData={canvasData}
                        onCanvasUpdate={handleCanvasUpdate}
                        onNodeDragStop={onNodeDragStop}
                      />
                    </ReactFlowProvider>
                  </PlotCanvasProvider>
                )}
              </TabsContent>

              <TabsContent value="character-arcs" className="h-full m-0">
                <CharacterArcPage />
              </TabsContent>

              <TabsContent value="world-entity-arcs" className="h-full m-0">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-lg">Loading World Entity Arcs...</div>
                  </div>
                ) : (
                  <PlotCanvasProvider bookId={bookId} versionId={versionId}>
                    <ReactFlowProvider>
                      <PlotCanvas
                        bookId={bookId}
                        versionId={versionId}
                        canvasData={canvasData}
                        onCanvasUpdate={handleCanvasUpdate}
                        onNodeDragStop={onNodeDragStop}
                      />
                    </ReactFlowProvider>
                  </PlotCanvasProvider>
                )}
              </TabsContent>

              <TabsContent value="timeline-arc" className="h-full m-0">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-lg">Loading Timeline Arc...</div>
                  </div>
                ) : (
                  <PlotCanvasProvider bookId={bookId} versionId={versionId}>
                    <ReactFlowProvider>
                      <PlotCanvas
                        bookId={bookId}
                        versionId={versionId}
                        canvasData={canvasData}
                        onCanvasUpdate={handleCanvasUpdate}
                        onNodeDragStop={onNodeDragStop}
                      />
                    </ReactFlowProvider>
                  </PlotCanvasProvider>
                )}
              </TabsContent>
            </div>
          </Tabs>
        );
      case 'characters':
        return <CharacterGlossary bookId={bookId} versionId={versionId} />;
      case 'world-building':
        return <WorldBuilding bookId={bookId} versionId={versionId} />;
      case 'timeline':
        return (
          <PlotCanvasProvider bookId={bookId} versionId={versionId}>
            <ReactFlowProvider>
              <PlotCanvas
                bookId={bookId}
                versionId={versionId}
                canvasData={canvasData}
                onCanvasUpdate={handleCanvasUpdate}
                onNodeDragStop={onNodeDragStop}
              />
            </ReactFlowProvider>
          </PlotCanvasProvider>
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
            <h1 className="text-2xl font-bold">Story Planning</h1>
            <p className="text-muted-foreground">Organize your story structure and elements</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64">
          <PlanLeftSidebar
            isCollapsed={false}
            onToggle={() => {}}
            selectedBoard={selectedBoard}
            onBoardSelect={handleBoardSelect}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {renderBoardContent()}
        </div>
      </div>
    </div>
  );
};

export default PlanPage;
