
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
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import PlotNode from '@/components/PlotNode';
import DeletableEdge from '@/components/DeletableEdge';
import { PlotNodeData, CanvasNode, PlotCanvasData } from '@/types/plotCanvas';
import { QuickNodeModal } from './QuickNodeModal';
import { NodeEditModal } from './NodeEditModal';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';

const nodeTypes = { plotNode: PlotNode };
const edgeTypes = {
  custom: DeletableEdge,
};

interface PlotCanvasProps {
  bookId: string | undefined;
  versionId: string | undefined;
  canvasData: PlotCanvasData | null;
  onCanvasUpdate: (data: any) => void;
}

const PlotCanvas: React.FC<PlotCanvasProps> = ({
  bookId,
  versionId,
  canvasData,
  onCanvasUpdate,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickModalPosition, setQuickModalPosition] = useState({ x: 0, y: 0 });
  const [editingNode, setEditingNode] = useState<CanvasNode | null>(null);
  const [currentViewNodeId, setCurrentViewNodeId] = useState<string | null>(null);
  const [currentViewType, setCurrentViewType] = useState<string>('Outline');

  useEffect(() => {
    if (canvasData && canvasData.nodes) {
      loadNodesForCurrentView();
    }
  }, [canvasData, currentViewNodeId, currentViewType]);

  const loadNodesForCurrentView = () => {
    if (!canvasData) return;

    let nodesToShow: CanvasNode[] = [];
    
    if (!currentViewNodeId) {
      // Show top-level nodes (Outline and Characters/World entities)
      nodesToShow = canvasData.nodes.filter(node => 
        node.type === 'Outline' || 
        (node.parentId === null && ['Character', 'WorldLocation', 'WorldObject'].includes(node.type))
      );
    } else {
      // Show children and linked nodes of the selected node
      const selectedNode = canvasData.nodes.find(n => n.id === currentViewNodeId);
      if (selectedNode) {
        nodesToShow = canvasData.nodes.filter(node => 
          selectedNode.childIds.includes(node.id) || 
          selectedNode.linkedNodeIds.includes(node.id) ||
          node.id === currentViewNodeId
        );
      }
    }

    const reactFlowNodes: Node[] = nodesToShow.map(nodeData => createReactFlowNode(nodeData));
    setNodes(reactFlowNodes);

    // Create edges for parent-child and linked relationships
    const reactFlowEdges: Edge[] = [];
    nodesToShow.forEach(node => {
      // Parent-child edges (from bottom handle to top handle)
      node.childIds.forEach(childId => {
        if (nodesToShow.find(n => n.id === childId)) {
          reactFlowEdges.push({
            id: `${node.id}-${childId}`,
            source: node.id,
            sourceHandle: 'bottom',
            target: childId,
            targetHandle: 'top',
            type: 'custom',
            data: {
              type: 'parent-child',
              onConvertEdge: handleConvertEdge,
            },
          });
        }
      });

      // Linked edges (from side handles)
      node.linkedNodeIds.forEach(linkedId => {
        if (nodesToShow.find(n => n.id === linkedId)) {
          reactFlowEdges.push({
            id: `${node.id}-${linkedId}`,
            source: node.id,
            sourceHandle: 'right',
            target: linkedId,
            targetHandle: 'left',
            type: 'custom',
            data: {
              type: 'linked',
              onConvertEdge: handleConvertEdge,
            },
          });
        }
      });
    });

    setEdges(reactFlowEdges);
  };

  const handleNodeEdit = async (nodeId: string, updatedData: Partial<PlotNodeData>) => {
    if (!canvasData) return;

    const updatedNodes = canvasData.nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          name: updatedData.name || node.name,
          detail: updatedData.detail || node.detail,
          goal: updatedData.goal || node.goal,
          status: updatedData.status || node.status,
          linkedNodeIds: updatedData.linkedNodeIds || node.linkedNodeIds,
        };
      }
      return node;
    });

    const newCanvasData = { ...canvasData, nodes: updatedNodes };
    await onCanvasUpdate(newCanvasData);
    setEditingNode(null);
    loadNodesForCurrentView();
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
    if (!canvasData) return;

    const newNodeId = `node-${Date.now()}`;
    const newNode: CanvasNode = {
      id: newNodeId,
      type: nodeData.type || 'Chapter',
      name: nodeData.name || 'New Node',
      detail: nodeData.detail || '',
      goal: nodeData.goal || '',
      status: nodeData.status || 'Not Completed',
      timelineEventIds: [],
      parentId: currentViewNodeId,
      childIds: [],
      linkedNodeIds: [],
      position
    };

    const updatedNodes = [...canvasData.nodes, newNode];
    
    // Update parent's childIds if applicable
    if (currentViewNodeId) {
      const parentIndex = updatedNodes.findIndex(n => n.id === currentViewNodeId);
      if (parentIndex >= 0) {
        updatedNodes[parentIndex].childIds.push(newNodeId);
      }
    }

    const newCanvasData = { ...canvasData, nodes: updatedNodes };
    await onCanvasUpdate(newCanvasData);
    setShowQuickModal(false);
    loadNodesForCurrentView();
  };

  const handleAddChild = async (parentId: string) => {
    if (!canvasData) return;

    const newNodeId = `node-${Date.now()}`;
    const parentNode = canvasData.nodes.find(n => n.id === parentId);
    const childPosition = parentNode 
      ? { x: parentNode.position.x, y: parentNode.position.y + 200 }
      : { x: Math.random() * 400, y: Math.random() * 400 };

    const getChildType = (parentType: string): CanvasNode['type'] => {
      switch (parentType) {
        case 'Outline': return 'Act';
        case 'Act': return 'Chapter';
        case 'Chapter': return 'SceneBeats';
        default: return 'SceneBeats';
      }
    };

    const newNode: CanvasNode = {
      id: newNodeId,
      type: getChildType(parentNode?.type || 'Act'),
      name: 'New Node',
      detail: 'Details of the new node',
      goal: '',
      status: 'Not Completed',
      timelineEventIds: [],
      parentId: parentId,
      childIds: [],
      linkedNodeIds: [],
      position: childPosition
    };

    const updatedNodes = [...canvasData.nodes, newNode];
    
    // Update parent's childIds
    const parentIndex = updatedNodes.findIndex(n => n.id === parentId);
    if (parentIndex >= 0) {
      updatedNodes[parentIndex].childIds.push(newNodeId);
    }

    const newCanvasData = { ...canvasData, nodes: updatedNodes };
    await onCanvasUpdate(newCanvasData);
    loadNodesForCurrentView();
  };

  const handleConvertEdge = async (edgeId: string, action: string) => {
    if (action === 'delete') {
      const updatedEdges = edges.filter(edge => edge.id !== edgeId);
      setEdges(updatedEdges);
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
    }
  };

  const createReactFlowNode = (nodeData: CanvasNode): Node => {
    // Get linked characters and worlds for display
    const linkedCharacters = canvasData?.nodes.filter(n => 
      n.type === 'Character' && nodeData.linkedNodeIds.includes(n.id)
    ) || [];
    
    const linkedWorlds = canvasData?.nodes.filter(n => 
      ['WorldLocation', 'WorldObject'].includes(n.type) && nodeData.linkedNodeIds.includes(n.id)
    ) || [];

    return {
      id: nodeData.id,
      type: 'plotNode',
      position: nodeData.position || { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        id: nodeData.id,
        type: nodeData.type,
        name: nodeData.name,
        detail: nodeData.detail,
        goal: nodeData.goal,
        status: nodeData.status,
        parentId: nodeData.parentId,
        childIds: nodeData.childIds,
        linkedNodeIds: nodeData.linkedNodeIds,
        characters: linkedCharacters,
        worlds: linkedWorlds,
        onEdit: (nodeId: string) => {
          const nodeToEdit = canvasData?.nodes.find(n => n.id === nodeId);
          if (nodeToEdit) {
            setEditingNode(nodeToEdit);
          }
        },
        onAddChild: handleAddChild,
        onNavigateToEntity: (entityId: string) => {
          const entity = canvasData?.nodes.find(n => n.id === entityId);
          if (entity && ['Character', 'WorldLocation', 'WorldObject'].includes(entity.type)) {
            setCurrentViewNodeId(entityId);
            setCurrentViewType(entity.type);
          }
        },
      },
    };
  };

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    if (node.data.childIds && node.data.childIds.length > 0) {
      setCurrentViewNodeId(node.data.id);
      setCurrentViewType(node.data.type);
    }
  };

  const handleBackNavigation = () => {
    if (!canvasData || !currentViewNodeId) return;

    const currentNode = canvasData.nodes.find(n => n.id === currentViewNodeId);
    if (currentNode?.parentId) {
      setCurrentViewNodeId(currentNode.parentId);
      const parentNode = canvasData.nodes.find(n => n.id === currentNode.parentId);
      setCurrentViewType(parentNode?.type || 'Outline');
    } else {
      setCurrentViewNodeId(null);
      setCurrentViewType('Outline');
    }
  };

  const handleAddFirstNode = async () => {
    if (!canvasData) return;

    const newNodeId = `outline-${Date.now()}`;
    const newNode: CanvasNode = {
      id: newNodeId,
      type: 'Outline',
      name: 'Story Outline',
      detail: 'Main story outline',
      goal: 'Tell the complete story',
      status: 'Not Completed',
      timelineEventIds: [],
      parentId: null,
      childIds: [],
      linkedNodeIds: [],
      position: { x: 250, y: 250 }
    };

    const newCanvasData = { ...canvasData, nodes: [newNode] };
    await onCanvasUpdate(newCanvasData);
  };

  const getCurrentViewTitle = () => {
    if (!currentViewNodeId || !canvasData) return 'Story Outline';
    const currentNode = canvasData.nodes.find(n => n.id === currentViewNodeId);
    return currentNode ? `${currentNode.name} - Children` : 'Story Outline';
  };

  return (
    <div className="h-full w-full relative">
      {/* Navigation Header */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        {currentViewNodeId && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackNavigation}
            className="flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
        )}
        <div className="bg-background/80 backdrop-blur-sm rounded-md px-3 py-1 border">
          <span className="text-sm font-medium">{getCurrentViewTitle()}</span>
        </div>
      </div>

      {(!canvasData || canvasData.nodes.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/80">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-muted-foreground">No story structure yet</h3>
            <p className="text-sm text-muted-foreground">Start building your plot by adding your first outline</p>
            <Button onClick={handleAddFirstNode} className="flex items-center gap-2">
              <Plus size={16} />
              Add Story Outline
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
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-background"
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Meta', 'Ctrl']}
        connectionMode={ConnectionMode.Loose}
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
          node={{
            id: editingNode.id,
            type: editingNode.type,
            name: editingNode.name,
            detail: editingNode.detail,
            goal: editingNode.goal,
            status: editingNode.status,
            parentId: editingNode.parentId,
            childIds: editingNode.childIds,
            linkedNodeIds: editingNode.linkedNodeIds,
            characters: [],
            worlds: [],
            onEdit: () => {},
            onAddChild: () => {},
          }}
          onClose={() => setEditingNode(null)}
          onSave={handleNodeEdit}
          timelineEvents={canvasData?.timelineEvents || []}
          onTimelineEventsChange={() => {}}
          bookId={bookId}
          versionId={versionId}
        />
      )}
    </div>
  );
};

export default PlotCanvas;
