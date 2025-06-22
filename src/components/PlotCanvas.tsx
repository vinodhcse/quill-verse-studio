
import React, { useState, useCallback, useEffect } from 'react';
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
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { CanvasNode, CanvasData, TimelineEvent } from '@/types/canvas';
import PlotNode from './PlotNode';
import { NodeEditModal } from './NodeEditModal';
import { Plus, Save, Download, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const nodeTypes = {
  plotNode: PlotNode,
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
  const [editingNode, setEditingNode] = useState<CanvasNode | undefined>();
  const [parentNodeForNew, setParentNodeForNew] = useState<string | undefined>();

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

    const flowEdges: Edge[] = canvasNodes
      .filter(node => node.parentId)
      .map(node => ({
        id: `edge_${node.parentId}_${node.id}`,
        source: node.parentId!,
        target: node.id,
        type: 'smoothstep',
      }));

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

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

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
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        nodeOrigin={nodeOrigin}
        fitView
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
    </div>
  );
};
