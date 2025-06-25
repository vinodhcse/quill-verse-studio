
import React, { useState, useCallback, useEffect } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import PlotNode from '@/components/PlotNode';
import DeletableEdge from '@/components/DeletableEdge';
import { PlotNodeData } from '@/types/plotCanvas';
import { QuickNodeModal } from './QuickNodeModal';
import { NodeEditModal } from './NodeEditModal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const initialNodes: Node<PlotNodeData>[] = [
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
      characters: [],
      worlds: [],
      onEdit: () => {},
      onAddChild: () => {},
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
  const [nodes, setNodes, onNodesChange] = useNodesState<PlotNodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickModalPosition, setQuickModalPosition] = useState({ x: 0, y: 0 });
  const [editingNode, setEditingNode] = useState<Node<PlotNodeData> | null>(null);

  useEffect(() => {
    if (canvasData && canvasData.nodes) {
      const reactFlowNodes = canvasData.nodes.map((nodeData: any) =>
        createReactFlowNode(nodeData)
      );
      setNodes(reactFlowNodes);
      setEdges(canvasData.edges || []);
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
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: `${params.source}-${params.target}-${Date.now()}`,
        type: 'custom',
        data: {
          type: 'linked',
          onConvertEdge: handleConvertEdge,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const handlePaneClick = (event: any) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setQuickModalPosition({ 
      x: event.clientX - bounds.left, 
      y: event.clientY - bounds.top 
    });
    setShowQuickModal(true);
  };

  const handleQuickNodeSave = async (nodeData: any, position: { x: number; y: number }) => {
    const newNodeId = `node-${Date.now()}`;
    const newNode: Node<PlotNodeData> = createReactFlowNode({
      id: newNodeId,
      type: nodeData.type || 'scene',
      name: nodeData.name || 'New Node',
      detail: nodeData.detail || '',
      status: nodeData.status || 'not-started',
      characters: nodeData.characters || [],
      worlds: nodeData.worlds || [],
      position
    });

    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);

    const newCanvasData = { nodes: updatedNodes, edges };
    await onCanvasUpdate(newCanvasData);
    setShowQuickModal(false);
  };

  const handleAddChild = async (parentId: string) => {
    const newNodeId = `node-${Date.now()}`;
    const parentNode = nodes.find(n => n.id === parentId);
    const childPosition = parentNode 
      ? { x: parentNode.position.x + 300, y: parentNode.position.y + 150 }
      : { x: Math.random() * 400, y: Math.random() * 400 };

    const newNode: Node<PlotNodeData> = createReactFlowNode({
      id: newNodeId,
      type: 'scene',
      name: 'New Scene',
      detail: 'Details of the new scene',
      status: 'not-started',
      characters: [],
      worlds: [],
      position: childPosition
    });

    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);

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
    const updatedEdges = [...edges, newEdge];
    setEdges(updatedEdges);

    const newCanvasData = { nodes: updatedNodes, edges: updatedEdges };
    await onCanvasUpdate(newCanvasData);
  };

  const handleConvertEdge = async (edgeId: string, action: string) => {
    if (action === 'delete') {
      const updatedEdges = edges.filter(edge => edge.id !== edgeId);
      setEdges(updatedEdges);

      const newCanvasData = { nodes, edges: updatedEdges };
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

      const newCanvasData = { nodes, edges: updatedEdges };
      await onCanvasUpdate(newCanvasData);
    }
  };

  const createReactFlowNode = (nodeData: any): Node<PlotNodeData> => ({
    id: nodeData.id,
    type: 'plotNode',
    position: nodeData.position || { x: Math.random() * 400, y: Math.random() * 400 },
    data: {
      id: nodeData.id,
      type: nodeData.type || 'scene',
      name: nodeData.name || 'Untitled',
      detail: nodeData.detail || '',
      status: nodeData.status || 'not-started',
      characters: nodeData.characters || [],
      worlds: nodeData.worlds || [],
      onEdit: (nodeId: string) => {
        console.log('Edit clicked for node:', nodeId);
        const nodeToEdit = nodes.find(n => n.id === nodeId);
        if (nodeToEdit) {
          console.log('Setting editing node:', nodeToEdit);
          setEditingNode(nodeToEdit);
        }
      },
      onAddChild: handleAddChild,
    },
  });

  const handleAddFirstNode = () => {
    const newNodeId = `node-${Date.now()}`;
    const newNode: Node<PlotNodeData> = createReactFlowNode({
      id: newNodeId,
      type: 'act',
      name: 'Act 1',
      detail: 'The beginning of the story',
      status: 'not-started',
      characters: [],
      worlds: [],
      position: { x: 250, y: 250 }
    });

    setNodes([newNode]);
    const newCanvasData = { nodes: [newNode], edges: [] };
    onCanvasUpdate(newCanvasData);
  };

  return (
    <div className="h-full w-full relative">
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/80">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-muted-foreground">No story structure yet</h3>
            <p className="text-sm text-muted-foreground">Start building your plot by adding your first act</p>
            <Button onClick={handleAddFirstNode} className="flex items-center gap-2">
              <Plus size={16} />
              Add First Act
            </Button>
          </div>
        </div>
      )}

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
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Meta', 'Ctrl']}
        connectionMode="loose"
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
          node={editingNode.data}
          onClose={() => setEditingNode(null)}
          onSave={handleNodeEdit}
          timelineEvents={[]}
          onTimelineEventsChange={() => {}}
        />
      )}
    </div>
  );
};

export default PlotCanvas;
