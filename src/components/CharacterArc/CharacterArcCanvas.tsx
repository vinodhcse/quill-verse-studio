
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

  const canvasData = propCanvasData || internalCanvasData;
  const onCanvasUpdate = propOnCanvasUpdate || setInternalCanvasData;

  console.log('CharacterArcCanvas mounted with bookId:', bookId, 'versionId:', versionId, 'characterId:', characterId);
  console.log('Loading nodes for current view:', characterId, 'CharacterArcs');

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const { fitView, zoomIn, zoomOut, zoomTo } = useReactFlow();

  useEffect(() => {
    if (characterId && bookId && versionId) {
      fetchCharacterDetails();
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

  const generateAttributeChangeSummary = (previousNode: CanvasNode, currentNode: CanvasNode): string => {
    const changes: string[] = [];
    
    const compareArrays = (prev: string[] = [], curr: string[] = [], label: string) => {
      const added = curr.filter(item => !prev.includes(item));
      const removed = prev.filter(item => !curr.includes(item));
      
      if (added.length > 0) {
        changes.push(`Added ${label.toLowerCase()}: ${added.join(', ')}`);
      }
      if (removed.length > 0) {
        changes.push(`Removed ${label.toLowerCase()}: ${removed.join(', ')}`);
      }
    };

    compareArrays(previousNode.aliases, currentNode.aliases, 'Aliases');
    compareArrays(previousNode.traits, currentNode.traits, 'Traits');
    compareArrays(previousNode.beliefs, currentNode.beliefs, 'Beliefs');
    compareArrays(previousNode.motivations, currentNode.motivations, 'Motivations');
    compareArrays(previousNode.internalConflicts, currentNode.internalConflicts, 'Internal Conflicts');
    compareArrays(previousNode.externalConflicts, currentNode.externalConflicts, 'External Conflicts');

    return changes.length > 0 ? changes.join('; ') : 'No attribute changes';
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

    // Inherit ALL attributes from parent node or use defaults
    const inheritedAliases = parentNode?.aliases || [];
    const inheritedTraits = parentNode?.traits || [];
    const inheritedBeliefs = parentNode?.beliefs || [];
    const inheritedMotivations = parentNode?.motivations || [];
    const inheritedInternalConflicts = parentNode?.internalConflicts || [];
    const inheritedExternalConflicts = parentNode?.externalConflicts || [];
    const inheritedAge = parentNode?.age;
    const inheritedBirthday = parentNode?.birthday;
    const inheritedGender = parentNode?.gender;
    const inheritedImage = parentNode?.image;
    const inheritedLocationId = parentNode?.locationId;
    const inheritedBackstory = parentNode?.backstory;
    const inheritedRelationships = parentNode?.relationships || [];
    const inheritedGoals = parentNode?.goals || [];

    const newNode: CanvasNode = {
      id: newNodeId,
      type: 'Character',
      name: nodeData.name || 'New Character Arc Node',
      detail: 'Character state continues from previous node',
      goal: nodeData.goal || '',
      status: nodeData.status || 'Not Completed',
      timelineEventIds: [],
      parentId: parentNodeId || null,
      childIds: [],
      linkedNodeIds: [],
      position,
      characters: inheritedCharacters,
      worlds: [],
      // Inherit all character attributes from parent
      aliases: inheritedAliases,
      traits: inheritedTraits,
      beliefs: inheritedBeliefs,
      motivations: inheritedMotivations,
      internalConflicts: inheritedInternalConflicts,
      externalConflicts: inheritedExternalConflicts,
      age: inheritedAge,
      birthday: inheritedBirthday,
      gender: inheritedGender,
      image: inheritedImage,
      locationId: inheritedLocationId,
      backstory: inheritedBackstory,
      relationships: inheritedRelationships,
      goals: inheritedGoals,
      attributes: [
        { id: 'aliases', name: 'Aliases', value: inheritedAliases.join(', ') },
        { id: 'traits', name: 'Traits', value: inheritedTraits.join(', ') },
        { id: 'beliefs', name: 'Beliefs', value: inheritedBeliefs.join(', ') },
        { id: 'motivations', name: 'Motivations', value: inheritedMotivations.join(', ') },
        { id: 'internalConflicts', name: 'Internal Conflicts', value: inheritedInternalConflicts.join(', ') },
        { id: 'externalConflicts', name: 'External Conflicts', value: inheritedExternalConflicts.join(', ') }
      ]
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
      />
    </div>
  );
};

export default CharacterArcCanvas;
