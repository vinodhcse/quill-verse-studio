
import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import PlotNode from './PlotNode';
import { NodeEditModal } from './NodeEditModal';
import { QuickNodeModal } from './QuickNodeModal';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';
import { PlotCanvasData, PlotNodeData } from '@/types/plotCanvas';

const nodeTypes = {
  plotNode: PlotNode,
};

interface PlotCanvasProps {
  bookId?: string;
  versionId?: string;
  canvasData?: PlotCanvasData | null;
  onCanvasUpdate?: (data: PlotCanvasData) => void;
}

const PlotCanvas: React.FC<PlotCanvasProps> = ({
  bookId,
  versionId,
  canvasData,
  onCanvasUpdate,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<PlotNodeData | null>(null);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [parentNodeId, setParentNodeId] = useState<string | null>(null);

  // Convert canvas data to React Flow format
  useEffect(() => {
    if (canvasData?.nodes) {
      const flowNodes = canvasData.nodes.map((node: any) => ({
        id: node.id,
        type: 'plotNode',
        position: node.position || { x: Math.random() * 400, y: Math.random() * 400 },
        data: {
          id: node.id,
          type: node.type || 'scene',
          name: node.name || 'Untitled',
          detail: node.detail || '',
          status: node.status || 'not-started',
          onEdit: handleNodeEdit,
          onAddChild: handleAddChild,
        } as PlotNodeData,
      }));
      
      setNodes(flowNodes);
    }

    if (canvasData?.edges) {
      setEdges(canvasData.edges);
    }
  }, [canvasData]);

  const handleNodeEdit = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(node.data as PlotNodeData);
    }
  }, [nodes]);

  const handleAddChild = useCallback((parentId: string) => {
    setParentNodeId(parentId);
    setIsQuickModalOpen(true);
  }, []);

  const handleNodeUpdate = async (nodeId: string, updatedData: Partial<PlotNodeData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: { ...node.data, ...updatedData } as PlotNodeData,
            }
          : node
      )
    );

    // Update canvas data
    const updatedCanvasData = {
      nodes: nodes.map(node => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, ...updatedData } }
          : node
      ),
      edges,
    };

    if (onCanvasUpdate) {
      onCanvasUpdate(updatedCanvasData);
    }

    setSelectedNode(null);
  };

  const handleQuickNodeCreate = (nodeData: Partial<PlotNodeData>) => {
    const newNodeId = `node-${Date.now()}`;
    const parentNode = nodes.find(n => n.id === parentNodeId);
    
    const newNode = {
      id: newNodeId,
      type: 'plotNode',
      position: {
        x: parentNode ? parentNode.position.x + 200 : Math.random() * 400,
        y: parentNode ? parentNode.position.y + 100 : Math.random() * 400,
      },
      data: {
        id: newNodeId,
        type: nodeData.type || 'scene',
        name: nodeData.name || 'Untitled',
        detail: nodeData.detail || '',
        status: nodeData.status || 'not-started',
        onEdit: handleNodeEdit,
        onAddChild: handleAddChild,
      } as PlotNodeData,
    };

    setNodes((nds) => [...nds, newNode]);

    // Add edge if there's a parent
    if (parentNodeId) {
      const newEdge = {
        id: `edge-${parentNodeId}-${newNodeId}`,
        source: parentNodeId,
        target: newNodeId,
        type: 'smoothstep',
      };
      setEdges((eds) => [...eds, newEdge]);
    }

    // Update canvas data
    const updatedCanvasData = {
      nodes: [...nodes, newNode],
      edges: parentNodeId ? [...edges, {
        id: `edge-${parentNodeId}-${newNodeId}`,
        source: parentNodeId,
        target: newNodeId,
        type: 'smoothstep',
      }] : edges,
    };

    if (onCanvasUpdate) {
      onCanvasUpdate(updatedCanvasData);
    }

    setIsQuickModalOpen(false);
    setParentNodeId(null);
  };

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleAddRootNode = () => {
    setParentNodeId(null);
    setIsQuickModalOpen(true);
  };

  return (
    <div className="h-full w-full relative">
      <div className="absolute top-4 left-4 z-10">
        <Button onClick={handleAddRootNode} size="sm">
          <Plus size={16} className="mr-2" />
          Add Node
        </Button>
      </div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {selectedNode && (
        <NodeEditModal
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onSave={handleNodeUpdate}
        />
      )}

      {isQuickModalOpen && (
        <QuickNodeModal
          onClose={() => {
            setIsQuickModalOpen(false);
            setParentNodeId(null);
          }}
          onSave={handleQuickNodeCreate}
        />
      )}
    </div>
  );
};

export default PlotCanvas;
