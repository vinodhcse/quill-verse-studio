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
import { PlotNodeData, CanvasNode, PlotCanvasData, CharacterAttributes, TimelineEvent } from '@/types/plotCanvas';
import { Button } from '@/components/ui/button';
import { debounce } from 'lodash';
import { apiClient } from '@/lib/api';
import { QuickNodeModal } from '@/components/QuickNodeModal';
import { CharacterNodeEditModal } from '@/components/CharacterArc/CharacterNodeEditModal';
import { Character } from '@/types/character';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { ChevronRight, Home, Plus, ZoomIn, ZoomOut, Maximize2, ToggleLeft, MousePointer, Move } from 'lucide-react';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [quickModalPosition, setQuickModalPosition] = useState({ x: 0, y: 0 });
  const [currentViewNodeId, setCurrentViewNodeId] = useState<string | null>(null);
  const [connectFromNodeId, setConnectFromNodeId] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [editingNode, setEditingNode] = useState<CanvasNode | null>(null);
  const [isInteractive, setIsInteractive] = useState(true);
  const [plotCanvasData, setPlotCanvasData] = useState<PlotCanvasData>({ nodes: [], edges: [], timelineEvents: [], lastUpdated: '' });

  const canvasData = propCanvasData || internalCanvasData;
  const onCanvasUpdate = propOnCanvasUpdate || setInternalCanvasData;

  console.log('CharacterArcCanvas mounted with bookId:', bookId, 'versionId:', versionId, 'characterId:', characterId);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const { fitView, zoomIn, zoomOut, zoomTo } = useReactFlow();

  useEffect(() => {
    if (characterId && bookId && versionId) {
      fetchCharacterDetails();
    }
    if (bookId && versionId) {
      fetchPlotCanvasData();
    }
  }, [characterId, bookId, versionId]);

  const fetchCharacterDetails = async () => {
    if (!characterId || !bookId || !versionId) return;
    
    try {
      const response = await apiClient.get(`/books/${bookId}/versions/${versionId}/characters/${characterId}`);
      console.log('Fetched character details:', response.data);
      setSelectedCharacter(response.data);
    } catch (error) {
      console.error('Failed to fetch character details:', error);
    }
  };

  const fetchPlotCanvasData = async () => {
    if (!bookId || !versionId) return;
    
    try {
      const response = await apiClient.get(`/books/${bookId}/versions/${versionId}/plot-canvas`);
      if (response.data) {
        setPlotCanvasData(response.data);
        console.log('Fetched plot canvas data:', response.data);
      }
    } catch (error) {
      console.error('Failed to fetch plot canvas data:', error);
    }
  };

  const renderCharacterDetails = (node: CanvasNode) => {
    // Load details from node.attributes instead of character object
    const attributes = node.attributes as CharacterAttributes;
    if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) {
      return null;
    }

    return (
      <div className="space-y-2 text-xs">
        {attributes.age && <div><strong>Age:</strong> {attributes.age}</div>}
        {attributes.gender && <div><strong>Gender:</strong> {attributes.gender}</div>}
        {attributes.traits && attributes.traits.length > 0 && (
          <div><strong>Traits:</strong> {attributes.traits.slice(0, 2).join(', ')}{attributes.traits.length > 2 ? '...' : ''}</div>
        )}
        {attributes.motivations && attributes.motivations.length > 0 && (
          <div><strong>Motivations:</strong> {attributes.motivations.slice(0, 1).join(', ')}{attributes.motivations.length > 1 ? '...' : ''}</div>
        )}
      </div>
    );
  };

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
          selectedCharacter: selectedCharacter,
          renderCharacterDetails: () => renderCharacterDetails(node),
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
  }, [canvasData, selectedCharacter, setNodes, setEdges, fitView]);

  const debouncedUpdate = useCallback(
    debounce(async (updatedCanvasData: PlotCanvasData) => {
      await onCanvasUpdate(updatedCanvasData);
    }, 1000),
    [onCanvasUpdate]
  );

  const handleEditNode = (nodeId: string) => {
    console.log('Edit node:', nodeId);
    const node = canvasData?.nodes.find(n => n.id === nodeId);
    if (node && node.type === 'Character') {
      setEditingNode(node);
      setShowEditModal(true);
    }
  };

  const handleNodeUpdate = async (updatedNode: CanvasNode) => {
    if (!canvasData) return;

    const updatedNodes = canvasData.nodes.map(node => 
      node.id === updatedNode.id ? updatedNode : node
    );

    const updatedCanvasData = { 
      ...canvasData, 
      nodes: updatedNodes,
      lastUpdated: new Date().toISOString()
    };
    
    await onCanvasUpdate(updatedCanvasData);
    
    // Also update plot canvas if there are linked nodes
    if (updatedNode.linkedNodeIds && updatedNode.linkedNodeIds.length > 0) {
      await updatePlotCanvasLinks(updatedNode);
    }
  };

  const updatePlotCanvasLinks = async (characterNode: CanvasNode) => {
    if (!bookId || !versionId) return;
    
    try {
      // Update the plot canvas with character node links
      const updatedPlotCanvasData = {
        ...plotCanvasData,
        lastUpdated: new Date().toISOString()
      };
      
      await apiClient.patch(`/books/${bookId}/versions/${versionId}/plot-canvas`, updatedPlotCanvasData);
      console.log('Plot canvas updated with character links');
    } catch (error) {
      console.error('Failed to update plot canvas:', error);
    }
  };

  const handleAddChild = (parentId: string) => {
    console.log('Add child to:', parentId);
    setConnectFromNodeId(parentId);
    setCurrentViewNodeId(parentId);
    const parentNode = nodes.find(n => n.id === parentId);
    if (parentNode) {
      setQuickModalPosition({ 
        x: parentNode.position.x + 300, 
        y: parentNode.position.y 
      });
      setShowQuickModal(true);
    }
  };

  const handleNavigateToEntity = (entityId: string) => {
    console.log('Navigate to entity:', entityId);
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!canvasData) return;

    const updatedNodes = canvasData.nodes.filter(node => node.id !== nodeId);
    const updatedEdges = (canvasData.edges || []).filter(edge => 
      edge.source !== nodeId && edge.target !== nodeId
    );
    const updatedCanvasData = { ...canvasData, nodes: updatedNodes, edges: updatedEdges };
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
    return selectedCharacter || {};
  };

  const handleAddLinkedNode = async (parentNodeId: string, currentNodeType: string) => {
    console.log('Adding linked node:', parentNodeId);
    setConnectFromNodeId(parentNodeId);
    setCurrentViewNodeId(parentNodeId);
    
    const parentNode = nodes.find(n => n.id === parentNodeId);
    if (parentNode) {
      setQuickModalPosition({ 
        x: parentNode.position.x + 300, 
        y: parentNode.position.y 
      });
      setShowQuickModal(true);
    }
  };

  const handleQuickNodeSave = async (
    nodeData: any,
    position: { x: number; y: number },
    parentNodeId?: string
  ) => {
    if (!canvasData) return;

    // Create proper character arc node ID format
    const baseCharacterId = characterId || parentNodeId || 'character';
    const newNodeId = `${baseCharacterId}-arc-${Date.now()}`;
    
    // Get parent node to inherit attributes from
    const parentNode = parentNodeId ? canvasData.nodes.find(n => n.id === parentNodeId) : null;
    console.log('Parent node for inheritance:', parentNode);

    // Inherit characters array
    const inheritedCharacters = parentNode?.characters || (characterId && selectedCharacter ? [{
      id: characterId,
      name: selectedCharacter.name,
      type: 'Character',
      image: selectedCharacter.image,
      attributes: []
    }] : []);

    // Inherit ALL attributes from parent node
    let inheritedAttributes: CharacterAttributes = {};
    if (parentNode && parentNode.attributes && typeof parentNode.attributes === 'object' && !Array.isArray(parentNode.attributes)) {
      inheritedAttributes = { ...parentNode.attributes as CharacterAttributes };
    } else if (selectedCharacter) {
      // Fallback to character data if no parent
      inheritedAttributes = {
        age: selectedCharacter.age,
        birthday: selectedCharacter.birthday,
        gender: selectedCharacter.gender,
        description: selectedCharacter.description,
        image: selectedCharacter.image,
        aliases: selectedCharacter.aliases || [],
        traits: selectedCharacter.traits || [],
        backstory: selectedCharacter.backstory,
        beliefs: selectedCharacter.beliefs || [],
        motivations: selectedCharacter.motivations || [],
        internalConflicts: selectedCharacter.internalConflicts || [],
        externalConflicts: selectedCharacter.externalConflicts || [],
        relationships: selectedCharacter.relationships || [],
        goals: selectedCharacter.goals || []
      };
    }

    const newNode: CanvasNode = {
      id: newNodeId,
      type: 'Character',
      name: nodeData.name || 'New Character Arc Node',
      detail: parentNode ? 'Character state continues from previous node' : 'Initial character state',
      goal: nodeData.goal || '',
      status: nodeData.status || 'Not Completed',
      timelineEventIds: [],
      parentId: parentNodeId || null,
      childIds: [],
      linkedNodeIds: [],
      position,
      characters: inheritedCharacters,
      worlds: [],
      attributes: inheritedAttributes
    };

    console.log('Created new node with inherited attributes:', newNode);

    const updatedNodes = [...canvasData.nodes, newNode];

    // Update parent node relationships
    if (parentNodeId) {
      const parentIndex = updatedNodes.findIndex(n => n.id === parentNodeId);
      if (parentIndex >= 0) {
        updatedNodes[parentIndex] = {
          ...updatedNodes[parentIndex],
          linkedNodeIds: [...updatedNodes[parentIndex].linkedNodeIds, newNodeId]
        };
      }
    }

    // Create edge connecting parent to new node (right handle to left handle)
    const updatedEdges = [...(canvasData.edges || [])];
    if (connectFromNodeId) {
      const newEdge = {
        id: `edge-${connectFromNodeId}-${newNodeId}`,
        source: connectFromNodeId,
        target: newNodeId,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'custom'
      };
      updatedEdges.push(newEdge);
      console.log('Created edge:', newEdge);
    }

    const newCanvasData = { 
      ...canvasData, 
      nodes: updatedNodes, 
      edges: updatedEdges,
      lastUpdated: new Date().toISOString()
    };
    
    console.log('Updated canvas data:', newCanvasData);
    await onCanvasUpdate(newCanvasData);
    setShowQuickModal(false);
    setConnectFromNodeId(null);
    setCurrentViewNodeId(null);
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
    setConnectFromNodeId(null);
  };

  const onConnect = useCallback((params: Edge | Connection) => {
    const newEdge = { 
      ...params, 
      type: 'custom',
      sourceHandle: 'right',
      targetHandle: 'left'
    };
    setEdges((eds) => addEdge(newEdge, eds));
    
    // Update canvas data with new edge
    if (canvasData) {
      const updatedEdges = [...(canvasData.edges || []), {
        id: `edge-${params.source}-${params.target}`,
        source: params.source!,
        target: params.target!,
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'custom'
      }];
      
      // Update linked node IDs
      const updatedNodes = canvasData.nodes.map(node => {
        if (node.id === params.source) {
          return { ...node, linkedNodeIds: [...node.linkedNodeIds, params.target!] };
        }
        return node;
      });
      
      const updatedCanvasData = { ...canvasData, edges: updatedEdges, nodes: updatedNodes };
      onCanvasUpdate(updatedCanvasData);
    }
  }, [setEdges, canvasData, onCanvasUpdate]);

  const handleCreateTimelineEvent = async (eventData: Partial<TimelineEvent>) => {
    if (!canvasData) return;

    const newEvent: TimelineEvent = {
      id: `timeline_${Date.now()}`,
      name: eventData.name || '',
      date: eventData.date || '',
      description: eventData.description || '',
      type: eventData.type || 'character',
      linkedNodeIds: []
    };

    const updatedCanvasData = {
      ...canvasData,
      timelineEvents: [...canvasData.timelineEvents, newEvent],
      lastUpdated: new Date().toISOString()
    };

    await onCanvasUpdate(updatedCanvasData);
    return newEvent.id;
  };

  const getBreadcrumbItems = () => {
    const items = [
      { label: 'Character Arcs', href: '#' }
    ];

    if (characterId && selectedCharacter) {
      items.push({ label: selectedCharacter.name, href: '#' });
    }

    return items;
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header with Breadcrumb and Controls */}
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
              onClick={() => zoomIn()}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => zoomOut()}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => fitView()}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <Maximize2 className="h-4 w-4" />
              Fit View
            </Button>
            <Button
              onClick={() => setIsInteractive(!isInteractive)}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              {isInteractive ? <MousePointer className="h-4 w-4" /> : <Move className="h-4 w-4" />}
              {isInteractive ? 'Selection' : 'Pan'}
            </Button>
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
            onPaneClick={isInteractive ? handlePaneClick : undefined}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            className="bg-background"
            panOnDrag={!isInteractive}
            nodesDraggable={isInteractive}
            nodesConnectable={isInteractive}
            elementsSelectable={isInteractive}
          >
            <Controls />
            <Background />
          </ReactFlow>
        )}
      </div>

      <QuickNodeModal 
        isOpen={showQuickModal}
        position={quickModalPosition}
        onClose={() => {
          setShowQuickModal(false);
          setConnectFromNodeId(null);
          setCurrentViewNodeId(null);
        }}
        onSave={(nodeData, position) => handleQuickNodeSave(nodeData, position, currentViewNodeId)}
      />

      <CharacterNodeEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingNode(null);
        }}
        onSave={handleNodeUpdate}
        node={editingNode}
        plotCanvasNodes={plotCanvasData.nodes}
        timelineEvents={plotCanvasData.timelineEvents}
        onCreateTimelineEvent={handleCreateTimelineEvent}
      />
    </div>
  );
};

export default CharacterArcCanvas;
