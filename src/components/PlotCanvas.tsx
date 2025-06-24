import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Node,
  Edge,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import PlotNode from '@/components/PlotNode';
import DeletableEdge from '@/components/DeletableEdge';
import { PlotNodeData } from '@/types/plotCanvas';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { QuickNodeModal } from './QuickNodeModal';
import { NodeEditModal } from './NodeEditModal';

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'plotNode',
    position: { x: 50, y: 50 },
    data: {
      id: '1',
      type: 'act',
      name: 'Act 1',
      detail: 'The beginning of the story',
      status: 'not-started',
      onEdit: (nodeId: string) => console.log('Edit node', nodeId),
      onAddChild: (parentId: string) => console.log('Add child to', parentId),
    },
  },
];

const initialEdges: Edge[] = [];

const nodeTypes = { plotNode: PlotNode };
const edgeTypes = {
  custom: DeletableEdge,
};

interface PlotCanvasProps {
  bookId: string | undefined;
  versionId: string | undefined;
  canvasData: any;
  onCanvasUpdate: (data: any) => void;
}

const PlotCanvas: React.FC<PlotCanvasProps> = ({
  bookId,
  versionId,
  canvasData,
  onCanvasUpdate,
}) => {
  const { setViewport } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [allNodes, setAllNodes] = useState<PlotNodeData[]>([]);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickModalPosition, setQuickModalPosition] = useState({ x: 0, y: 0 });
  const [editingNode, setEditingNode] = useState<Node<PlotNodeData> | null>(null);

  useEffect(() => {
    if (canvasData) {
      const reactFlowNodes = canvasData.nodes.map((nodeData: PlotNodeData) =>
        createReactFlowNode(nodeData)
      );
      setNodes(reactFlowNodes);
      setEdges(canvasData.edges);
      setAllNodes(canvasData.nodes);
    }
  }, [canvasData, setNodes, setEdges]);

  const handleNodeEdit = async (nodeId: string, updatedData: Partial<PlotNodeData>) => {
    const updatedNodes = nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: { ...node.data, ...updatedData }
        };
      }
      return node;
    });

    const newCanvasData = { nodes: updatedNodes, edges };
    setNodes(updatedNodes);
    await onCanvasUpdate(newCanvasData);
    setEditingNode(null);
  };

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  const handlePaneClick = (event: any) => {
    setQuickModalPosition({ x: event.clientX, y: event.clientY });
    setShowQuickModal(true);
  };

  const handleQuickNodeSave = async (nodeData: Omit<PlotNodeData, 'id'>) => {
    const newNodeId = `node-${Date.now()}`;
    const newNode: PlotNodeData = {
      id: newNodeId,
      ...nodeData,
      onEdit: (nodeId: string) => {
        const nodeToEdit = allNodes.find(n => n.id === nodeId);
        if (nodeToEdit) {
          setEditingNode(nodeToEdit);
        }
      },
      onAddChild: handleAddChild,
    };

    const newReactFlowNode = createReactFlowNode(newNode);
    setNodes((nds) => [...nds, newReactFlowNode]);
    setAllNodes((nds) => [...nds, newNode]);

    const newCanvasData = { nodes: [...allNodes, newNode], edges };
    await onCanvasUpdate(newCanvasData);
    setShowQuickModal(false);
  };

  const handleAddChild = async (parentId: string) => {
    const newNodeId = `node-${Date.now()}`;
    const newNode: PlotNodeData = {
      id: newNodeId,
      type: 'scene',
      name: 'New Scene',
      status: 'not-started',
      detail: 'Details of the new scene',
      onEdit: (nodeId: string) => {
        const nodeToEdit = allNodes.find(n => n.id === nodeId);
        if (nodeToEdit) {
          setEditingNode(nodeToEdit);
        }
      },
      onAddChild: handleAddChild,
    };

    const newReactFlowNode = createReactFlowNode(newNode);
    setNodes((nds) => [...nds, newReactFlowNode]);
    setAllNodes((nds) => [...nds, newNode]);

    const newEdge = {
      id: `${parentId}-${newNodeId}`,
      source: parentId,
      target: newNodeId,
      type: 'custom',
      data: {
        type: 'parent-child',
        onConvertEdge: handleConvertEdge,
      },
    };
    setEdges((eds) => [...eds, newEdge]);

    const newCanvasData = { nodes: [...allNodes, newNode], edges: [...edges, newEdge] };
    await onCanvasUpdate(newCanvasData);
  };

  const handleConvertEdge = async (edgeId: string, action: string) => {
    if (action === 'delete') {
      const updatedEdges = edges.filter(edge => edge.id !== edgeId);
      setEdges(updatedEdges);

      const newCanvasData = { nodes: allNodes, edges: updatedEdges };
      await onCanvasUpdate(newCanvasData);
    } else {
      const updatedEdges = edges.map(edge => {
        if (edge.id === edgeId) {
          return {
            ...edge,
            data: {
              ...edge.data,
              type: action,
            },
          };
        }
        return edge;
      });
      setEdges(updatedEdges);

      const newCanvasData = { nodes: allNodes, edges: updatedEdges };
      await onCanvasUpdate(newCanvasData);
    }
  };

  const createReactFlowNode = (nodeData: PlotNodeData): Node => ({
    id: nodeData.id,
    type: 'plotNode',
    position: { x: Math.random() * 400, y: Math.random() * 400 },
    data: {
      ...nodeData,
      onEdit: (nodeId: string) => {
        const nodeToEdit = allNodes.find(n => n.id === nodeId);
        if (nodeToEdit) {
          setEditingNode(nodeToEdit);
        }
      },
      onAddChild: handleAddChild,
    },
  });

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-background"
      >
        <Controls />
        <Background />
      </ReactFlow>

      {/* Quick Node Creation Modal */}
      {showQuickModal && (
        <QuickNodeModal 
          isOpen={showQuickModal}
          position={quickModalPosition}
          onClose={() => setShowQuickModal(false)}
          onSave={handleQuickNodeSave}
        />
      )}

      {/* Node Edit Modal */}
      {editingNode && (
        <NodeEditModal
          isOpen={!!editingNode}
          node={editingNode}
          onClose={() => setEditingNode(null)}
          onSave={(nodeId: string, updatedData: Partial<PlotNodeData>) => handleNodeEdit(nodeId, updatedData)}
        />
      )}
    </div>
  );
};

export default PlotCanvas;
