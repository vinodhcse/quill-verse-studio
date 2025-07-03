
import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Node,
  Edge,
  Connection,
  ConnectionMode,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import PlotNode from '@/components/PlotNode';
import DeletableEdge from '@/components/DeletableEdge';
import { PlotNodeData, CanvasNode, PlotCanvasData } from '@/types/plotCanvas';
import { Button } from '@/components/ui/button';
import { debounce } from 'lodash';
import { apiClient } from '@/lib/api';
import { QuickNodeModal } from '@/components/QuickNodeModal';
import { Character } from '@/types/character';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { ChevronRight, Home, Plus } from 'lucide-react';

const nodeTypes = { plotNode: PlotNode };
const edgeTypes = {
  custom: DeletableEdge,
};

interface CharacterArcCanvasProps {
  bookId?: string;
  versionId?: string;
  characterId?: string | null;
  canvasData?: PlotCanvasData | null;
  onCanvasUpdate?: (data: PlotCanvasData) => void;
}

const CharacterArcCanvas: React.FC<CharacterArcCanvasProps> = ({ 
  bookId, 
  versionId, 
  characterId,
  canvasData: propCanvasData,
  onCanvasUpdate: propOnCanvasUpdate
}) => {
  const [internalCanvasData, setInternalCanvasData] = useState<PlotCanvasData>({ 
    nodes: [], 
    edges: [], 
    timelineEvents: [], 
    lastUpdated: '' 
  });
  const [loading, setLoading] = useState(false);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickModalPosition, setQuickModalPosition] = useState({ x: 0, y: 0 });
  const [currentViewNodeId, setCurrentViewNodeId] = useState<string | null>(null);

  const canvasData = propCanvasData || internalCanvasData;
  const onCanvasUpdate = propOnCanvasUpdate || setInternalCanvasData;

  console.log('CharacterArcCanvas mounted with bookId:', bookId, 'versionId:', versionId, 'characterId:', characterId);
  console.log('Loading nodes for current view:', characterId, 'CharacterArcs');

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const { fitView } = useReactFlow();

  useEffect(() => {
    if (canvasData) {
      const reactFlowNodes = canvasData.nodes.map((node: CanvasNode) => ({
        id: node.id,
        type: 'plotNode',
        position: node.position,
        data: {
          ...node,
          onEdit: handleEditNode,
          onAddChild: handleAddChild,
          onNavigateToEntity: handleNavigateToEntity,
          onDelete: handleDeleteNode,
          onCharacterOrWorldClick: handleCharacterOrWorldClick,
          onFetchCharacterDetails: handleFetchCharacterDetails,
          onAddLinkedNode: handleAddLinkedNode,
        } as PlotNodeData,
      }));

      const reactFlowEdges = (canvasData.edges || []).map((edge) => ({
        ...edge,
        type: 'custom',
      }));

      setNodes(reactFlowNodes);
      setEdges(reactFlowEdges);

      setTimeout(() => {
        fitView();
      }, 100);
    }
  }, [canvasData, setNodes, setEdges, fitView]);

  const debouncedUpdate = useCallback(
    debounce(async (updatedCanvasData: PlotCanvasData) => {
      await onCanvasUpdate(updatedCanvasData);
    }, 1000),
    [onCanvasUpdate]
  );

  const handleEditNode = (nodeId: string) => {
    console.log('Edit node:', nodeId);
  };

  const handleAddChild = (parentId: string) => {
    console.log('Add child to:', parentId);
  };

  const handleNavigateToEntity = (entityId: string) => {
    console.log('Navigate to entity:', entityId);
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!canvasData) return;

    const updatedNodes = canvasData.nodes.filter(node => node.id !== nodeId);
    const updatedCanvasData = { ...canvasData, nodes: updatedNodes };
    await onCanvasUpdate(updatedCanvasData);
  };

  const handleCharacterOrWorldClick = async (entityId: string) => {
    if (!bookId || !versionId) return;
    console.log('handleCharacterOrWorldClick on entity:', entityId);

    try {
      const response = await apiClient.get(`/books/${bookId}/versions/${versionId}/characters/${entityId}`);
      console.log('Fetched character data:', response.data);
      const selectedCharacter = response.data;

      if (!selectedCharacter) return;

      if (selectedCharacter.arc && selectedCharacter.arc.nodes) {
        console.log('Character has arc data:', selectedCharacter.arc);
        await onCanvasUpdate(selectedCharacter.arc);
      } else {
        console.log('No arc data found for character:', entityId);
      }
    } catch (error) {
      console.error('Failed to fetch character or load arcs:', error);
    }
  };

  const handleFetchCharacterDetails = async (arcId: string) => {
    console.log('Fetch character details for arc:', arcId);
    return {};
  };

  const handleAddLinkedNode = async (parentNodeId: string, currentNodeType: string) => {
    console.log('Adding linked node:', parentNodeId);

    if (currentNodeType === 'Character') {
      const newNodeId = `${parentNodeId}-linked-${Date.now()}`;

      const newNode: CanvasNode = {
        id: newNodeId,
        type: 'Character',
        name: `New Character Arc`,
        detail: '',
        goal: '',
        status: 'Not Completed',
        timelineEventIds: [],
        parentId: null,
        childIds: [],
        linkedNodeIds: [],
        position: { x: Math.random() * 400, y: Math.random() * 400 },
        characters: [{ 
          id: parentNodeId, 
          name: 'Character', 
          type: 'Character',
          attributes: []
        }],
        worlds: []
      };

      if (!canvasData) return;

      const updatedNodes = [...canvasData.nodes, newNode];
      
      // Update parent node's linkedNodeIds
      const parentIndex = updatedNodes.findIndex(n => n.id === parentNodeId);
      if (parentIndex >= 0) {
        updatedNodes[parentIndex].linkedNodeIds.push(newNodeId);
      }

      const updatedCanvasData = { ...canvasData, nodes: updatedNodes };
      await onCanvasUpdate(updatedCanvasData);
    }
  };

  const handleQuickNodeSave = async (
    nodeData: any,
    position: { x: number; y: number },
    parentNodeId?: string
  ) => {
    if (!canvasData) return;

    const newNodeId = `node-${Date.now()}`;
    const newNode: CanvasNode = {
      id: newNodeId,
      type: nodeData.type || 'Character',
      name: nodeData.name || 'New Node',
      detail: nodeData.detail || '',
      goal: nodeData.goal || '',
      status: nodeData.status || 'Not Completed',
      timelineEventIds: [],
      parentId: parentNodeId || null,
      childIds: [],
      linkedNodeIds: [],
      position,
      characters: [],
      worlds: []
    };

    const updatedNodes = [...canvasData.nodes, newNode];

    if (parentNodeId) {
      const parentIndex = updatedNodes.findIndex(n => n.id === parentNodeId);
      if (parentIndex >= 0) {
        updatedNodes[parentIndex].childIds.push(newNodeId);
      }
    }

    const newCanvasData = { ...canvasData, nodes: updatedNodes };
    await onCanvasUpdate(newCanvasData);
    setShowQuickModal(false);
  };

  const handlePaneClick = (event: any) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    console.log('Pane clicked at:', event.clientX, event.clientY, 'Bounds:', bounds);
    setQuickModalPosition({ 
      x: event.clientX - bounds.left, 
      y: event.clientY - bounds.top 
    });
    setShowQuickModal(true);
    setCurrentViewNodeId(null);
  };

  const onConnect = useCallback((params: Edge | Connection) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  const getBreadcrumbItems = () => {
    const items = [
      { label: 'Character Arcs', href: '#' }
    ];

    if (characterId && canvasData) {
      const character = canvasData.nodes.find(node => node.id === characterId);
      if (character) {
        items.push({ label: character.name, href: '#' });
      }
    }

    return items;
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header with Breadcrumb */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Plan
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              {getBreadcrumbItems().map((item, index) => (
                <React.Fragment key={index}>
                  <BreadcrumbItem>
                    <BreadcrumbLink href={item.href}>
                      {item.label}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {index < getBreadcrumbItems().length - 1 && (
                    <BreadcrumbSeparator>
                      <ChevronRight className="h-4 w-4" />
                    </BreadcrumbSeparator>
                  )}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowQuickModal(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Node
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-lg">Loading Character Arcs...</div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onPaneClick={handlePaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            className="bg-background"
          >
            <Controls />
            <Background />
          </ReactFlow>
        )}
      </div>

      <QuickNodeModal 
        isOpen={showQuickModal}
        position={quickModalPosition}
        onClose={() => setShowQuickModal(false)}
        onSave={(nodeData, position) => handleQuickNodeSave(nodeData, position, currentViewNodeId)}
      />
    </div>
  );
};

export default CharacterArcCanvas;
