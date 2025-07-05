import React, { useState, useEffect, useCallback } from 'react';
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
import { PlotNodeData, CanvasNode, PlotCanvasData, TimelineEvent } from '@/types/plotCanvas';
import { Button } from '@/components/ui/button';
import { debounce } from 'lodash';
import { useReactFlow } from '@xyflow/react';
import { apiClient } from '@/lib/api';
import { QuickNodeModal } from '@/components/QuickNodeModal';
import WorldEntityNodeEditModal from '@/components/WorldArcs/WorldEntityNodeEditModal';

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

    const [connectFromNodeId, setConnectFromNodeId] = useState<string | null>(null);
    const [isCreatingEdge, setIsCreatingEdge] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingNode, setEditingNode] = useState<CanvasNode | null>(null);

  const reactFlowInstance = useReactFlow();
  const [plotCanvasData, setPlotCanvasData] = useState<PlotCanvasData>({ nodes: [], edges: [], timelineEvents: [], lastUpdated: '' });

  useEffect(() => {
    if (canvasData && canvasData.nodes) {
      loadNodesForCurrentView();
    }
    
  }, [canvasData, currentViewNodeId, currentViewType]);


    useEffect(() => {
      if (bookId && versionId) {
        fetchPlotCanvasData();
      }
    }, [bookId, versionId]);

    const fetchPlotCanvasData = async () => {
      if (!bookId || !versionId) return;
      
      try {
        const response = await apiClient.get(`/books/${bookId}/versions/${versionId}/plotCanvas`);
        if (response.data) {
          setPlotCanvasData(response.data);
          console.log('Fetched plot canvas data:', response.data);
        }
      } catch (error) {
        console.error('Failed to fetch plot canvas data:', error);
      }
    }  
  const loadNodesForCurrentView = () => {
    if (!canvasData) return;

    let nodesToShow: CanvasNode[] = [];
    console.log('Loading nodes for current view:', currentViewNodeId, currentViewType); 

    if (!currentViewNodeId) {
      // Show top-level nodes (world-location and world-object entities)
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

   const handleEditNode = (nodeId: string) => {
    console.log('Edit node:', nodeId);
    const node = canvasData?.nodes.find(n => n.id === nodeId);
    if (node && (node.type === 'WorldLocation' || node.type === 'WorldObject')) {
      setEditingNode(node);
      setShowEditModal(true);
    }
  };

  const handleNavigateToEntity = (entityId: string) => {
    console.log('Navigating to entity:', entityId);
    const entity = canvasData?.nodes.find(n => n.id === entityId);
    if (entity) {
      console.log('Setting current view to:', entityId, entity.type);
      setCurrentViewNodeId(entityId);
      setCurrentViewType(entity.type);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    console.log('Deleting node:', nodeId);
    if (!canvasData) return;

    const updatedNodes = canvasData.nodes.filter(node => node.id !== nodeId);
    const updatedEdges = canvasData.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId);

    const updatedCanvasData = { ...canvasData, nodes: updatedNodes, edges: updatedEdges };
    await onCanvasUpdate(updatedCanvasData);
  };

  const createReactFlowNode = (nodeData: CanvasNode): Node => {
    // Determine the correct node type based on entity type
    let nodeType = nodeData.type;
    if (nodeData.type === 'WorldLocation') {
      nodeType = 'WorldLocation';
    } else if (nodeData.type === 'WorldObject') {
      nodeType = 'WorldObject';
    }

    return {
      id: nodeData.id,
      type: 'plotNode',
      position: nodeData.position || { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        id: nodeData.id,
        type: nodeType,
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
        description: nodeData.description,
        customAttributes: nodeData.customAttributes,
        rulesAndBeliefs: nodeData.rulesAndBeliefs,
        history: nodeData.history,
        onEdit: handleEditNode,        
        onNavigateToEntity: handleNavigateToEntity,
        onDelete: handleDeleteNode,
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


  const handleNodeDragStop = async (event: any, node: Node) => {
      console.log('Node drag stopped:', node.id, 'at position:', node.position);
      if (!canvasData) return;
      if (!node.position) return;

      const updatedCanvasData = {
              ...canvasData,
              nodes: canvasData?.nodes.map(existingNode => {
                if (existingNode.id ===  node.id) {
                  return {
                    ...existingNode,
                   position: node.position,
                  };
                }
                return existingNode;
              }) || [],
            };
  
      console.log('Node drag stopped: Updating canvas data with new node position:', updatedCanvasData);
      await onCanvasUpdate(updatedCanvasData);
    };

   const onConnect = useCallback(
      (params: Connection) => {
        console.log('Connecting nodes:', params);
        const parentNodeId = params.source;
        const targetNodeId = params.target;
        if (canvasData) {

          setNodes(nds => {
              const updatedNodes = nds.map(node => {
                if (node.id === parentNodeId) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      linkedNodeIds: [...(Array.isArray(node.data.linkedNodeIds) ? node.data.linkedNodeIds : []), targetNodeId],
                    },
                  };
                }
                return node;
              });
              return updatedNodes;
            });

            const updatedCanvasData = {
              ...canvasData,
              nodes: canvasData?.nodes.map(node => {
                if (node.id === parentNodeId) {
                  return {
                    ...node,
                    linkedNodeIds: [...(node.linkedNodeIds || []), targetNodeId],
                  };
                }
                return node;
              }) || [],
            };

            onCanvasUpdate(updatedCanvasData);
            
          console.log('New Connection created between two ndoes:', parentNodeId, targetNodeId);
        }
      },
      [setEdges, canvasData, onCanvasUpdate]
    );

  const handleAddLinkedNode = (params: Connection) => {
    const parentNodeId = params.source;
    const currentNodeType = 'WorldLocation'; // Default to 'world-location' for now

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
    
    // Determine node type based on the selected type
    const nodeType = nodeData.type === 'WorldObject' ? 'WorldObject' : 'WorldLocation';

    const newNodeId = `${worldEntityId}-arc-${Date.now()}`;

    const newNode: CanvasNode = {
      id: newNodeId,
      type: nodeType,
      name: nodeData.name || 'New Node',
      detail: nodeData.detail || '',
      goal: nodeData.goal || '',
      status: 'Not Completed',
      parentId: parentNode?.id || null,
      childIds: [],
      linkedNodeIds: [],
      characters: [],
      worlds: [{ id: worldEntityId as string, name: nodeData.name || 'New Node', type: nodeType === 'WorldLocation' ? 'WorldLocation' : 'WorldObject' }],
      attributes:   parentNode?.data?.attributes || [],
      position,
      timelineEventIds: [],
      description: nodeData.description || '',
      customAttributes: nodeData.customAttributes || {},
      rulesAndBeliefs: nodeData.rulesAndBeliefs || [],
      history: nodeData.history || [],
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
      }) || [],
      
    };
    updatedCanvasData.nodes.push(newNode);

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

   const handleConnectStart = (event: any, params: { nodeId: string; handleType: string }) => {
    console.log('Connect start:', params, ' nodeId:', params.nodeId);
    setIsCreatingEdge(true);
    setConnectFromNodeId(params.nodeId); // Store source node ID
    console.log('Setting connectFromNodeId:', connectFromNodeId);
  };

  const handleConnectEnd = (event: any) => {
    console.log('Connect end:', event, 'connectFromNodeId:', connectFromNodeId);
      setShowQuickModal(true);
      setQuickModalPosition({ x: event.clientX, y: event.clientY });
      setIsCreatingEdge(false);
  };

  const handleNodeUpdate = async (updatedNode: CanvasNode) => {
      if (!canvasData) return;
  
      const updatedNodes = canvasData.nodes.map(node => 
        node.id === updatedNode.id ? updatedNode : node
      );
  
      const updatedCanvasData = { 
        ...canvasData, 
        nodes: updatedNodes,
        lastUpdated: new Date().toISOString()
      };
      
      await onCanvasUpdate(updatedCanvasData);
      
      // Update plot canvas if there are linked nodes
      if (updatedNode.linkedNodeIds && updatedNode.linkedNodeIds.length > 0) {
        await updatePlotCanvasLinks(updatedNode);
      }
    };
  
    const updatePlotCanvasLinks = async (characterNode: CanvasNode) => {
      if (!bookId || !versionId) return;
      
      try {
        // Update the plot canvas with character node links
        const updatedPlotCanvasData = {
          ...plotCanvasData,
          lastUpdated: new Date().toISOString()
        };
        
        await apiClient.patch(`/books/${bookId}/versions/${versionId}/plotCanvas`, updatedPlotCanvasData);
        console.log('Plot canvas updated with character links');
      } catch (error) {
        console.error('Failed to update plot canvas:', error);
      }
    };

    
      const handleCreateTimelineEvent = async (eventData: Partial<TimelineEvent>) => {
        if (!canvasData) return;
    
        const newEvent: TimelineEvent = {
          id: `timeline_${Date.now()}`,
          name: eventData.name || '',
          date: eventData.date || '',
          description: eventData.description || '',
          type: eventData.type || 'character',
          linkedNodeIds: []
        };
    
        const updatedCanvasData = {
          ...canvasData,
          timelineEvents: [...canvasData.timelineEvents, newEvent],
          lastUpdated: new Date().toISOString()
        };
    
        await onCanvasUpdate(updatedCanvasData);
        return newEvent.id;
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
        onConnect={onConnect}
        onPaneClick={handlePaneClick}
        onConnectStart={handleConnectStart}
        onConnectEnd={handleConnectEnd}
        onNodeDragStop={handleNodeDragStop}
        style={{ height: '100%', width: '100%' }}
      >
        <Controls
          showZoom={true}
          showFitView={true}
          showInteractive={true}
          style={{ position: 'absolute', bottom: '20%', left: '1rem', zIndex: 10 }}
        />
        <Background color="#aaa" gap={16} />
      </ReactFlow>

            {showQuickModal && quickModalPosition && (
        <QuickNodeModal
          isOpen={showQuickModal}
          onClose={() => setShowQuickModal(false)}
          onSave={(nodeData, position) => handleQuickNodeSave(nodeData, position, connectFromNodeId || '')}
          position={{ x: 0, y: 0 }}
        />
            )}
      <WorldEntityNodeEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingNode(null);
        }}
        onSave={(updatedNode) => {
          const updatedNodes = canvasData?.nodes.map(node => 
            node.id === updatedNode.id ? updatedNode : node
          );

          const updatedCanvasData = {
            ...canvasData,
            nodes: updatedNodes || [],
          };

          onCanvasUpdate(updatedCanvasData);
        }}
        node={editingNode}
      />
    </div>
  );
};

export default WorldEntityArcCanvas;
