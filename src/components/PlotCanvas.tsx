
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

const nodeTypes = { plotNode: PlotNode };

interface PlotCanvasProps {
  bookId?: string;
  versionId?: string;
  canvasData?: PlotCanvasData | null;
  onCanvasUpdate?: (data: PlotCanvasData) => void;
}

const PlotCanvas: React.FC<PlotCanvasProps> = ({ 
  bookId, 
  versionId, 
  canvasData: propCanvasData,  
  onCanvasUpdate: propOnCanvasUpdate
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

  const canvasData = propCanvasData || internalCanvasData;
  const onCanvasUpdate = propOnCanvasUpdate || setInternalCanvasData;

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const focusNodeId = searchParams.get('focusNode');

  const { fitView, zoomTo } = useReactFlow();

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
        } as PlotNodeData,
      }));

      const reactFlowEdges = (canvasData.edges || []).map((edge) => ({
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
  }, [canvasData, setNodes, setEdges, fitView]);

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
