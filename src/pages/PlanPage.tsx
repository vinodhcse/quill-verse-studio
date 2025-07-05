
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ReactFlowProvider, Node } from '@xyflow/react';
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
import WorldEntityArcsPage from '@/pages/WorldEntityArcsPage';
import AppHeader from '@/components/AppHeader';

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
                <WorldEntityArcsPage />
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      {/* Enhanced animated background elements with Apple-style floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary floating orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary/8 to-accent/8 rounded-full blur-3xl animate-pulse floating" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-accent/6 to-secondary/6 rounded-full blur-3xl animate-pulse floating-delayed" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-br from-primary/4 to-accent/4 rounded-full blur-2xl animate-pulse floating" style={{ animationDelay: '4s' }} />
        
        {/* Additional floating particles for depth */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-primary/3 rounded-full blur-xl floating" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-accent/4 rounded-full blur-xl floating-delayed" style={{ animationDelay: '3s' }} />
        <div className="absolute top-3/4 right-1/3 w-20 h-20 bg-secondary/5 rounded-full blur-lg floating" style={{ animationDelay: '5s' }} />
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_1px_1px,_rgb(255,255,255)_1px,_transparent_0)] bg-[length:40px_40px]" />
      </div>

      {/* App Header */}
      <div className="relative z-30">
        <AppHeader />
      </div>

      <div className="relative z-30 border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Story Planning</h1>
            <p className="text-muted-foreground">Organize your story structure and elements</p>
          </div>
          <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
            Planning Mode
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex overflow-hidden h-[calc(100vh-113px)]">
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
