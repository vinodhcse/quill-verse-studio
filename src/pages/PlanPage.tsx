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
    {
      id: "outline-hp1",
      type: "Outline",
      name: "Harry Potter and the Sorcerer's Stone",
      detail: "A young orphaned boy discovers he is a wizard and attends a magical school, where he uncovers a plot to steal a powerful stone.",
      goal: "Introduce Harry and the wizarding world, establish the conflict with Voldemort, and set up the series.",
      status: "Completed",
      timelineEventIds: [],
      parentId: null,
      childIds: ["act-1", "act-2", "act-3"],
      linkedNodeIds: [],
      position: { x: 0, y: 0 }
    },
    {
      id: "act-1",
      type: "Act",
      name: "Act 1: The Boy Who Lived",
      detail: "Harry's life with the Dursleys, discovery of his magical heritage, and journey to Hogwarts.",
      goal: "Establish the ordinary world and introduce the 'call to adventure'.",
      status: "Completed",
      timelineEventIds: ["timeline-event-1", "timeline-event-2"],
      parentId: "outline-hp1",
      childIds: ["chapter-1", "chapter-2", "chapter-6"],
      linkedNodeIds: [],
      position: { x: 100, y: 200 }
    },
    {
      id: "chapter-1",
      type: "Chapter",
      name: "Chapter 1: The Boy Who Lived",
      detail: "Introduction to the Dursleys and the magical world learning about Harry's survival.",
      goal: "Set up the contrast between the muggle and wizarding worlds.",
      status: "Completed",
      timelineEventIds: [],
      parentId: "act-1",
      childIds: ["scene-beat-1"],
      linkedNodeIds: [],
      position: { x: 250, y: 300 }
    },
    {
      id: "scene-beat-1",
      type: "SceneBeats",
      name: "Dumbledore, McGonagall, and Hagrid at Privet Drive",
      detail: "Dumbledore, McGonagall, and Hagrid leave baby Harry on the Dursleys' doorstep.",
      goal: "Explain how Harry ended up with the Dursleys and reveal the existence of the wizarding world.",
      status: "Completed",
      timelineEventIds: ["timeline-event-1"],
      parentId: "chapter-1",
      childIds: [],
      linkedNodeIds: ["character-dumbledore", "character-mcgonagall", "character-hagrid", "world-location-privet-drive"],
      position: { x: 400, y: 400 }
    },
    {
      id: "act-2",
      type: "Act",
      name: "Act 2: The Trials of Friendship",
      detail: "Harry's first year at Hogwarts, making friends and enemies, and discovering the mystery of the Sorcerer's Stone.",
      goal: "Develop the characters and build tension as the central conflict escalates.",
      status: "Completed",
      timelineEventIds: ["timeline-event-3", "timeline-event-4"],
      parentId: "outline-hp1",
      childIds: ["chapter-16"],
      linkedNodeIds: [],
      position: { x: 600, y: 200 }
    },
    {
      id: "act-3",
      type: "Act",
      name: "Act 3: The Sorcerer's Stone",
      detail: "The final confrontation with Quirrell/Voldemort and the resolution of the school year.",
      goal: "Resolve the main conflict and show the characters' growth.",
      status: "Completed",
      timelineEventIds: ["timeline-event-5"],
      parentId: "outline-hp1",
      childIds: ["chapter-17"],
      linkedNodeIds: [],
      position: { x: 1100, y: 200 }
    },
    {
      id: "character-harry",
      type: "Character",
      name: "Harry Potter",
      detail: "The protagonist, a young wizard with a mysterious past.",
      goal: "To find his place in the world and uncover the truth about his past.",
      status: "Completed",
      timelineEventIds: [],
      parentId: null,
      childIds: [],
      linkedNodeIds: [],
      position: { x: 100, y: 1000 }
    }
  ],
  timelineEvents: [
    {
      id: "timeline-event-1",
      name: "Harry is left at the Dursleys' doorstep",
      date: "November 1, 1981",
      type: "story",
      linkedNodeIds: ["scene-beat-1"],
      description: "Baby Harry is delivered to the Dursleys by Dumbledore, McGonagall, and Hagrid."
    }
  ],
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

  const handleCanvasUpdate = (updatedCanvasData: PlotCanvasData) => {
    setCanvasData(updatedCanvasData);
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
