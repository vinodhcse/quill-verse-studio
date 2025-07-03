
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Controls,
  Background,
  Node,
  Edge,
  Connection,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import PlotNode from '@/components/PlotNode';
import { PlotNodeData, CanvasNode, PlotCanvasData } from '@/types/plotCanvas';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { debounce } from 'lodash';
import { QuickNodeModal } from '@/components/QuickNodeModal';
import { usePlotCanvasContext } from '@/contexts/PlotCanvasContext';

const nodeTypes = { plotNode: PlotNode };

interface PlotCanvasProps {
  bookId?: string;
  versionId?: string;
  canvasData?: PlotCanvasData | null;
  onCanvasUpdate?: (data: PlotCanvasData) => void;
  canvasType?: 'plot-outline' | 'character-arcs' | 'world-entity-arcs' | 'timeline-arc' | 'timeline';
}

const PlotCanvas: React.FC<PlotCanvasProps> = ({ 
  bookId, 
  versionId, 
  canvasData: propCanvasData,  
  onCanvasUpdate: propOnCanvasUpdate,
  canvasType = 'plot-outline'
}) => {
  const [internalCanvasData, setInternalCanvasData] = useState<PlotCanvasData>({ 
    nodes: [], 
    edges: [], 
    timelineEvents: [], 
    lastUpdated: '' 
  });
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickModalPosition, setQuickModalPosition] = useState({ x: 0, y: 0 });
  const [currentViewNodeId, setCurrentViewNodeId] = useState<string | null>(null);
  const [connectFromNodeId, setConnectFromNodeId] = useState<string | null>(null);

  // Get context data
  const { timelineEvents, plotCanvasNodes } = usePlotCanvasContext();

  const canvasData = propCanvasData || internalCanvasData;
  const onCanvasUpdate = propOnCanvasUpdate || setInternalCanvasData;

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const focusNodeId = searchParams.get('focusNode');

  const { fitView, zoomTo } = useReactFlow();

  // Filter nodes based on canvas type
  const getFilteredNodes = (allNodes: CanvasNode[]) => {
    switch (canvasType) {
      case 'plot-outline':
        return allNodes.filter(node => 
          ['Outline', 'Act', 'Chapter', 'SceneBeats'].includes(node.type)
        );
      case 'character-arcs':
        return allNodes.filter(node => 
          node.type === 'Character' || 
          (node.type === 'SceneBeats' && node.characters && node.characters.length > 0)
        );
      case 'world-entity-arcs':
        return allNodes.filter(node => 
          ['WorldLocation', 'WorldObject'].includes(node.type) ||
          (node.type === 'SceneBeats' && node.worlds && node.worlds.length > 0)
        );
      case 'timeline-arc':
      case 'timeline':
        return allNodes.filter(node => 
          node.timelineEventIds && node.timelineEventIds.length > 0
        );
      default:
        return allNodes;
    }
  };

  useEffect(() => {
    if (canvasData) {
      const filteredNodes = getFilteredNodes(canvasData.nodes);
      
      const reactFlowNodes = filteredNodes.map((node: CanvasNode) => ({
        id: node.id,
        type: 'plotNode',
        position: node.position,
        data: {
          ...node,
          bookId,
          versionId,
          // Pass context data through node data
          timelineEvents,
          plotCanvasNodes,
          onEdit: handleEditNode,
          onAddChild: handleAddChild,
          onAddLinkedNode: handleAddLinkedNode,
          onNavigateToEntity: handleNavigateToEntity,
          onDelete: handleDeleteNode,
          onCharacterOrWorldClick: handleCharacterOrWorldClick,
        } as PlotNodeData,
      }));

      // Filter edges to only include those connecting visible nodes
      const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
      const reactFlowEdges = (canvasData.edges || [])
        .filter(edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
        .map((edge) => ({
          ...edge,
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type,
          animated: edge.animated,
          style: edge.style,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
        }));

      setNodes(reactFlowNodes);
      setEdges(reactFlowEdges);

      setTimeout(() => {
        fitView();
      }, 100);
    }
  }, [canvasData, timelineEvents, plotCanvasNodes, canvasType, bookId, versionId, setNodes, setEdges, fitView]);

  const debouncedUpdate = useCallback(
    debounce(async (updatedCanvasData: PlotCanvasData) => {
      await onCanvasUpdate(updatedCanvasData);
    }, 1000),
    [onCanvasUpdate]
  );

  useEffect(() => {
    debouncedUpdate(canvasData);
  }, [canvasData, debouncedUpdate]);

  const handleEditNode = (nodeId: string) => {
    console.log('Edit node:', nodeId);
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

  const handleAddLinkedNode = (parentId: string, nodeType: string) => {
    console.log('Add linked node to:', parentId, 'of type:', nodeType);
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

  const handleCharacterOrWorldClick = (entityId: string) => {
    console.log('Clicked entity:', entityId);
  };

  const handleQuickNodeSave = async (
    nodeData: any,
    position: { x: number; y: number },
    parentNodeId?: string
  ) => {
    if (!canvasData) return;

    const newNodeId = `node_${Date.now()}`;
    const newNode: CanvasNode = {
      id: newNodeId,
      type: 'Outline',
      name: nodeData.name || 'New Node',
      detail: nodeData.detail || '',
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
        updatedNodes[parentIndex] = {
          ...updatedNodes[parentIndex],
          childIds: [...updatedNodes[parentIndex].childIds, newNodeId]
        };
      }
    }

    const updatedEdges = [...(canvasData.edges || [])];
    if (connectFromNodeId) {
      const newEdge = {
        id: `edge-${connectFromNodeId}-${newNodeId}`,
        source: connectFromNodeId,
        target: newNodeId,
      };
      updatedEdges.push(newEdge);
    }

    const newCanvasData = { ...canvasData, nodes: updatedNodes, edges: updatedEdges };
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
    setEdges((eds) => addEdge(params, eds));
    
    if (canvasData) {
      const updatedEdges = [...(canvasData.edges || []), {
        id: `edge-${params.source}-${params.target}`,
        source: params.source!,
        target: params.target!
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
  }, [setEdges, canvasData, onCanvasUpdate]);

  // Add effect to focus on specific node when focusNodeId is provided
  useEffect(() => {
    if (focusNodeId && nodes.length > 0) {
      const targetNode = nodes.find(n => n.id === focusNodeId);
      if (targetNode) {
        // Center the view on the target node
        const { x, y } = targetNode.position;
        zoomTo(1);
        setTimeout(() => {
          fitView({ 
            nodes: [{ id: focusNodeId }],
            duration: 800,
            padding: 0.3
          });
        }, 100);
      }
    }
  }, [focusNodeId, nodes, fitView, zoomTo]);

  return (
    <div className="h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
      >
        <Controls />
        <Background />
      </ReactFlow>

      <Button
        onClick={() => setShowQuickModal(true)}
        className="absolute bottom-4 right-4"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Node
      </Button>

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
    </div>
  );
};

export default PlotCanvas;
