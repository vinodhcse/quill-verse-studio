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
import CharacterArcPlotNode from './CharacterArcPlotNode';
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
import { ChevronRight, Home, Plus, ZoomIn, ZoomOut, Maximize2, ToggleLeft, MousePointer, Move, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const nodeTypes = { plotNode: CharacterArcPlotNode };
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
  const navigate = useNavigate();
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
  const [isCreatingEdge, setIsCreatingEdge] = useState(false);

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
      const response = await apiClient.get(`/books/${bookId}/versions/${versionId}/plotCanvas`);
      if (response.data) {
        setPlotCanvasData(response.data);
        console.log('Fetched plot canvas data:', response.data);
      }
    } catch (error) {
      console.error('Failed to fetch plot canvas data:', error);
    }
  };

  const renderCharacterDetails = (node: CanvasNode) => {
    const attributes = node.attributes as CharacterAttributes;
    if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) {
      return null;
    }

    const isFirstNode = node.parentId === null && (!node.linkedNodeIds || node.linkedNodeIds.length === 0);

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
        
        {/* Display linked Plot Canvas nodes */}
        {node.linkedNodeIds && node.linkedNodeIds.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div><strong>Linked Plot Nodes:</strong></div>
            {node.linkedNodeIds.map(nodeId => {
              const plotNode = plotCanvasData.nodes.find(n => n.id === nodeId);
              return plotNode ? (
                <div key={nodeId} className="text-xs text-blue-600">• {plotNode.name}</div>
              ) : null;
            })}
          </div>
        )}
        
        {/* Display linked Timeline events */}
        {node.timelineEventIds && node.timelineEventIds.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div><strong>Timeline Events:</strong></div>
            {node.timelineEventIds.map(eventId => {
              const event = plotCanvasData.timelineEvents.find(e => e.id === eventId);
              return event ? (
                <div key={eventId} className="text-xs text-green-600">• {event.name}</div>
              ) : null;
            })}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (canvasData) {
      const reactFlowNodes = canvasData.nodes.map((node: CanvasNode) => {
        const isFirstNode = node.parentId === null && !canvasData.nodes.some(n => n.linkedNodeIds.includes(node.id) || n.childIds.includes(node.id));
        
        return {
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
            showFullAttributes: isFirstNode,
            isFirstNode: isFirstNode // First node shows full attributes by default
          } as PlotNodeData,
        };
      });

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
  }, [canvasData, selectedCharacter, plotCanvasData, setNodes, setEdges, fitView]);

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
    
    // Update plot canvas if there are linked nodes
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
      
      await apiClient.patch(`/books/${bookId}/versions/${versionId}/plotCanvas`, updatedPlotCanvasData);
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

    // Helper function to recursively collect all child nodes for deletion
    const collectChildNodes = (nodeId: string, nodes: CanvasNode[]): string[] => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return [];

      let childIds = [...node.childIds];
      node.childIds.forEach(childId => {
        childIds = [...childIds, ...collectChildNodes(childId, nodes)];
      });

      return childIds;
    };

    // Collect all nodes to delete (including descendants)
    const allNodesToDelete = [nodeId, ...collectChildNodes(nodeId, canvasData.nodes)];

    // Remove the nodes from the canvas
    const updatedNodes = canvasData.nodes.filter(node => !allNodesToDelete.includes(node.id));

    // Remove references to the deleted nodes from other nodes
    const cleanedNodes = updatedNodes.map(node => {
      return {
        ...node,
        childIds: node.childIds.filter(childId => !allNodesToDelete.includes(childId)),
        linkedNodeIds: node.linkedNodeIds.filter(linkedId => !allNodesToDelete.includes(linkedId)),
      };
    });

    // Remove edges connected to the deleted nodes
    const updatedEdges = (canvasData.edges || []).filter(edge => 
      !allNodesToDelete.includes(edge.source) && !allNodesToDelete.includes(edge.target)
    );

    const updatedCanvasData = { ...canvasData, nodes: cleanedNodes, edges: updatedEdges };
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

  const handleConnectStart = (event: any, params: { nodeId: string; handleType: string }) => {
    console.log('Connect start:', params, ' nodeId:', params.nodeId);
    setIsCreatingEdge(true);
    setConnectFromNodeId(params.nodeId); // Store source node ID
    console.log('Setting connectFromNodeId:', connectFromNodeId);
  };

  const handleConnectEnd = (event: any) => {
    console.log('Connect end:', event, 'connectFromNodeId:', connectFromNodeId);
      setShowQuickModal(true);
      setQuickModalPosition({ x: event.clientX, y: event.clientY });
      setIsCreatingEdge(false);
  };

  const handleEdgeMouseLeave = (event: any, edge: Edge) => {
      console.log('Edge mouse leave:', edge);
      if (!edge.source) return; // Only trigger for new edges
      
      //event.preventDefault();
      const sourceNodeId = edge.source;
      setConnectFromNodeId(sourceNodeId); // Store sourceNodeId
      setShowQuickModal(true);
      setQuickModalPosition({ x: event.clientX, y: event.clientY });
      setIsCreatingEdge(false); // Reset edge creation state
      console.log('Edge creation ended, sourceNodeId:', sourceNodeId);
    };
    
    const handleEdgeMouseEnter = () => {
      console.log('Edge mouse enter');
      setIsCreatingEdge(true); // Set edge creation state
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
    console.log('Saving quick node with data:', nodeData, 'at position:', position, 'parentNodeId:', parentNodeId, 'connectFromNodeId', connectFromNodeId);
    const baseCharacterId = characterId || parentNodeId || 'character';
    const newNodeId = `${baseCharacterId}-arc-${Date.now()}`;
    
    const parentNode = parentNodeId ? canvasData.nodes.find(n => n.id === connectFromNodeId) : null;
    console.log('Parent node for inheritance:', parentNode);

    const inheritedCharacters = parentNode?.characters || (characterId && selectedCharacter ? [{
      id: characterId,
      name: selectedCharacter.name,
      type: 'Character',
      image: selectedCharacter.image,
      attributes: []
    }] : []);

    let inheritedAttributes: CharacterAttributes = {};
    if (parentNode && parentNode.attributes && typeof parentNode.attributes === 'object' && !Array.isArray(parentNode.attributes)) {
      inheritedAttributes = { ...parentNode.attributes as CharacterAttributes };
    } else if (selectedCharacter) {
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
      type: nodeData.type || 'Character',
      name: nodeData.name || 'New Character Arc Node',
      detail: parentNode ? 'Character state continues from previous node' : 'Initial character state',
      goal: nodeData.goal || '',
      status: nodeData.status || 'Not Completed',
      timelineEventIds: [],
      parentId: connectFromNodeId, // Link to sourceNodeId
      childIds: [],
      linkedNodeIds: [],
      position: {
        x: parentNode ? parentNode.position.x + 200 : position.x,
        y: parentNode ? parentNode.position.y : position.y,
      },
      characters: inheritedCharacters,
      worlds: [],
      attributes: inheritedAttributes
    };

    console.log('Created new node with inherited attributes:', newNode);

    const updatedNodes = [...canvasData.nodes, newNode];

    // Update parent's linkedNodeIds
    const parentIndex = updatedNodes.findIndex(n => n.id === connectFromNodeId);
    if (parentIndex >= 0) {
      updatedNodes[parentIndex]?.linkedNodeIds.push(newNodeId);
    }

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
    const udpateRes = await onCanvasUpdate(newCanvasData);
    console.log('Canvas data updated successfully:', udpateRes);
    setShowQuickModal(false);
    setConnectFromNodeId(null); // Reset sourceNodeId
  };

  const handleNodeDragStop = async (event: any, node: Node) => {
    console.log('Node drag stopped:', node.id, 'at position:', node.position);
    if (!canvasData) return;

    const updatedNodes = canvasData.nodes?.map(n => 
      n.id === node.id ? { ...n, position: node.position } : n
    );

    const updatedCanvasData = { ...canvasData, nodes: updatedNodes };
    await onCanvasUpdate(updatedCanvasData);
  };

  const handlePaneClick = (event: any) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    console.log('Pane clicked at:', event.clientX, event.clientY, 'Bounds:', bounds);
    if (isCreatingEdge) return;
    // Reset edge creation state
    setQuickModalPosition({ 
      x: event.clientX - bounds.left, 
      y: event.clientY - bounds.top 
    });
    setShowQuickModal(true);
    setCurrentViewNodeId(null);
    setConnectFromNodeId(null);
  };

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: `${params.source}-${params.target}-${Date.now()}`,
        type: 'custom',
        data: {
          type: 'linked',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));

      if (canvasData) {
        const updatedEdges = [...(canvasData.edges || []), {
          id: `edge-${params.source}-${params.target}`,
          source: params.source!,
          target: params.target!,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'custom'
        }];

        const updatedNodes = canvasData.nodes.map(node => {
          if (node.id === params.source) {
            return { ...node, linkedNodeIds: [...node.linkedNodeIds, params.target!] };
          }
          return node;
        });

        const updatedCanvasData = { ...canvasData, edges: updatedEdges, nodes: updatedNodes };
        onCanvasUpdate(updatedCanvasData);
      }
    },
    [setEdges, canvasData, onCanvasUpdate]
  );

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
              onClick={() => navigate(-1)}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
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
            //onPaneClick={isInteractive ? handlePaneClick : undefined}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            className="bg-background"
            panOnDrag={isInteractive}
            nodesDraggable={isInteractive}
            nodesConnectable={isInteractive}
            elementsSelectable={isInteractive}
            onEdgeMouseEnter={handleEdgeMouseEnter} // Added handler
            onConnectStart={handleConnectStart} // Added handler
            onConnectEnd={handleConnectEnd} 
            onNodeDragStop={handleNodeDragStop}
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
