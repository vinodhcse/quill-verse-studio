import React, { useState, useEffect } from 'react';
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
import WorldEntityArcPlotNode from './WorldEntityArcPlotNode';
import DeletableEdge from '@/components/DeletableEdge';
import { PlotNodeData, CanvasNode, PlotCanvasData } from '@/types/plotCanvas';
import { Button } from '@/components/ui/button';
import { debounce } from 'lodash';
import { useReactFlow } from '@xyflow/react';
import { apiClient } from '@/lib/api';
import { QuickNodeModal } from '@/components/QuickNodeModal';

const nodeTypes = { plotNode: WorldEntityArcPlotNode };
const edgeTypes = {
  custom: DeletableEdge,
};

interface WorldEntityArcCanvasProps {
  bookId: string | undefined;
  versionId: string | undefined;
  worldEntityId: string | null;
  canvasData: PlotCanvasData | null;
  onCanvasUpdate: (data: any) => void;
}

const WorldEntityArcCanvas: React.FC<WorldEntityArcCanvasProps> = ({
  bookId,
  versionId,
  worldEntityId,
  canvasData,
  onCanvasUpdate,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [currentViewNodeId, setCurrentViewNodeId] = useState<string | null>(null);
  const [currentViewType, setCurrentViewType] = useState<string>('WorldEntityArcs');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickModalPosition, setQuickModalPosition] = useState<{ x: number; y: number } | null>(null);

  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    if (canvasData && canvasData.nodes) {
      loadNodesForCurrentView();
    }
  }, [canvasData, currentViewNodeId, currentViewType]);

  const loadNodesForCurrentView = () => {
    if (!canvasData) return;

    let nodesToShow: CanvasNode[] = [];
    console.log('Loading nodes for current view:', currentViewNodeId, currentViewType); 

    if (!currentViewNodeId) {
      // Show top-level nodes (WorldLocation and WorldObject entities)
      nodesToShow = canvasData.nodes.filter(node => 
        node.type === 'WorldLocation' || node.type === 'WorldObject' || 
        (node.parentId === null && ['WorldLocation', 'WorldObject'].includes(node.type))
      );
    } else {
      // Show children and linked nodes of the selected node
      const selectedNode = canvasData.nodes.find(n => n.id === currentViewNodeId);
      if (selectedNode) {
        // Always include the current node
        nodesToShow.push(selectedNode);

        // Add all child nodes
        const childNodes = canvasData.nodes.filter(node => 
          selectedNode.childIds.includes(node.id)
        );
        nodesToShow.push(...childNodes);

        // Add all linked nodes
        const linkedNodes = canvasData.nodes.filter(node => 
          selectedNode.linkedNodeIds.includes(node.id)
        );
        nodesToShow.push(...linkedNodes);
      }
    }

    const reactFlowNodes: Node[] = nodesToShow.map(nodeData => {
      const parentNode = canvasData.nodes.find(n => n.id === nodeData.parentId);
      return createReactFlowNode({ ...nodeData, position: autoPositionNode(nodeData, parentNode) });
    });
    setNodes(reactFlowNodes);

    // Create edges for parent-child and linked relationships
    const reactFlowEdges: Edge[] = [];

    nodesToShow.forEach(node => {
      // Parent-child edges
      node.childIds.forEach(childId => {
        if (nodesToShow.find(n => n.id === childId)) {
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
              onConvertEdge: (edgeId: string, action: string) => handleConvertEdge(edgeId, action, reactFlowEdges),
            },
          });
        }
      });

      // Linked edges
      node.linkedNodeIds.forEach(linkedId => {
        if (nodesToShow.find(n => n.id === linkedId)) {
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
              onConvertEdge: (edgeId: string, action: string) => handleConvertEdge(edgeId, action, reactFlowEdges),
            },
          });
        }
      });
    });

    setEdges(reactFlowEdges);
    console.log('Fitting nodes in view:', reactFlowInstance);
    const fitViewvar = reactFlowInstance.fitView();
    console.log('FitView result:', fitViewvar);

    // Focus the viewport only on initial load
    if (isInitialLoad) {
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

        reactFlowInstance.fitView({ padding: 0.1 });
      }
      setIsInitialLoad(false);
    }
  };

  const fetchWorldEntityDetails = async (arcId: string) => {
    const worldEntityId = arcId.split('-arc-')[0];

    try {
      const response = await apiClient.get(`/books/${bookId}/versions/${versionId}/world`);
      const worldData = response.data || { world: { locations: [], objects: [] } };
      
      // Find the world entity in locations or objects
      const allWorldEntities = [
        ...worldData.world.locations.map((loc: any) => ({ ...loc, entityType: 'WorldLocation' })),
        ...worldData.world.objects.map((obj: any) => ({ ...obj, entityType: 'WorldObject' }))
      ];
      
      return allWorldEntities.find(entity => entity.id === worldEntityId);
    } catch (error) {
      console.error('Failed to fetch world entity details:', error);
      return null;
    }
  };

  const createReactFlowNode = (nodeData: CanvasNode): Node => {
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
        timelineEventIds: [],
        onFetchWorldEntityDetails: fetchWorldEntityDetails,
      },
    };
  };

  const autoPositionNode = (node: CanvasNode, parentNode?: CanvasNode): { x: number; y: number } => {
    if (node.position) return node.position;

    if (parentNode) {
      return {
        x: parentNode.position.x + 200,
        y: parentNode.position.y + 200,
      };
    }

    return { x: Math.random() * 400, y: Math.random() * 400 };
  };

  const handleAddLinkedNode = (params: Connection) => {
    const parentNodeId = params.source;
    const currentNodeType = 'WorldLocation'; // Default to 'WorldLocation' for now

    console.log('Adding linked node:', parentNodeId);

    const newNodeId = `${parentNodeId}-linked-${Date.now()}`;
    const newNode: CanvasNode = {
      id: newNodeId,
      type: currentNodeType,
      name: `New ${currentNodeType} Node`,
      detail: '',
      goal: '',
      status: 'Not Completed',
      parentId: parentNodeId,
      childIds: [],
      linkedNodeIds: [],
      characters: [],
      worlds: [],
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      timelineEventIds: [],
    };

    setNodes(nds => {
      const updatedNodes = nds.map(node => {
        if (node.id === parentNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              linkedNodeIds: [...(Array.isArray(node.data.linkedNodeIds) ? node.data.linkedNodeIds : []), newNodeId],
            },
          };
        }
        return node;
      });
      return updatedNodes.concat(createReactFlowNode(newNode));
    });

    const updatedCanvasData = {
      ...canvasData,
      nodes: canvasData?.nodes.map(node => {
        if (node.id === parentNodeId) {
          return {
            ...node,
            linkedNodeIds: [...(node.linkedNodeIds || []), newNodeId],
          };
        }
        return node;
      }) || [],
    };

    onCanvasUpdate(updatedCanvasData);
    console.log('Linked node added:', newNode);
  };

  const handlePaneClick = (event: any) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setQuickModalPosition({ 
      x: event.clientX - bounds.left, 
      y: event.clientY - bounds.top 
    });
    setShowQuickModal(true);
  };

  const handleQuickNodeSave = async (nodeData: any, position: { x: number; y: number }, sourceNodeId: string) => {
    console.log('Saving quick node:', nodeData, position, sourceNodeId);

    const parentNode = nodes.find(node => node.id === sourceNodeId);
    const worldEntityId = parentNode?.data?.id || canvasData?.nodes.find(node => node.type === 'WorldLocation' || node.type === 'WorldObject')?.id || 'fallback-world-entity-id';

    const newNodeId = `${worldEntityId}-arc-${Date.now()}`;

    const newNode: CanvasNode = {
      id: newNodeId,
      type: nodeData.type || 'WorldLocation',
      name: nodeData.name || 'New Node',
      detail: nodeData.detail || '',
      goal: nodeData.goal || '',
      status: 'Not Completed',
      parentId: parentNode?.id || null,
      childIds: [],
      linkedNodeIds: [],
      characters: [],
      worlds: [{ id: worldEntityId as string, name: nodeData.name || 'New Node', type: nodeData.type || 'WorldLocation' }],
      position,
      timelineEventIds: [],
    };

    setNodes(nds => {
      const updatedNodes = nds.map(node => {
        if (node.id === parentNode?.id) {
          return {
            ...node,
            data: {
              ...node.data,
              linkedNodeIds: [...(Array.isArray(node.data.linkedNodeIds) ? node.data.linkedNodeIds : []), newNodeId],
            },
          };
        }
        return node;
      });
      return updatedNodes.concat(createReactFlowNode(newNode));
    });

    const updatedCanvasData = {
      ...canvasData,
      nodes: canvasData?.nodes.map(node => {
        if (node.id === parentNode?.id) {
          return {
            ...node,
            linkedNodeIds: [...(node.linkedNodeIds || []), newNodeId],
          };
        }
        return node;
      }).concat({
        ...newNode,
        linkedNodeIds: [],
      }) || [],
    };

    onCanvasUpdate(updatedCanvasData);
    setShowQuickModal(false);
  };

  const handleConvertEdge = async (edgeId: string, action: string, edges: Edge[]) => {
    const edgeToUpdate = edges.find(edge => edge.id === edgeId);
    if (!edgeToUpdate || !canvasData) return;

    const { source, target, data } = edgeToUpdate;

    if (action === 'delete') {
        const updatedEdges = edges.filter(edge => edge.id !== edgeId);
        setEdges(updatedEdges);

        const updatedNodes = canvasData.nodes.map(node => {
            if (node.id === source) {
                if (data.type === 'parent-child') {
                    return {
                        ...node,
                        childIds: node.childIds.filter(id => id !== target),
                    };
                } else if (data.type === 'linked') {
                    return {
                        ...node,
                        linkedNodeIds: node.linkedNodeIds.filter(id => id !== target),
                    };
                }
            } else if (node.id === target) {
                if (data.type === 'parent-child') {
                    return {
                        ...node,
                        parentId: null,
                    };
                } else if (data.type === 'linked') {
                    return node;
                }
            }
            return node;
        });

        canvasData.nodes = updatedNodes;
        await onCanvasUpdate(canvasData);
        loadNodesForCurrentView();
        console.log('Updated canvasData after edge deletion:', canvasData);
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

        const updatedNodes = canvasData.nodes.map(node => {
            if (node.id === source) {
                if (action === 'parent-child') {
                    return {
                        ...node,
                        childIds: [...node.childIds, target],
                        linkedNodeIds: node.linkedNodeIds.filter(id => id !== target),
                    };
                } else if (action === 'linked') {
                    return {
                        ...node,
                        linkedNodeIds: [...node.linkedNodeIds, target],
                        childIds: node.childIds.filter(id => id !== target),
                    };
                }
            } else if (node.id === target) {
                if (action === 'parent-child') {
                    return {
                        ...node,
                        parentId: source,
                      };
                } else if (action === 'linked') {
                    return node;
                }
            }
            return node;
        });

        canvasData.nodes = updatedNodes;
        await onCanvasUpdate(canvasData);
        loadNodesForCurrentView();
        console.log('Updated canvasData after edge conversion:', canvasData);
    }
  };

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        onConnect={handleAddLinkedNode}
        onPaneClick={handlePaneClick}
        proOptions={{ hideAttribution: true }}
      >
        <Controls />
        <Background color="#aaa" gap={16} />
      </ReactFlow>

      {showQuickModal && quickModalPosition && (
        <QuickNodeModal
          isOpen={showQuickModal}
          onClose={() => setShowQuickModal(false)}
          onSave={(nodeData, position) => handleQuickNodeSave(nodeData, position, currentViewNodeId || '')}
          position={{ x: 0, y: 0 }}
        />
      )}
    </div>
  );
};

export default WorldEntityArcCanvas;
