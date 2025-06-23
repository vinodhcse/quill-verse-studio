import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  useReactFlow,
  OnConnectStartParams,
  OnConnectEndParams,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import PlotNode from './PlotNode';
import DeletableEdge from './DeletableEdge';
import { NodeEditModal } from './NodeEditModal';
import { QuickNodeModal } from './QuickNodeModal';
import { apiClient } from '@/lib/api';
import { PlotNodeData } from '@/types/plotCanvas';

interface PlotCanvasProps {
  bookId?: string;
  versionId?: string;
  canvasData?: any;
  onCanvasUpdate?: (data: any) => void;
}

const initialNodes: PlotNodeData[] = [
  {
    id: '1',
    type: 'plotNode',
    data: { 
      id: '1',
      type: 'Outline', 
      name: 'Exposition', 
      status: 'Completed',
      onEdit: (nodeId: string) => console.log('Edit node', nodeId),
      onAddChild: (parentId: string) => console.log('Add child to', parentId),
    },
    position: { x: 100, y: 100 },
  },
  {
    id: '2',
    type: 'plotNode',
    data: { 
      id: '2',
      type: 'Act', 
      name: 'Rising Action', 
      status: 'In Progress',
      onEdit: (nodeId: string) => console.log('Edit node', nodeId),
      onAddChild: (parentId: string) => console.log('Add child to', parentId),
    },
    position: { x: 100, y: 300 },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', type: 'deletable' },
];

const nodeTypes: NodeTypes = {
  plotNode: PlotNode as any,
};

const edgeTypes = {
  deletable: DeletableEdge,
};

const PlotCanvas: React.FC<PlotCanvasProps> = ({ 
  bookId, 
  versionId, 
  canvasData, 
  onCanvasUpdate 
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(canvasData?.nodes || initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(canvasData?.edges || initialEdges);
  const [editingNode, setEditingNode] = useState<PlotNodeData | null>(null);
  const [quickNodeModal, setQuickNodeModal] = useState<{ isOpen: boolean; position: { x: number; y: number } }>({
    isOpen: false,
    position: { x: 0, y: 0 },
  });
  const [connectionStartParams, setConnectionStartParams] = useState<OnConnectStartParams | null>(null);
  const { setViewport } = useReactFlow();

  useEffect(() => {
    if (canvasData) {
      setNodes(canvasData.nodes || []);
      setEdges(canvasData.edges || []);
    }
  }, [canvasData, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const newEdge = { ...connection, type: 'deletable' };
        return addEdge(newEdge, eds);
      });
    },
    [setEdges]
  );

  const onConnectStart = useCallback((params: OnConnectStartParams) => {
    setConnectionStartParams(params);
  }, [setConnectionStartParams]);

  const onConnectEnd = useCallback((event: React.MouseEvent, params: OnConnectEndParams) => {
    if (!connectionStartParams) return;

    const targetNode = nodes.find(node => node.id === params.target);
    if (!targetNode) {
      setQuickNodeModal({
        isOpen: true,
        position: {
          x: event.clientX - 150,
          y: event.clientY - 50,
        },
      });
    }
  }, [nodes, connectionStartParams, setQuickNodeModal]);

  const handleSaveNode = async (nodeId: string, updatedData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...updatedData,
            },
          };
        }
        return node;
      })
    );

    if (onCanvasUpdate) {
      const updatedCanvasData = {
        nodes: nodes.map(node => 
          node.id === nodeId ? { ...node, data: { ...node.data, ...updatedData } } : node
        ),
        edges: edges,
      };
      onCanvasUpdate(updatedCanvasData);
    }
  };

  const handleQuickNodeSave = async (nodeData: Omit<PlotNodeData, 'id'>) => {
    const id = String(nodes.length + 1);
    const newNode: any = {
      id: id,
      type: 'plotNode',
      position: quickNodeModal.position,
      data: {
        ...nodeData,
        id: id,
        onEdit: (nodeId: string) => console.log('Edit node', nodeId),
        onAddChild: (parentId: string) => console.log('Add child to', parentId),
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => {
      const newEdge = {
        id: `e${connectionStartParams?.nodeId}-${id}`,
        source: connectionStartParams?.nodeId || '',
        target: id,
        type: 'deletable',
      };
      return addEdge(newEdge, eds);
    });

    setQuickNodeModal({ isOpen: false, position: { x: 0, y: 0 } });

    if (onCanvasUpdate) {
      const updatedCanvasData = {
        nodes: [...nodes, newNode],
        edges: edges.concat({
          id: `e${connectionStartParams?.nodeId}-${id}`,
          source: connectionStartParams?.nodeId || '',
          target: id,
          type: 'deletable',
        }),
      };
      onCanvasUpdate(updatedCanvasData);
    }
  };

  const onConvertEdge = async (edgeId: string, action: string) => {
    if (action === 'delete') {
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
      if (onCanvasUpdate) {
        const updatedCanvasData = {
          nodes: nodes,
          edges: edges.filter((edge) => edge.id !== edgeId),
        };
        onCanvasUpdate(updatedCanvasData);
      }
    } else {
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === edgeId) {
            return { ...edge, data: { ...edge.data, type: action } };
          }
          return edge;
        })
      );
      if (onCanvasUpdate) {
        const updatedCanvasData = {
          nodes: nodes,
          edges: edges.map(edge => edge.id === edgeId ? { ...edge, data: { ...edge.data, type: action } } : edge),
        };
        onCanvasUpdate(updatedCanvasData);
      }
    }
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-gray-50"
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>

      {/* Modals */}
      {editingNode && (
        <NodeEditModal
          node={editingNode}
          isOpen={!!editingNode}
          onClose={() => setEditingNode(null)}
          onSave={handleSaveNode}
        />
      )}

      {quickNodeModal.isOpen && (
        <QuickNodeModal
          isOpen={quickNodeModal.isOpen}
          onClose={() => setQuickNodeModal({ isOpen: false, position: { x: 0, y: 0 } })}
          onSave={handleQuickNodeSave}
          position={quickNodeModal.position}
        />
      )}
    </div>
  );
};

export default PlotCanvas;
