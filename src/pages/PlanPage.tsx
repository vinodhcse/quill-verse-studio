
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { PlanLeftSidebar } from '@/components/PlanLeftSidebar';
import PlotCanvas from '@/components/PlotCanvas';
import { CharacterGlossary } from '@/components/CharacterGlossary';
import { WorldBuilding } from '@/components/WorldBuilding';
import { useBookContext } from '@/lib/BookContextProvider';
import { apiClient } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PlanPage: React.FC = () => {
  const { bookId, versionId } = useParams<{ bookId: string; versionId: string }>();
  const { state } = useBookContext();
  const [leftSidebarVisible, setLeftSidebarVisible] = useState(true);
  const [selectedBoard, setSelectedBoard] = useState('plot-arcs');
  const [canvasData, setCanvasData] = useState(null);
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
      setCanvasData(response.data);
    } catch (error) {
      console.error('Failed to fetch canvas data:', error);
      setCanvasData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCanvasUpdate = async (data: any) => {
    if (!bookId || !versionId || selectedBoard === 'characters' || selectedBoard === 'world-building') return;

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

      await apiClient.put(endpoint, data);
      setCanvasData(data);
    } catch (error) {
      console.error('Failed to save canvas data:', error);
    }
  };

  useEffect(() => {
    fetchCanvasData(selectedBoard);
  }, [selectedBoard, bookId, versionId]);

  const handleBoardSelect = (boardId: string) => {
    setSelectedBoard(boardId);
  };

  const renderPlotArcsContent = () => (
    <Tabs value="plot-outline" className="flex-1 flex flex-col">
      <div className="border-b px-4 py-2">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="plot-outline">Plot Outline</TabsTrigger>
          <TabsTrigger value="character-arcs">Character Arcs</TabsTrigger>
          <TabsTrigger value="world-building">World Building</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
      </div>

      <div className="flex-1">
        <TabsContent value="plot-outline" className="h-full m-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-lg">Loading Plot Outline...</div>
            </div>
          ) : (
            <ReactFlowProvider>
              <PlotCanvas
                bookId={bookId}
                versionId={versionId}
                canvasData={canvasData}
                onCanvasUpdate={handleCanvasUpdate}
              />
            </ReactFlowProvider>
          )}
        </TabsContent>

        <TabsContent value="character-arcs" className="h-full m-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-lg">Loading Character Arcs...</div>
            </div>
          ) : (
            <ReactFlowProvider>
              <PlotCanvas
                bookId={bookId}
                versionId={versionId}
                canvasData={canvasData}
                onCanvasUpdate={handleCanvasUpdate}
              />
            </ReactFlowProvider>
          )}
        </TabsContent>

        <TabsContent value="world-building" className="h-full m-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-lg">Loading World Building...</div>
            </div>
          ) : (
            <ReactFlowProvider>
              <PlotCanvas
                bookId={bookId}
                versionId={versionId}
                canvasData={canvasData}
                onCanvasUpdate={handleCanvasUpdate}
              />
            </ReactFlowProvider>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="h-full m-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-lg">Loading Timeline...</div>
            </div>
          ) : (
            <ReactFlowProvider>
              <PlotCanvas
                bookId={bookId}
                versionId={versionId}
                canvasData={canvasData}
                onCanvasUpdate={handleCanvasUpdate}
              />
            </ReactFlowProvider>
          )}
        </TabsContent>
      </div>
    </Tabs>
  );

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
        {leftSidebarVisible && (
          <div className="w-64">
            <PlanLeftSidebar
              isCollapsed={false}
              onToggle={() => setLeftSidebarVisible(false)}
              selectedBoard={selectedBoard}
              onBoardSelect={handleBoardSelect}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {selectedBoard === 'plot-arcs' && renderPlotArcsContent()}
          
          {selectedBoard === 'characters' && (
            <CharacterGlossary bookId={bookId} versionId={versionId} />
          )}
          
          {selectedBoard === 'world-building' && (
            <WorldBuilding bookId={bookId} versionId={versionId} />
          )}
          
          {selectedBoard === 'timeline' && (
            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-lg">Loading Timeline...</div>
                </div>
              ) : (
                <ReactFlowProvider>
                  <PlotCanvas
                    bookId={bookId}
                    versionId={versionId}
                    canvasData={canvasData}
                    onCanvasUpdate={handleCanvasUpdate}
                  />
                </ReactFlowProvider>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanPage;
