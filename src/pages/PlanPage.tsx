import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Link, useNavigate } from 'react-router-dom';
import { ReactFlowProvider, Node } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PenTool, User, Settings, LogOut, Sun, Moon, Monitor } from 'lucide-react';
import { PlanLeftSidebar } from '@/components/PlanLeftSidebar';
import PlotCanvas from '@/components/PlotCanvas';
import CharacterArcPage from '@/pages/CharacterArcPage';
import { CharacterGlossary } from '@/components/CharacterGlossary';
import { WorldBuilding } from '@/components/WorldBuilding';
import { useBookContext } from '@/lib/BookContextProvider';
import { useUserContext } from '@/lib/UserContextProvider';
import { useTheme } from '@/components/ThemeProvider';
import { apiClient } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlotCanvasData } from '@/types/plotCanvas';
import { PlotCanvasProvider } from '@/contexts/PlotCanvasContext';
import WorldEntityArcsPage from '@/pages/WorldEntityArcsPage';
import { ModeNavigation, Mode } from '@/components/ModeNavigation';

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
  const { name, email } = useUserContext();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [currentMode, setCurrentMode] = useState<Mode>('planning');

  const selectedBoard = searchParams.get('boards') || 'plot-arcs';
  const selectedTab = searchParams.get('tab') || 'plot-outline';
  const characterId = searchParams.get('characterId');

  const [canvasData, setCanvasData] = useState<PlotCanvasData | null>(SAMPLE_CANVAS_DATA);
  const [loading, setLoading] = useState(false);


  const handleModeChange = (mode: Mode) => {
      setCurrentMode(mode);
    };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.length > 1 
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : names[0][0].toUpperCase();
  };

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

      <header className="relative z-30 sticky top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className=" mx-auto px-6">
            <div className="flex h-16 items-center justify-between">
              {/* Logo - Left Section from AppHeader */}
              <Link to="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <PenTool className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  AuthorStudio
                </span>
              </Link>

              {/* Navigation */}
              <div className="relative z-30">
                <div className="backdrop-blur-md bg-background/80 border-b border-border/50 sticky top-16 z-30 animate-slide-down">
                  <ModeNavigation 
                    currentMode={currentMode}
                    onModeChange={handleModeChange}
                    leftSidebarCollapsed={true}
                    rightSidebarCollapsed={true}
                    onToggleLeftSidebar={() => console.log('Left sidebar toggle clicked')}
                    onToggleRightSidebar={() => console.log('Right sidebar toggle clicked')}
                  />
                </div>
              </div>

              {/* Right side actions - Right Section from AppHeader */}
              <div className="flex items-center space-x-2">
                {/* Theme Toggle */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      <span className="sr-only">Toggle theme</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border border-border shadow-lg">
                    <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
                      <Sun className="mr-2 h-4 w-4" />
                      Light
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
                      <Moon className="mr-2 h-4 w-4" />
                      Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
                      <Monitor className="mr-2 h-4 w-4" />
                      System
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src="" alt={name || 'User'} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {getInitials(name || 'User')}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-background border border-border shadow-lg" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        {name && <p className="font-medium">{name}</p>}
                        {email && <p className="w-[200px] truncate text-sm text-muted-foreground">{email}</p>}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/account">
                        <User className="mr-2 h-4 w-4" />
                        Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

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
