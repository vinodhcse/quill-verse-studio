
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
  ReactFlowInstance
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
      } catch (error) {
        console.error('Failed to load canvas data:', error);
      }
    }
  }, [bookId]);

  // Convert canvas nodes to React Flow nodes
  useEffect(() => {
    const flowNodes: Node[] = canvasNodes.map((canvasNode, index) => ({
      id: canvasNode.id,
      type: 'plotNode',
      position: { x: (index % 4) * 300, y: Math.floor(index / 4) * 200 },
      data: {
        ...canvasNode,
        onEdit: handleEditNode,
        onAddChild: handleAddChild,
      },
    }));

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
            type: 'arrowclosed',
            color: '#10b981',
          },
        });
      });

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [canvasNodes]);

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
        updatedNodes[existingIndex] = nodeData;
      } else {
        // Add new node
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
    // Add the new node
    setCanvasNodes(prev => [...prev, nodeData]);

    // If there was a connection being made, create the edge
    if (connectStartParams && reactFlowInstance) {
      const newEdge: Edge = {
        id: `edge_${connectStartParams.nodeId}_${nodeData.id}`,
        source: connectStartParams.nodeId!,
        sourceHandle: connectStartParams.handleId,
        target: nodeData.id,
        targetHandle: 'top-target-1',
        type: 'deletable',
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: {
          type: 'arrowclosed',
          color: '#6366f1',
        },
      };

      setEdges(edges => [...edges, newEdge]);
    }

    // Add the new node to the flow
    const newFlowNode: Node = {
      id: nodeData.id,
      type: 'plotNode',
      position: position,
      data: {
        ...nodeData,
        onEdit: handleEditNode,
        onAddChild: handleAddChild,
      },
    };

    setNodes(nodes => [...nodes, newFlowNode]);
    setConnectStartParams(null);

    toast({
      title: "Node created",
      description: `${nodeData.name} has been created and connected.`,
    });
  }, [connectStartParams, reactFlowInstance, handleEditNode, handleAddChild]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'deletable',
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: {
          type: 'arrowclosed',
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

  const saveToLocalStorage = useCallback(() => {
    const data: CanvasData = {
      nodes: canvasNodes,
      timelineEvents,
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem(`plotCanvas_${bookId || 'default'}`, JSON.stringify(data));
    
    toast({
      title: "Canvas saved",
      description: "Your plot canvas has been saved locally.",
    });
  }, [canvasNodes, timelineEvents, bookId]);

  const exportCanvas = useCallback(() => {
    const data: CanvasData = {
      nodes: canvasNodes,
      timelineEvents,
      lastUpdated: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plot-canvas-${bookId || 'default'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [canvasNodes, timelineEvents, bookId]);

  const importCanvas = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data: CanvasData = JSON.parse(e.target?.result as string);
        setCanvasNodes(data.nodes || []);
        setTimelineEvents(data.timelineEvents || []);
        
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
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onInit={setReactFlowInstance}
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
          markerEnd: { type: 'arrowclosed', color: '#6366f1' }
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
