
import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { PlotCanvasData, CanvasNode, CanvasEdge } from '@/types/plotCanvas';
import PlotNode from '@/components/PlotNode';
import DeletableEdge from '@/components/DeletableEdge';
import { QuickNodeModal } from '@/components/QuickNodeModal';
import { CharacterNodeEditModal } from '@/components/CharacterArc/CharacterNodeEditModal';

interface CharacterArcCanvasProps {
  bookId?: string;
  versionId?: string;
  characterId?: string | null;
  canvasData: PlotCanvasData | null;
  onCanvasUpdate: (canvasData: PlotCanvasData) => void;
  plotCanvasNodes?: CanvasNode[];
  timelineEvents?: any[];
}

const nodeTypes = {
  default: PlotNode,
};

const edgeTypes = {
  custom: DeletableEdge,
};

const CharacterArcCanvas: React.FC<CharacterArcCanvasProps> = ({
  bookId,
  versionId,
  characterId,
  canvasData,
  onCanvasUpdate,
  plotCanvasNodes = [],
  timelineEvents = []
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [quickNodeModal, setQuickNodeModal] = useState({ isOpen: false, position: { x: 0, y: 0 }, sourceNodeId: undefined as string | undefined });
  const [editModal, setEditModal] = useState({ isOpen: false, node: null as CanvasNode | null });
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const generateNodeId = useCallback(() => {
    return `${characterId}-arc-${Date.now()}`;
  }, [characterId]);

  const handleNodeEdit = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setEditModal({ isOpen: true, node: node.data as CanvasNode });
    }
  }, [nodes]);

  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes((prevNodes) => prevNodes.filter((node) => node.id !== nodeId));
    setEdges((prevEdges) => prevEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));

    // Update canvas data
    const updatedCanvasData: PlotCanvasData = {
      nodes: nodes.filter(node => node.id !== nodeId).map(node => node.data as CanvasNode),
      edges: edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId).map(edge => edge.data as CanvasEdge),
      timelineEvents: canvasData?.timelineEvents || [],
      lastUpdated: new Date().toISOString()
    };

    onCanvasUpdate(updatedCanvasData);
  }, [setNodes, setEdges, nodes, edges, canvasData, onCanvasUpdate]);

  const handleAddChildNode = useCallback(
    (parentNodeId: string) => {
      if (!characterId) return;

      const newNodeId = generateNodeId();
      const parentNode = nodes.find(node => node.id === parentNodeId);

      if (!parentNode) {
        console.error(`Parent node with id ${parentNodeId} not found.`);
        return;
      }

      const childCount = parentNode.data.childIds ? parentNode.data.childIds.length : 0;
      const childNodePosition = {
        x: parentNode.position.x + 200,
        y: parentNode.position.y + (childCount * 100),
      };

      const newNode: Node = {
        id: newNodeId,
        type: 'default',
        position: childNodePosition,
        data: {
          type: 'Character',
          name: 'New Node',
          detail: 'New Node Detail',
          goal: 'New Node Goal',
          status: 'Not Completed',
          id: newNodeId,
          bookId,
          versionId,
          parentId: parentNodeId,
          childIds: [],
          linkedNodeIds: [],
          onEdit: handleNodeEdit,
          onDelete: handleNodeDelete,
          onAddChild: handleAddChildNode,
          onAddLinkedNode: handleAddLinkedNode,
          plotCanvasNodes: plotCanvasNodes,
          timelineEvents: timelineEvents
        }
      };

      setNodes(prevNodes => [...prevNodes, newNode]);

      // Update parent node with the new child ID
      setNodes(prevNodes => {
        return prevNodes.map(node => {
          if (node.id === parentNodeId) {
            const updatedChildIds = node.data.childIds ? [...node.data.childIds, newNodeId] : [newNodeId];
            return {
              ...node,
              data: {
                ...node.data,
                childIds: updatedChildIds
              }
            };
          }
          return node;
        });
      });

      // Create an edge between the parent and the new node
      const newEdge: Edge = {
        id: `edge-${parentNodeId}-${newNodeId}`,
        source: parentNodeId,
        target: newNodeId,
        type: 'custom',
        data: {
          id: `edge-${parentNodeId}-${newNodeId}`,
          source: parentNodeId,
          target: newNodeId,
        } as CanvasEdge,
      };

      setEdges(prevEdges => [...prevEdges, newEdge]);

      // Update canvas data
      const updatedCanvasData: PlotCanvasData = {
        nodes: [...nodes, newNode].map(node => node.data as CanvasNode),
        edges: [...edges, newEdge].map(edge => edge.data as CanvasEdge),
        timelineEvents: canvasData?.timelineEvents || [],
        lastUpdated: new Date().toISOString()
      };

      onCanvasUpdate(updatedCanvasData);
    },
    [setNodes, setEdges, nodes, edges, bookId, versionId, characterId, handleNodeEdit, handleNodeDelete, generateNodeId, canvasData, onCanvasUpdate, plotCanvasNodes, timelineEvents]
  );

  const handleAddLinkedNode = useCallback(
    (parentNodeId: string, currentNodeType: string) => {
      if (!bookId || !versionId) return;

      const newNodeId = generateNodeId();
      const parentNode = nodes.find(node => node.id === parentNodeId);

      if (!parentNode) {
        console.error(`Parent node with id ${parentNodeId} not found.`);
        return;
      }

      const linkedNodeCount = parentNode.data.linkedNodeIds ? parentNode.data.linkedNodeIds.length : 0;
      const linkedNodePosition = {
        x: parentNode.position.x + 200,
        y: parentNode.position.y + (linkedNodeCount * 100),
      };

      let newNodeType = 'Character';

      if (currentNodeType === 'Character') {
        newNodeType = 'Outline';
      } else if (currentNodeType === 'WorldLocation') {
        newNodeType = 'WorldObject';
      } else if (currentNodeType === 'WorldObject') {
        newNodeType = 'Character';
      }

      const newNode: Node = {
        id: newNodeId,
        type: 'default',
        position: linkedNodePosition,
        data: {
          type: newNodeType,
          name: `New ${newNodeType}`,
          detail: `New ${newNodeType} Detail`,
          goal: `New ${newNodeType} Goal`,
          status: 'Not Completed',
          id: newNodeId,
          bookId,
          versionId,
          parentId: null,
          childIds: [],
          linkedNodeIds: [],
          onEdit: handleNodeEdit,
          onDelete: handleNodeDelete,
          onAddChild: handleAddChildNode,
          onAddLinkedNode: handleAddLinkedNode,
          plotCanvasNodes: plotCanvasNodes,
          timelineEvents: timelineEvents
        }
      };

      setNodes(prevNodes => [...prevNodes, newNode]);

      // Update parent node with the new linked node ID
      setNodes(prevNodes => {
        return prevNodes.map(node => {
          if (node.id === parentNodeId) {
            const updatedLinkedNodeIds = node.data.linkedNodeIds ? [...node.data.linkedNodeIds, newNodeId] : [newNodeId];
            return {
              ...node,
              data: {
                ...node.data,
                linkedNodeIds: updatedLinkedNodeIds
              }
            };
          }
          return node;
        });
      });

      // Create an edge between the parent and the new node
      const newEdge: Edge = {
        id: `edge-${parentNodeId}-${newNodeId}`,
        source: parentNodeId,
        target: newNodeId,
        type: 'custom',
        data: {
          id: `edge-${parentNodeId}-${newNodeId}`,
          source: parentNodeId,
          target: newNodeId,
        } as CanvasEdge,
      };

      setEdges(prevEdges => [...prevEdges, newEdge]);

      // Update canvas data
      const updatedCanvasData: PlotCanvasData = {
        nodes: [...nodes, newNode].map(node => node.data as CanvasNode),
        edges: [...edges, newEdge].map(edge => edge.data as CanvasEdge),
        timelineEvents: canvasData?.timelineEvents || [],
        lastUpdated: new Date().toISOString()
      };

      onCanvasUpdate(updatedCanvasData);
    },
    [setNodes, setEdges, nodes, edges, bookId, versionId, handleNodeEdit, handleNodeDelete, generateNodeId, canvasData, onCanvasUpdate, handleAddChildNode, plotCanvasNodes, timelineEvents]
  );

  const convertToReactFlowNodes = useCallback((canvasNodes: CanvasNode[]): Node[] => {
    return canvasNodes.map(node => ({
      id: node.id,
      type: 'default',
      position: node.position,
      data: {
        ...node,
        bookId,
        versionId,
        onEdit: handleNodeEdit,
        onDelete: handleNodeDelete,
        onAddChild: handleAddChildNode,
        onAddLinkedNode: handleAddLinkedNode,
        plotCanvasNodes: plotCanvasNodes,
        timelineEvents: timelineEvents
      }
    }));
  }, [bookId, versionId, handleNodeEdit, handleNodeDelete, handleAddChildNode, handleAddLinkedNode, plotCanvasNodes, timelineEvents]);

  useEffect(() => {
    if (canvasData) {
      const reactFlowNodes = convertToReactFlowNodes(canvasData.nodes);
      const reactFlowEdges = (canvasData.edges || []).map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: 'custom',
        data: edge
      }));

      setNodes(reactFlowNodes);
      setEdges(reactFlowEdges);
    }
  }, [canvasData, convertToReactFlowNodes, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!characterId) return;

      const newEdge: Edge = {
        id: `edge-${params.source}-${params.target}`,
        source: params.source || '',
        target: params.target || '',
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        type: 'custom',
        data: {
          id: `edge-${params.source}-${params.target}`,
          source: params.source || '',
          target: params.target || '',
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle,
        } as CanvasEdge,
      };

      setEdges((eds) => addEdge(newEdge, eds));

      // Update canvas data
      const updatedCanvasData: PlotCanvasData = {
        nodes: nodes.map(node => node.data as CanvasNode),
        edges: [...edges, newEdge].map(edge => edge.data as CanvasEdge),
        timelineEvents: canvasData?.timelineEvents || [],
        lastUpdated: new Date().toISOString()
      };

      onCanvasUpdate(updatedCanvasData);
    },
    [setEdges, nodes, edges, characterId, canvasData, onCanvasUpdate]
  );

  const handlePaneClick = useCallback((event: any) => {
    // console.log('Pane Clicked', event);
  }, []);

  const handlePaneContextMenu = useCallback(
    (event: any) => {
      event.preventDefault();

      const panePosition = {
        x: event.clientX - 200,
        y: event.clientY - 50,
      };

      setQuickNodeModal({ isOpen: true, position: panePosition, sourceNodeId: undefined });
    },
    [setQuickNodeModal]
  );

  const handleQuickNodeSave = useCallback(
    (nodeData: any, position: { x: number; y: number }) => {
      if (!characterId) return;

      const newNodeId = generateNodeId();
      const newNode: Node = {
        id: newNodeId,
        type: 'default',
        position,
        data: {
          ...nodeData,
          id: newNodeId,
          bookId,
          versionId,
          onEdit: handleNodeEdit,
          onDelete: handleNodeDelete,
          onAddChild: handleAddChildNode,
          onAddLinkedNode: handleAddLinkedNode,
          plotCanvasNodes: plotCanvasNodes,
          timelineEvents: timelineEvents
        }
      };

      setNodes((prevNodes) => [...prevNodes, newNode]);

      // Update canvas data
      const updatedCanvasData: PlotCanvasData = {
        nodes: [...nodes, newNode].map(node => node.data as CanvasNode),
        edges: edges.map(edge => edge.data as CanvasEdge),
        timelineEvents: canvasData?.timelineEvents || [],
        lastUpdated: new Date().toISOString()
      };

      onCanvasUpdate(updatedCanvasData);

      setQuickNodeModal({ isOpen: false, position: { x: 0, y: 0 }, sourceNodeId: undefined });
    },
    [setNodes, nodes, edges, bookId, versionId, characterId, handleNodeEdit, handleNodeDelete, generateNodeId, canvasData, onCanvasUpdate, setQuickNodeModal, handleAddChildNode, handleAddLinkedNode, plotCanvasNodes, timelineEvents]
  );

  const handleNodeSave = useCallback((updatedNode: CanvasNode) => {
    setNodes(prevNodes => {
      const updatedNodes = prevNodes.map(node => {
        if (node.id === updatedNode.id) {
          return {
            ...node,
            data: {
              ...updatedNode,
              plotCanvasNodes: plotCanvasNodes,
              timelineEvents: timelineEvents
            }
          };
        }
        return node;
      });
      return updatedNodes;
    });

    // Update canvas data
    const updatedCanvasData: PlotCanvasData = {
      nodes: nodes.map(node => {
        if (node.id === updatedNode.id) {
          return updatedNode;
        }
        return node.data as CanvasNode;
      }),
      edges: edges.map(edge => edge.data as CanvasEdge),
      timelineEvents: canvasData?.timelineEvents || [],
      lastUpdated: new Date().toISOString()
    };

    onCanvasUpdate(updatedCanvasData);
    setEditModal({ isOpen: false, node: null });
  }, [nodes, edges, canvasData, onCanvasUpdate, plotCanvasNodes, timelineEvents, setNodes]);

  const handleReactFlowInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  }, []);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={handleReactFlowInit}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        onPaneClick={handlePaneClick}
        onPaneContextMenu={handlePaneContextMenu}
        className="character-arc-canvas"
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} />
      </ReactFlow>

      <QuickNodeModal
        isOpen={quickNodeModal.isOpen}
        onClose={() => setQuickNodeModal({ isOpen: false, position: { x: 0, y: 0 }, sourceNodeId: undefined })}
        onSave={handleQuickNodeSave}
        position={quickNodeModal.position}
        sourceNodeId={quickNodeModal.sourceNodeId}
      />

      <CharacterNodeEditModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, node: null })}
        onSave={handleNodeSave}
        node={editModal.node}
        plotCanvasNodes={plotCanvasNodes}
        timelineEvents={timelineEvents}
      />
    </div>
  );
};

export default CharacterArcCanvas;
