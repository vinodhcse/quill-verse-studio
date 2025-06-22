
import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  MarkerType
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

const nodeTypes = {
  plotNode: PlotNode,
};

const edgeTypes = {
  deletable: DeletableEdge,
};

const nodeOrigin: NodeOrigin = [0.5, 0];

interface PlotCanvasProps {
  bookId?: string;
}

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

  // Convert canvas nodes to React Flow nodes
  useEffect(() => {
    const flowNodes: Node[] = canvasNodes.map((canvasNode, index) => {
      // Use saved position or calculate default position
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

    const flowEdges: Edge[] = [];
    
    // Add parent-child edges
    canvasNodes
      .filter(node => node.parentId)
      .forEach(node => {
        flowEdges.push({
          id: `parent_${node.parentId}_${node.id}`,
          source: node.parentId!,
          target: node.id,
          type: 'deletable',
          style: { stroke: '#10b981', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#10b981',
          },
        });
      });

    // Add linked node edges (same-level connections)
    canvasNodes.forEach(node => {
      if (node.linkedNodeIds && node.linkedNodeIds.length > 0) {
        node.linkedNodeIds.forEach(linkedId => {
          // Only create edge if it doesn't already exist (to avoid duplicates)
          const edgeId = `link_${node.id}_${linkedId}`;
          const reverseEdgeId = `link_${linkedId}_${node.id}`;
          
          if (!flowEdges.find(e => e.id === edgeId || e.id === reverseEdgeId)) {
            flowEdges.push({
              id: edgeId,
              source: node.id,
              target: linkedId,
              type: 'deletable',
              style: { stroke: '#6366f1', strokeWidth: 2 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#6366f1',
              },
            });
          }
        });
      }
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [canvasNodes, nodePositions]);

  // Save node positions when they change
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
    
    // Update positions when nodes are dragged
    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        setNodePositions(prev => ({
          ...prev,
          [change.id]: change.position
        }));
      }
    });
  }, [onNodesChange]);

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
        // Update existing node
        updatedNodes = [...prev];
        updatedNodes[existingIndex] = { ...nodeData, linkedNodeIds: nodeData.linkedNodeIds || [] };
      } else {
        // Add new node
        nodeData.linkedNodeIds = nodeData.linkedNodeIds || [];
        
        if (parentNodeForNew) {
          nodeData.parentId = parentNodeForNew;
          // Update parent's childIds
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
    // Add the new node with position
    nodeData.linkedNodeIds = [];
    setCanvasNodes(prev => [...prev, nodeData]);
    setNodePositions(prev => ({ ...prev, [nodeData.id]: position }));

    // If there was a connection being made, create the link
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

      // Also add reverse link
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
      // Add the connection as a linked relationship
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

      const newEdge = {
        ...params,
        type: 'deletable',
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6366f1',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onConnectStart = useCallback((event: any, params: OnConnectStartParams) => {
    setConnectStartParams(params);
  }, []);

  const onConnectEnd = useCallback((event: any) => {
    if (!connectStartParams || !reactFlowInstance || !reactFlowWrapper.current) return;

    const targetIsPane = event.target.classList.contains('react-flow__pane');
    
    if (targetIsPane) {
      // Get mouse position relative to the flow
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
        onEdgesChange={onEdgesChange}
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
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' }
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
