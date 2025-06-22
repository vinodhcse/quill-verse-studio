import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Connection,
  NodeOrigin,
  Panel,
  OnConnectStartParams,
  ReactFlowInstance,
  MarkerType,
  NodeTypes
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { CanvasNode, CanvasData, TimelineEvent } from '@/types/canvas';
import PlotNode from './PlotNode';
import DeletableEdge from './DeletableEdge';
import { NodeEditModal } from './NodeEditModal';
import { QuickNodeModal } from './QuickNodeModal';
import { Plus, Save, Download, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const nodeTypes: NodeTypes = {
  plotNode: PlotNode,
};

const edgeTypes = {
  deletable: DeletableEdge,
};

const nodeOrigin: NodeOrigin = [0.5, 0];

interface PlotCanvasProps {
  bookId?: string;
}

// Helper function to determine the best handles based on node positions
const getBestHandles = (sourcePos: { x: number; y: number }, targetPos: { x: number; y: number }) => {
  const deltaX = targetPos.x - sourcePos.x;
  const deltaY = targetPos.y - sourcePos.y;
  
  // Determine primary direction based on the larger absolute difference
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // Horizontal connection is primary
    if (deltaX > 0) {
      // Target is to the right of source - connect right to left
      return { sourceHandle: 'right', targetHandle: 'left' };
    } else {
      // Target is to the left of source - connect left to right
      return { sourceHandle: 'left', targetHandle: 'right' };
    }
  } else {
    // Vertical connection is primary
    if (deltaY > 0) {
      // Target is below source - connect bottom to top
      return { sourceHandle: 'bottom', targetHandle: 'top' };
    } else {
      // Target is above source - connect top to bottom
      return { sourceHandle: 'top', targetHandle: 'bottom' };
    }
  }
};

export const PlotCanvas: React.FC<PlotCanvasProps> = ({ bookId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [canvasNodes, setCanvasNodes] = useState<CanvasNode[]>([]);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<CanvasNode | undefined>();
  const [parentNodeForNew, setParentNodeForNew] = useState<string | undefined>();
  const [connectStartParams, setConnectStartParams] = useState<OnConnectStartParams | null>(null);
  const [quickNodePosition, setQuickNodePosition] = useState({ x: 0, y: 0 });
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(`plotCanvas_${bookId || 'default'}`);
    if (savedData) {
      try {
        const data: CanvasData = JSON.parse(savedData);
        setCanvasNodes(data.nodes || []);
        setTimelineEvents(data.timelineEvents || []);
        setNodePositions(data.nodePositions || {});
      } catch (error) {
        console.error('Failed to load canvas data:', error);
      }
    }
  }, [bookId]);

  // Handle edge conversion and deletion
  const handleEdgeConversion = useCallback((edgeId: string, newTypeOrDelete: string) => {
    console.log('handleEdgeConversion called:', { edgeId, newTypeOrDelete });
    
    if (newTypeOrDelete === 'delete') {
      console.log('Handling edge deletion for:', edgeId);
      
      // Handle edge deletion
      if (edgeId.startsWith('parent_')) {
        // Handle parent-child edge deletion
        const parts = edgeId.split('_');
        if (parts.length >= 3) {
          const parentId = parts[1];
          const childId = parts[2];
          
          console.log('Deleting parent-child edge:', { parentId, childId });
          
          setCanvasNodes(prev => prev.map(node => {
            if (node.id === childId) {
              return { ...node, parentId: undefined };
            }
            if (node.id === parentId) {
              return {
                ...node,
                childIds: node.childIds.filter(id => id !== childId)
              };
            }
            return node;
          }));
        }
      } else if (edgeId.startsWith('link_')) {
        // Handle linked edge deletion
        const parts = edgeId.split('_');
        if (parts.length >= 3) {
          const sourceId = parts[1];
          const targetId = parts[2];
          
          console.log('Deleting linked edge:', { sourceId, targetId });
          
          setCanvasNodes(prev => prev.map(node => {
            if (node.id === sourceId) {
              return {
                ...node,
                linkedNodeIds: (node.linkedNodeIds || []).filter(id => id !== targetId)
              };
            }
            if (node.id === targetId) {
              return {
                ...node,
                linkedNodeIds: (node.linkedNodeIds || []).filter(id => id !== sourceId)
              };
            }
            return node;
          }));
        }
      }
      
      // Also remove from React Flow edges
      setEdges(prev => prev.filter(edge => edge.id !== edgeId));
      
    } else {
      // Handle edge type conversion
      console.log('Converting edge type:', { edgeId, newType: newTypeOrDelete });
      
      if (edgeId.startsWith('parent_') && newTypeOrDelete === 'linked') {
        // Convert parent-child to linked
        const parts = edgeId.split('_');
        if (parts.length >= 3) {
          const parentId = parts[1];
          const childId = parts[2];
          
          setCanvasNodes(prev => prev.map(node => {
            if (node.id === childId) {
              return { 
                ...node, 
                parentId: undefined,
                linkedNodeIds: [...(node.linkedNodeIds || []), parentId]
              };
            }
            if (node.id === parentId) {
              return {
                ...node,
                childIds: node.childIds.filter(id => id !== childId),
                linkedNodeIds: [...(node.linkedNodeIds || []), childId]
              };
            }
            return node;
          }));
        }
      } else if (edgeId.startsWith('link_') && newTypeOrDelete === 'parent-child') {
        // Convert linked to parent-child
        const parts = edgeId.split('_');
        if (parts.length >= 3) {
          const sourceId = parts[1];
          const targetId = parts[2];
          
          setCanvasNodes(prev => prev.map(node => {
            if (node.id === targetId) {
              return { 
                ...node, 
                parentId: sourceId,
                linkedNodeIds: (node.linkedNodeIds || []).filter(id => id !== sourceId)
              };
            }
            if (node.id === sourceId) {
              return {
                ...node,
                childIds: [...node.childIds, targetId],
                linkedNodeIds: (node.linkedNodeIds || []).filter(id => id !== targetId)
              };
            }
            return node;
          }));
        }
      }
    }
  }, []);

  const handleEditNode = useCallback((nodeId: string) => {
    const node = canvasNodes.find(n => n.id === nodeId);
    setEditingNode(node);
    setParentNodeForNew(undefined);
    setIsModalOpen(true);
  }, [canvasNodes]);

  const handleAddChild = useCallback((parentId: string) => {
    setEditingNode(undefined);
    setParentNodeForNew(parentId);
    setIsModalOpen(true);
  }, []);

  // Memoize flow edges to prevent unnecessary recalculations
  const flowEdges = useMemo(() => {
    const edges: Edge[] = [];
    
    // Add parent-child edges
    canvasNodes
      .filter(node => node.parentId)
      .forEach(node => {
        const parentPos = nodePositions[node.parentId!] || { x: 0, y: 0 };
        const childPos = nodePositions[node.id] || { x: 0, y: 0 };
        const handles = getBestHandles(parentPos, childPos);
        
        edges.push({
          id: `parent_${node.parentId}_${node.id}`,
          source: node.parentId!,
          target: node.id,
          sourceHandle: handles.sourceHandle,
          targetHandle: handles.targetHandle,
          type: 'deletable',
          style: { stroke: '#10b981', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#10b981',
          },
          data: { 
            type: 'parent-child',
            onConvertEdge: handleEdgeConversion
          },
        });
      });

    // Add linked node edges
    canvasNodes.forEach(node => {
      if (node.linkedNodeIds && node.linkedNodeIds.length > 0) {
        node.linkedNodeIds.forEach(linkedId => {
          const edgeId = `link_${node.id}_${linkedId}`;
          const reverseEdgeId = `link_${linkedId}_${node.id}`;
          
          if (!edges.find(e => e.id === edgeId || e.id === reverseEdgeId)) {
            const sourcePos = nodePositions[node.id] || { x: 0, y: 0 };
            const targetPos = nodePositions[linkedId] || { x: 0, y: 0 };
            const handles = getBestHandles(sourcePos, targetPos);
            
            edges.push({
              id: edgeId,
              source: node.id,
              target: linkedId,
              sourceHandle: handles.sourceHandle,
              targetHandle: handles.targetHandle,
              type: 'deletable',
              style: { stroke: '#6366f1', strokeWidth: 2 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#6366f1',
              },
              data: { 
                type: 'linked',
                onConvertEdge: handleEdgeConversion
              },
            });
          }
        });
      }
    });

    console.log('Generated edges:', edges);
    return edges;
  }, [canvasNodes, nodePositions, handleEdgeConversion]);

  // Convert canvas nodes to React Flow nodes
  useEffect(() => {
    const flowNodes: Node[] = canvasNodes.map((canvasNode, index) => {
      const savedPosition = nodePositions[canvasNode.id] || canvasNode.position;
      const defaultPosition = { x: (index % 4) * 300, y: Math.floor(index / 4) * 200 };
      
      return {
        id: canvasNode.id,
        type: 'plotNode',
        position: savedPosition || defaultPosition,
        data: {
          ...canvasNode,
          onEdit: handleEditNode,
          onAddChild: handleAddChild,
        },
      };
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [canvasNodes, nodePositions, flowEdges, handleEditNode, handleAddChild]);

  // Handle node position changes with debouncing
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
    
    // Update positions when nodes are dragged
    changes.forEach(change => {
      if (change.type === 'position' && change.position && !change.dragging) {
        setNodePositions(prev => ({
          ...prev,
          [change.id]: change.position
        }));
      }
      
      // Handle node deletion
      if (change.type === 'remove') {
        setCanvasNodes(prev => {
          const nodeToDelete = prev.find(node => node.id === change.id);
          if (!nodeToDelete) return prev;

          return prev
            .filter(node => node.id !== change.id)
            .map(node => ({
              ...node,
              childIds: node.childIds.filter(id => id !== change.id),
              linkedNodeIds: (node.linkedNodeIds || []).filter(id => id !== change.id),
              parentId: node.parentId === change.id ? undefined : node.parentId
            }));
        });
      }
    });
  }, [onNodesChange]);

  // Handle edge changes - use the existing edge deletion logic
  const handleEdgesChange = useCallback((changes: any[]) => {
    onEdgesChange(changes);
  }, [onEdgesChange]);

  const handleCreateRootNode = useCallback(() => {
    setEditingNode(undefined);
    setParentNodeForNew(undefined);
    setIsModalOpen(true);
  }, []);

  const handleSaveNode = useCallback((nodeData: CanvasNode) => {
    setCanvasNodes(prev => {
      const existingIndex = prev.findIndex(n => n.id === nodeData.id);
      let updatedNodes;

      if (existingIndex >= 0) {
        updatedNodes = [...prev];
        updatedNodes[existingIndex] = { ...nodeData, linkedNodeIds: nodeData.linkedNodeIds || [] };
      } else {
        nodeData.linkedNodeIds = nodeData.linkedNodeIds || [];
        
        if (parentNodeForNew) {
          nodeData.parentId = parentNodeForNew;
          const parentIndex = prev.findIndex(n => n.id === parentNodeForNew);
          if (parentIndex >= 0) {
            updatedNodes = [...prev];
            updatedNodes[parentIndex] = {
              ...updatedNodes[parentIndex],
              childIds: [...updatedNodes[parentIndex].childIds, nodeData.id]
            };
            updatedNodes.push(nodeData);
          } else {
            updatedNodes = [...prev, nodeData];
          }
        } else {
          updatedNodes = [...prev, nodeData];
        }
      }

      return updatedNodes;
    });

    toast({
      title: "Node saved",
      description: `${nodeData.name} has been saved successfully.`,
    });
  }, [parentNodeForNew]);

  const handleQuickNodeSave = useCallback((nodeData: CanvasNode, position: { x: number; y: number }) => {
    nodeData.linkedNodeIds = [];
    setCanvasNodes(prev => [...prev, nodeData]);
    setNodePositions(prev => ({ ...prev, [nodeData.id]: position }));

    if (connectStartParams) {
      setCanvasNodes(prev => prev.map(node => {
        if (node.id === connectStartParams.nodeId) {
          return {
            ...node,
            linkedNodeIds: [...(node.linkedNodeIds || []), nodeData.id]
          };
        }
        return node;
      }));

      setTimeout(() => {
        setCanvasNodes(prev => prev.map(node => {
          if (node.id === nodeData.id) {
            return {
              ...node,
              linkedNodeIds: [...(node.linkedNodeIds || []), connectStartParams.nodeId!]
            };
          }
          return node;
        }));
      }, 100);
    }

    setConnectStartParams(null);

    toast({
      title: "Node created",
      description: `${nodeData.name} has been created and connected.`,
    });
  }, [connectStartParams]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        setCanvasNodes(prev => prev.map(node => {
          if (node.id === params.source) {
            const linkedNodeIds = node.linkedNodeIds || [];
            if (!linkedNodeIds.includes(params.target!)) {
              return {
                ...node,
                linkedNodeIds: [...linkedNodeIds, params.target!]
              };
            }
          }
          if (node.id === params.target) {
            const linkedNodeIds = node.linkedNodeIds || [];
            if (!linkedNodeIds.includes(params.source!)) {
              return {
                ...node,
                linkedNodeIds: [...linkedNodeIds, params.source!]
              };
            }
          }
          return node;
        }));
      }

      const sourcePos = nodePositions[params.source!] || { x: 0, y: 0 };
      const targetPos = nodePositions[params.target!] || { x: 0, y: 0 };
      const handles = getBestHandles(sourcePos, targetPos);

      const newEdge = {
        ...params,
        sourceHandle: handles.sourceHandle,
        targetHandle: handles.targetHandle,
        type: 'deletable',
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6366f1',
        },
        data: { type: 'linked', onConvertEdge: handleEdgeConversion },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, nodePositions, handleEdgeConversion]
  );

  const onConnectStart = useCallback((event: any, params: OnConnectStartParams) => {
    setConnectStartParams(params);
  }, []);

  const onConnectEnd = useCallback((event: any) => {
    if (!connectStartParams || !reactFlowInstance || !reactFlowWrapper.current) return;

    const targetIsPane = event.target.classList.contains('react-flow__pane');
    
    if (targetIsPane) {
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      setQuickNodePosition(position);
      setIsQuickModalOpen(true);
    }
  }, [connectStartParams, reactFlowInstance]);

  const onInit = useCallback((reactFlowInstance: ReactFlowInstance) => {
    setReactFlowInstance(reactFlowInstance);
  }, []);

  const saveToLocalStorage = useCallback(() => {
    const data: CanvasData = {
      nodes: canvasNodes,
      timelineEvents,
      nodePositions,
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem(`plotCanvas_${bookId || 'default'}`, JSON.stringify(data));
    
    toast({
      title: "Canvas saved",
      description: "Your plot canvas has been saved locally.",
    });
  }, [canvasNodes, timelineEvents, nodePositions, bookId]);

  const exportCanvas = useCallback(() => {
    const data: CanvasData = {
      nodes: canvasNodes,
      timelineEvents,
      nodePositions,
      lastUpdated: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plot-canvas-${bookId || 'default'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [canvasNodes, timelineEvents, nodePositions, bookId]);

  const importCanvas = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data: CanvasData = JSON.parse(e.target?.result as string);
        setCanvasNodes(data.nodes || []);
        setTimelineEvents(data.timelineEvents || []);
        setNodePositions(data.nodePositions || {});
        
        toast({
          title: "Canvas imported",
          description: "Your plot canvas has been imported successfully.",
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Failed to import canvas data. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, []);

  const parentNode = parentNodeForNew ? canvasNodes.find(n => n.id === parentNodeForNew) : undefined;

  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onInit={onInit}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodeOrigin={nodeOrigin}
        fitView
        snapToGrid={true}
        snapGrid={[15, 15]}
        deleteKeyCode={["Backspace", "Delete"]}
        multiSelectionKeyCode={["Meta", "Ctrl"]}
        connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
        defaultEdgeOptions={{ 
          type: 'deletable',
          style: { stroke: '#6366f1', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
          data: { type: 'linked', onConvertEdge: handleEdgeConversion }
        }}
      >
        <Panel position="top-left" className="space-x-2">
          <Button onClick={handleCreateRootNode} size="sm">
            <Plus size={16} />
            Add Node
          </Button>
          <Button onClick={saveToLocalStorage} size="sm" variant="outline">
            <Save size={16} />
            Save
          </Button>
          <Button onClick={exportCanvas} size="sm" variant="outline">
            <Download size={16} />
            Export
          </Button>
          <label className="cursor-pointer">
            <Button size="sm" variant="outline" asChild>
              <span>
                <Upload size={16} />
                Import
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={importCanvas}
              className="hidden"
            />
          </label>
        </Panel>

        <Controls />
        <Background />
        <MiniMap />
      </ReactFlow>

      <NodeEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNode}
        node={editingNode}
        timelineEvents={timelineEvents}
        onTimelineEventsChange={setTimelineEvents}
        parentType={parentNode?.type}
      />

      <QuickNodeModal
        isOpen={isQuickModalOpen}
        onClose={() => {
          setIsQuickModalOpen(false);
          setConnectStartParams(null);
        }}
        onSave={handleQuickNodeSave}
        position={quickNodePosition}
        sourceNodeId={connectStartParams?.nodeId}
      />
    </div>
  );
};
