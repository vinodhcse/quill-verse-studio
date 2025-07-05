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
import { useReactFlow } from '@xyflow/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { consolidateTrackChanges } from '@/utils/trackChangesUtils';



const nodeTypes = { plotNode: PlotNode };
const edgeTypes = {
  custom: DeletableEdge,
};

interface PlotCanvasProps {
  bookId: string | undefined;
  versionId: string | undefined;
  canvasData: PlotCanvasData | null;
  onCanvasUpdate: (data: any) => void;
  onNodeDragStop?: (event: any, node: Node) => void; // Added optional onNodeDragStop handler
}

const PlotCanvas: React.FC<PlotCanvasProps> = ({
  bookId,
  versionId,
  canvasData,
  onCanvasUpdate,
  onNodeDragStop,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickModalPosition, setQuickModalPosition] = useState({ x: 0, y: 0 });
  const [editingNode, setEditingNode] = useState<CanvasNode | null>(null);
  const [currentViewNodeId, setCurrentViewNodeId] = useState<string | null>(null);
  const [currentViewType, setCurrentViewType] = useState<string>('Outline');
  const [quickModalSourceNodeId, setQuickModalSourceNodeId] = useState<string | null>(null);
  const [isCreatingEdge, setIsCreatingEdge] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const reactFlowInstance = useReactFlow();


  
  useEffect(() => {
    console.log('Current view node ID changed:', currentViewNodeId);
    setIsInitialLoad(true);
  }, [currentViewNodeId]);

  useEffect(() => {
    
    if (canvasData && canvasData.nodes) {
      loadNodesForCurrentView(isInitialLoad);
    }
  }, [canvasData, currentViewNodeId, currentViewType, isInitialLoad]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const nodeId = queryParams.get('nodeId');
    if (nodeId) {
      console.log('Loading node from query parameter:', nodeId);
      setCurrentViewNodeId(nodeId);
      setIsInitialLoad(true);
    }
  }, [location.search]);

  const loadNodesForCurrentView = (initialLoad: boolean) => {
    if (!canvasData) return;
    console.log('Loading nodes for current view:', currentViewNodeId, currentViewType);
    let nodesToShow: CanvasNode[] = [];
    
    if (!currentViewNodeId) {
      // Show top-level nodes (Outline and Characters/World entities)
      nodesToShow = canvasData.nodes?.filter(node => 
        node.type === 'Outline'
      );
      console.log('Top-level nodes:', nodesToShow);
    } else {
      // Show children and linked nodes of the selected node
      const selectedNode = canvasData.nodes?.find(n => n.id === currentViewNodeId);
      if (selectedNode) {
        console.log('Selected node:', selectedNode);
        // Always include the current node
        nodesToShow.push(selectedNode);
        
        // Add all child nodes
        const childNodes = canvasData.nodes?.filter(node => 
          selectedNode.childIds.includes(node.id)
        );
        nodesToShow.push(...childNodes);
        
        // Add all linked nodes (including characters and world entities)
        const linkedNodes = canvasData.nodes?.filter(node => 
          selectedNode.linkedNodeIds.includes(node.id)
        );
        nodesToShow.push(...linkedNodes);
      }
    }
    console.log('Nodes to show:', nodesToShow);

    const reactFlowNodes: Node[] = nodesToShow?.map(nodeData => createReactFlowNode(nodeData));
    setNodes(reactFlowNodes);

    // Create edges for parent-child and linked relationships
    const reactFlowEdges: Edge[] = [];
    
    nodesToShow?.forEach(node => {
      // Parent-child edges (from bottom handle to top handle)
      node.childIds.forEach(childId => {
        if (nodesToShow?.find(n => n.id === childId)) {
          reactFlowEdges.push({
            id: `parent-child-${node.id}-${childId}`,
            source: node.id,
            sourceHandle: 'bottom',
            target: childId,
            targetHandle: 'top',
            type: 'custom',
            animated: false,
            style: { stroke: '#6366f1', strokeWidth: 2 },
            data: {
              type: 'parent-child',
              onConvertEdge: handleConvertEdge,
            },
          });
        }
      });

      // Linked edges (from side handles) - these are for related/associated entities
      node.linkedNodeIds.forEach(linkedId => {
        if (nodesToShow?.find(n => n.id === linkedId)) {
          reactFlowEdges.push({
            id: `linked-${node.id}-${linkedId}`,
            source: node.id,
            sourceHandle: 'right',
            target: linkedId,
            targetHandle: 'left',
            type: 'custom',
            animated: true,
            style: { stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5,5' },
            data: {
              type: 'linked',
              onConvertEdge: handleConvertEdge,
            },
          });
        }
      });
    });

    setEdges(reactFlowEdges);
    console.log('fitting view for initial load', initialLoad)
    // Focus the viewport only on initial load
    if (initialLoad) {
      const nodePositions = reactFlowNodes.map(node => node.position);
      if (nodePositions.length > 0) {
        const xPositions = nodePositions.map(pos => pos.x);
        const yPositions = nodePositions.map(pos => pos.y);

        const minX = Math.min(...xPositions);
        const maxX = Math.max(...xPositions);
        const minY = Math.min(...yPositions);
        const maxY = Math.max(...yPositions);

        const viewportCenter = {
          x: (minX + maxX) / 2,
          y: (minY + maxY) / 2,
        };

        const viewportZoom = Math.min(
          window.innerWidth / (maxX - minX + 200),
          window.innerHeight / (maxY - minY + 200)
        );
        console.log('Fitting view to nodes:', viewportCenter, viewportZoom);
        reactFlowInstance.fitView({ padding: 0.1 });
      }
      setIsInitialLoad(false);
    }
    
  };

  const handleNodeEdit = async (nodeId: string, updatedData: Partial<PlotNodeData>) => {
    if (!canvasData) return;

    const updatedNodes = canvasData.nodes?.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          name: updatedData.name || node.name,
          detail: updatedData.detail || node.detail,
          goal: updatedData.goal || node.goal,
          status: updatedData.status || node.status,
          linkedNodeIds: updatedData.linkedNodeIds || node.linkedNodeIds,
          characters: updatedData.characters || node.characters,
          worlds: updatedData.worlds || node.worlds
        };
      }
      return node;
    });

    const newCanvasData = { ...canvasData, nodes: updatedNodes };
    await onCanvasUpdate(newCanvasData);
    setEditingNode(null);
    loadNodesForCurrentView(isInitialLoad);
  };

  const onConnect = useCallback(
    (params: Connection) => {
      console.log('Connecting nodes:', params);
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

      if (canvasData) {
        const updatedEdges = [...(canvasData.edges || []), {
          id: `edge-${params.source}-${params.target}`,
          source: params.source!,
          target: params.target!,
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'custom'
        }];
        
        const updatedNodes = canvasData.nodes.map(node => {
          if (node.id === params.source) {
            return { ...node, linkedNodeIds: [...node.linkedNodeIds, params.target!] };
          }
          return node;
        });
        console.log('Updated nodes after connection:', updatedNodes);
        const updatedCanvasData = { ...canvasData, edges: updatedEdges, nodes: updatedNodes };
        onCanvasUpdate(updatedCanvasData);
      }
    },
    [setEdges]
  );

  const handleConnectStart = (event: any, params: { nodeId: string; handleType: string }) => {
    console.log('Connect start:', params);
    setIsCreatingEdge(true);
    setQuickModalSourceNodeId(params.nodeId); // Store source node ID
  };

  const handleConnectEnd = (event: any) => {
    console.log('Connect end:', event);
    setIsCreatingEdge(false);
  };

  const handlePaneClick = (event: any) => {
    console.log('Pane clicked:', event);
    if (isCreatingEdge) return; // Prevent pane click during edge creation

    const bounds = event.currentTarget.getBoundingClientRect();
    setQuickModalPosition({ 
      x: event.clientX - bounds.left, 
      y: event.clientY - bounds.top 
    });
    setShowQuickModal(true);
  };

  const handleQuickNodeSave = async (nodeData: any, position: { x: number; y: number }) => {
    if (!canvasData || !quickModalSourceNodeId) return; // Ensure sourceNodeId is available
    console.log('Saving quick node:', nodeData, position, quickModalSourceNodeId);

    const newNodeId = `node-${Date.now()}`;
    const newNode: CanvasNode = {
      id: newNodeId,
      type: nodeData.type || 'Chapter',
      name: nodeData.name || 'New Node',
      detail: nodeData.detail || '',
      goal: nodeData.goal || '',
      status: nodeData.status || 'Not Completed',
      timelineEventIds: [],
      parentId: quickModalSourceNodeId, // Link to sourceNodeId
      childIds: [],
      linkedNodeIds: [],
      position,
    };

    let updatedNodes = [...canvasData.nodes || []];
    updatedNodes.push(newNode);

    // Update parent's linkedNodeIds
    const parentIndex = updatedNodes.findIndex(n => n.id === quickModalSourceNodeId);
    if (parentIndex >= 0) {
      if (!updatedNodes[parentIndex].linkedNodeIds) {
        updatedNodes[parentIndex].linkedNodeIds = []; // Initialize if not present
      }  
      updatedNodes[parentIndex].linkedNodeIds?.push(newNodeId);
    }

    const newCanvasData = { ...canvasData, nodes: updatedNodes };
    console.log('New canvas data:', newCanvasData);
    const updateRes = await onCanvasUpdate(newCanvasData);
    console.log('Updated canvas data:', updateRes);
    setShowQuickModal(false);
    setQuickModalSourceNodeId(null); // Reset sourceNodeId
    loadNodesForCurrentView(isInitialLoad);
  };

  const handleAddChild = async (parentId: string) => {
    if (!canvasData) return;

    const newNodeId = `node-${Date.now()}`;
    const parentNode = canvasData.nodes.find(n => n.id === parentId);
    console.log('Adding child node to parent:', parentId, 'Parent node childs:', parentNode.childIds?.length);
    // Determine position for the new child node
    const lastChildId = parentNode?.childIds[parentNode.childIds.length - 1];
    console.log('Adding child node to parent: Last child ID:', lastChildId);
    const lastChildNode = canvasData.nodes.find(n => n.id === lastChildId);
    console.log('Adding child node to parent:', parentId, 'Last child:', lastChildNode, 'parnetNode:', parentNode);
    const childPosition = lastChildNode
      ? { x: lastChildNode.position.x + 200, y: lastChildNode.position.y } // Adjacent to last child
      : parentNode
        ? { x: parentNode.position.x, y: parentNode.position.y + 200 } // Below parent if no children
        : { x: Math.random() * 400, y: Math.random() * 400 }; // Fallback position
    console.log('Adding child node at position:', childPosition);
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

    // Create a blinking edge to highlight the new connection
    const newEdge: Edge = {
      id: `parent-child-${parentId}-${newNodeId}`,
      source: parentId,
      sourceHandle: 'bottom',
      target: newNodeId,
      targetHandle: 'top',
      type: 'custom',
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5,5' },
      data: {
        type: 'parent-child',
        onConvertEdge: handleConvertEdge,
      },
    };

    setEdges(prevEdges => [...prevEdges, newEdge]);


    loadNodesForCurrentView(isInitialLoad);
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

  const handleNavigateToEntity = (entityId: string) => {
    console.log('Navigating to entity:', entityId);
    const entity = canvasData?.nodes.find(n => n.id === entityId);
    if (entity) {
      console.log('Setting current view to:', entityId, entity.type);
      setCurrentViewNodeId(entityId);
      setCurrentViewType(entity.type);

      // Update the URL with the nodeId
      navigate(`?boards=plot-arcs&tab=plot-outline&nodeId=${entityId}`);
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
        characters: nodeData.characters || [],
        worlds: nodeData.worlds || [],
        onEdit: (nodeId: string) => {
          const nodeToEdit = canvasData?.nodes.find(n => n.id === nodeId);
          if (nodeToEdit) {
            setEditingNode(nodeToEdit);
          }
        },
        onAddChild: handleAddChild,
        onNavigateToEntity: handleNavigateToEntity,
        onDelete: handleDeleteNode,
      },
    };
  };

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node);
    const nodeData = node.data;
    setCurrentViewNodeId(nodeData.id as string);
    setCurrentViewType(nodeData.type as string);
     // Update the URL with the nodeId
    navigate(`?boards=plot-arcs&tab=plot-outline&nodeId=${nodeData.id}`);
  };

  const handleBackNavigation = () => {
    if (!canvasData || !currentViewNodeId) return;

    const currentNode = canvasData.nodes?.find(n => n.id === currentViewNodeId);
    if (currentNode?.parentId) {
      setCurrentViewNodeId(currentNode.parentId);
      const parentNode = canvasData.nodes?.find(n => n.id === currentNode.parentId);
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
    console.log('Adding first node:', newCanvasData, onCanvasUpdate);
    const updateRes = await onCanvasUpdate(newCanvasData);
    console.log('Updated first node:', updateRes);
  };

  const getCurrentViewTitle = () => {
    if (!currentViewNodeId || !canvasData) return 'Story Outline';
    const currentNode = canvasData.nodes?.find(n => n.id === currentViewNodeId);
    return currentNode ? `${currentNode.name} - Arc` : 'Story Outline';
  };

  const handleEdgeMouseLeave = (event: any, edge: Edge) => {
    console.log('Edge mouse leave:', edge);
    if (!edge.source || edge.target) return; // Only trigger for new edges
    
    //event.preventDefault();
    const sourceNodeId = edge.source;
    setQuickModalSourceNodeId(sourceNodeId); // Store sourceNodeId
    setShowQuickModal(true);
    setQuickModalPosition({ x: event.clientX, y: event.clientY });
    setIsCreatingEdge(false); // Reset edge creation state
  };
  
  const handleEdgeMouseEnter = () => {
    console.log('Edge mouse enter');
    setIsCreatingEdge(true); // Set edge creation state
  };

  const handleDeleteNode = async (nodeId: string) => {
    console.log('Deleting node:', nodeId);
    if (!canvasData) return;

    // Helper function to recursively collect all child nodes for deletion
    const collectChildNodes = (nodeId: string, nodes: CanvasNode[]): string[] => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return [];

      let childIds = [...node.childIds];
      node.childIds.forEach(childId => {
        childIds = [...childIds, ...collectChildNodes(childId, nodes)];
      });

      return childIds;
    };

    // Collect all nodes to delete (including descendants)
    const allNodesToDelete = [nodeId, ...collectChildNodes(nodeId, canvasData.nodes)];
    console.log('Nodes to delete:', allNodesToDelete);

    // Remove the nodes from the canvas
    const updatedNodes = canvasData.nodes.filter(node => !allNodesToDelete.includes(node.id));

    // Remove references to the deleted nodes from other nodes
    const cleanedNodes = updatedNodes.map(node => {
      return {
        ...node,
        childIds: node.childIds.filter(childId => !allNodesToDelete.includes(childId)),
        linkedNodeIds: node.linkedNodeIds.filter(linkedId => !allNodesToDelete.includes(linkedId)),
      };
    });

    // Remove edges connected to the deleted nodes
    const updatedEdges = (canvasData.edges || []).filter(edge => 
      !allNodesToDelete.includes(edge.source) && !allNodesToDelete.includes(edge.target)
    );

    const updatedCanvasData = { ...canvasData, nodes: cleanedNodes, edges: updatedEdges };
    await onCanvasUpdate(updatedCanvasData);
  };

  console.log('Initial Canvas data2', canvasData, canvasData?.nodes);
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

      {(!canvasData || !canvasData.nodes || canvasData.nodes?.length === 0) && (
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
        onConnectStart={handleConnectStart} // Added handler
        onConnectEnd={handleConnectEnd} // Added handler
        onPaneClick={handlePaneClick}
        onNodeClick={handleNodeClick}
        onEdgeMouseEnter={handleEdgeMouseEnter} // Added handler
        onEdgeMouseLeave={handleEdgeMouseLeave}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-background"
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Meta', 'Ctrl']}
        connectionMode={ConnectionMode.Loose}
        onNodeDragStop={onNodeDragStop}
        
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