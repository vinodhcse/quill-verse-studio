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
import { debounce } from 'lodash';
import { useReactFlow } from '@xyflow/react';
import { apiClient } from '@/lib/api';
import { on } from 'events';

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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [characterArcs, setCharacterArcs] = useState([]);

  const reactFlowInstance = useReactFlow();

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
            // Always include the current node
            nodesToShow.push(selectedNode);

            // Add all child nodes
            const childNodes = canvasData.nodes.filter(node => 
                selectedNode.childIds.includes(node.id)
            );
            nodesToShow.push(...childNodes);

            // Add all linked nodes (including characters and world entities)
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
        // Parent-child edges (from bottom handle to top handle)
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

        // Linked edges (from side handles) - these are for related/associated entities
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

  const handleNodeEdit = async (nodeId: string, updatedData: Partial<PlotNodeData>) => {
    if (!canvasData) return;
    console.log('Updating node:', nodeId, 'with data:', updatedData);
    const updatedNodes = canvasData.nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          name: updatedData.name || node.name,
          detail: updatedData.detail || node.detail,
          goal: updatedData.goal || node.goal,
          status: updatedData.status || node.status,
          linkedNodeIds: updatedData.linkedNodeIds || node.linkedNodeIds,
          characters: updatedData.characters || node.characters,
          worlds: updatedData.worlds || node.worlds,
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
          onConvertEdge: (edgeId: string, action: string) => handleConvertEdge(edgeId, action, edges),
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));

      // Update linkedNodeIds in canvasData only for the source node
      if (canvasData) {
        const updatedNodes = canvasData.nodes.map(node => {
          if (node.id === params.source) {
            return {
              ...node,
              linkedNodeIds: [...node.linkedNodeIds, params.target],
            };
          }
          return node;
        });

        canvasData.nodes = updatedNodes;
        debouncedUpdateCanvas(canvasData);
      }

      // Dynamically set currentViewNodeId based on the source node
      setCurrentViewNodeId(params.source);
    },
    [setEdges, edges, canvasData]
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

  const handleConvertEdge = async (edgeId: string, action: string, edges: Edge[]) => {
    const edgeToUpdate = edges.find(edge => edge.id === edgeId);
    if (!edgeToUpdate || !canvasData) return;

    const { source, target, data } = edgeToUpdate;

    if (action === 'delete') {
        const updatedEdges = edges.filter(edge => edge.id !== edgeId);
        setEdges(updatedEdges);

        // Update JSON data to remove links
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
                    return node; // No changes needed for target in linked type
                }
            }
            return node;
        });

        canvasData.nodes = updatedNodes;
        await onCanvasUpdate(canvasData); // Immediate backend update
        loadNodesForCurrentView(); // Rerender nodes
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

        // Update JSON data to reflect edge type change
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
                    return {
                        ...node,
                        parentId: null,
                    };
                }
            }
            return node;
        });

        canvasData.nodes = updatedNodes;
        await onCanvasUpdate(canvasData); // Immediate backend update
        loadNodesForCurrentView(); // Rerender nodes
        console.log('Updated canvasData after edge type switch:', canvasData);
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
    if (!canvasData) return;

    const nodeToDelete = canvasData.nodes.find(node => node.id === nodeId);
    if (!nodeToDelete) return;

    // Update related nodes
    const updatedNodes = canvasData.nodes.map(node => {
      if (node.childIds.includes(nodeId)) {
        return {
          ...node,
          childIds: node.childIds.filter(id => id !== nodeId),
        };
      } else if (node.linkedNodeIds.includes(nodeId)) {
        return {
          ...node,
          linkedNodeIds: node.linkedNodeIds.filter(id => id !== nodeId),
        };
      } else if (node.id === nodeToDelete.parentId) {
        return {
          ...node,
          childIds: node.childIds.filter(id => id !== nodeId),
        };
      }
      return node;
    }).filter(node => node.id !== nodeId); // Remove the deleted node

    const newCanvasData = { ...canvasData, nodes: updatedNodes };
    await onCanvasUpdate(newCanvasData); // Immediate backend update
    loadNodesForCurrentView();
  };

  
const fetchCharacterDetails = async (arcId: string) => {
    const characterId = arcId.split('-arc-')[0]; // Extract character ID from arc ID
    // Get bookId and versionId from PlotCanvas data

    try {
      const response = await apiClient.get(`/books/${bookId}/versions/${versionId}/characters/${characterId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch character details:', error);
      return null;
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
        onCharacterOrWorldClick: handleCharacterOrWorldClick, // Pass the function here
        onFetchCharacterDetails: fetchCharacterDetails,
        onAddLinkedNode: handleAddLinkedNode
      },
    };
  };

  
  // Add logic to create linked node with specific ID pattern
  const handleAddLinkedNode = (parentNodeId: string) => {
    const characterId = parentNodeId.split('-arc-')[0]; // Extract character ID from arc ID
    console.log('Adding linked node for character:', characterId);

    fetchCharacterDetails(characterId).then(characterDetails => {
      if (!characterDetails) {
        console.error('No character details found for ID:', characterId);
        return;
      }
      console.log('Character details:', characterDetails);
      const newNodeId = `${characterId}-arc-${Date.now()}`;

      
      const newNode: CanvasNode = {
        id: newNodeId,
        type: 'Character',
        position: { x: 0, y: 0 },
        name: `${characterDetails?.arc?.length + 1} Arc change for ${characterId}`,
        detail: 'Details of the new arc node',
        status: 'Not Completed',
        timelineEventIds: [],
        childIds: [],
        linkedNodeIds: [],
        characters: [],
        
      };

        // Update the existing arc node to link to the new node
      const updatedArcs = characterDetails.arc.map(arc => {
        if (arc.id === parentNodeId) {
          return {
            ...arc,
            linkedNodeIds: [...arc.linkedNodeIds, newNodeId],
          };
        }
        return arc;
      });

      if (updatedArcs) {
        updatedArcs.push(newNode); // Add the new node to the arc
      }

      // Save the new node using the character API
      apiClient.patch(`/books/${bookId}/versions/${versionId}/characters/${characterId}`, {
        arc: updatedArcs,
      }).then(() => {
        console.log('Character arc saved successfully');

        // Trigger modal for the new node
        setEditingNode(newNode);
      }).catch(error => {
        console.error('Failed to save character arc:', error);
      });
    }).catch(error => {
      console.error('Error fetching character details:', error);
    }); 

    
  };

  const handleNodeDoubleClick = (event: React.MouseEvent, node: Node) => {
    const nodeData = node.data as PlotNodeData; // Ensure proper typing
    if (nodeData) {
      // Set the current view to the clicked node
      setCurrentViewNodeId(nodeData.id);
      setCurrentViewType(nodeData.type);

      // Use the default fitView behavior to fit all nodes into view
      reactFlowInstance.fitView();
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
    return currentNode ? `${currentNode.name} - Arc` : 'Story Outline';
  };

  const debouncedUpdateCanvas = debounce((updatedCanvasData) => {
    onCanvasUpdate(updatedCanvasData);
  }, 500); // Increased debounce interval to 500ms

  const onNodesChangePersist = (changes: any) => {
    setNodes((nds) => {
      const updatedNodes = nds.map((node) => {
        const change = changes.find((c: any) => c.id === node.id);
        if (change && change.position) {
          return { ...node, position: change.position };
        }
        return node;
      });

      // Accumulate changes locally without triggering onCanvasUpdate
      const updatedCanvasNodes = canvasData?.nodes.map((node) => {
        const updatedNode = updatedNodes.find((n) => n.id === node.id);
        if (updatedNode) {
          return { ...node, position: updatedNode.position };
        }
        return node;
      });

      if (updatedCanvasNodes) {
        canvasData.nodes = updatedCanvasNodes; // Update local canvasData
        console.log('Local changes accumulated:', canvasData);
      }

      return updatedNodes;
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (canvasData) {
        console.log('Saving changes to backend:', canvasData);
        onCanvasUpdate(canvasData);
      }
    }, 60000); // Save every minute

    return () => clearInterval(interval);
  }, [canvasData]);

  const onNodeDragStart = (event: any, node: Node) => {
    console.log('Drag started for node:', node.id);
  };

  const onNodeDragStop = (event: any, node: Node) => {
    setNodes((nds) => {
      const updatedNodes = nds.map((n) => {
        if (n.id === node.id) {
          return { ...n, position: node.position };
        }
        return n;
      });

      // Update local JSON data with latest positions
      const updatedCanvasNodes = canvasData?.nodes.map((canvasNode) => {
        const updatedNode = updatedNodes.find((n) => n.id === canvasNode.id);
        if (updatedNode) {
          return { ...canvasNode, position: updatedNode.position };
        }
        return canvasNode;
      });

      if (updatedCanvasNodes) {
        canvasData.nodes = updatedCanvasNodes; // Update local canvasData
        debouncedUpdateCanvas({ ...canvasData, nodes: updatedCanvasNodes });
        console.log('Local JSON updated:', canvasData);
      }

      return updatedNodes;
    });
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

  const handleExpandChildren = (nodeId: string) => {
    if (!canvasData) return;

    const nodeToExpand = canvasData.nodes.find(node => node.id === nodeId);
    if (!nodeToExpand) return;

    // Add children nodes to the current view
    const childNodes = canvasData.nodes.filter(node => 
      nodeToExpand.childIds.includes(node.id)
    );

    const updatedNodes = [...nodes];
    childNodes.forEach(childNode => {
      const reactFlowNode = createReactFlowNode(childNode);
      if (!updatedNodes.find(node => node.id === reactFlowNode.id)) {
        updatedNodes.push(reactFlowNode);
      }
    });

    setNodes(updatedNodes);
  };

  const handleCharacterOrWorldClick = async (entityId: string) => {
    if (!canvasData || !bookId || !versionId) return;
    console.log('handleCharacterOrWorldClick on entity:', entityId);

    try {
      // Fetch the character data using the character ID
      const response = await apiClient.get(`/books/${bookId}/versions/${versionId}/characters/${entityId}`);
      console.log('Fetched character data:', response.data);
      const selectedCharacter = response.data;

      if (!selectedCharacter) return;

      // Load the character arcs tab
      setCurrentViewType('CharacterArcs');

      // Check if the character has arcs
      let characterArcs = selectedCharacter.arc || [];

      if (characterArcs.length === 0) {
        // Create a default arc node with the current attributes of the character
        const newArcNodeId = `${selectedCharacter.id}-arc-${Date.now()}`;
        const newArcNode: CanvasNode = {
          id: newArcNodeId,
          type: 'Character',
          name: `${selectedCharacter.name} Arc`,
          detail: 'Initial state',
          goal: '',
          status: 'Not Completed',
          timelineEventIds: [],
          parentId: null,
          childIds: [],
          linkedNodeIds: [],
          position: { x: Math.random() * 400, y: Math.random() * 400 },
          attributes: selectedCharacter.traits || [],
        };

        // Link the arc node to SceneBeat nodes in the plot canvas
        const sceneBeatNodes = canvasData.nodes.filter(node => node.type === 'SceneBeats');
        newArcNode.timelineEventIds = sceneBeatNodes.map(node => node.id);

        // Add the new arc node to the character
        characterArcs = [newArcNode];

        // Update the character data in the backend
        const updatedCharacterData = {
          ...selectedCharacter,
          arc: characterArcs,
        };

        await apiClient.patch(`/books/${bookId}/versions/${versionId}/characters/${entityId}`, updatedCharacterData);

        // Add the new arc node to the canvas
        canvasData.nodes.push(newArcNode);
      }

      console.log('Loaded arcs for character:', characterArcs);

      // Update the UI to display the arcs
      const firstArcNodeId = characterArcs[0]?.id || entityId;
      setCurrentViewNodeId(firstArcNodeId);
      setCharacterArcs(characterArcs);
    } catch (error) {
      console.error('Failed to fetch character or load arcs:', error);
    }
  };

  const createArcNodeLink = (arcNodeId: string, chapterOrSceneBeatId: string) => {
    if (!canvasData) return;

    const arcNode = canvasData.nodes.find((node) => node.id === arcNodeId);
    if (!arcNode) return;

    // Add a reference to the chapter or SceneBeat where the arc starts or deviates
    arcNode.detail += `\nLinked to Chapter/SceneBeat: ${chapterOrSceneBeatId}`;

    const updatedNodes = canvasData.nodes.map((node) =>
      node.id === arcNodeId ? arcNode : node
    );

    const newCanvasData = { ...canvasData, nodes: updatedNodes };
    onCanvasUpdate(newCanvasData);
  };

  const handleAddNodeToChart = async () => {
    if (!canvasData) return;

    const newNodeId = `node-${Date.now()}`;
    const newNode: CanvasNode = {
      id: newNodeId,
      type: 'Chart',
      name: 'New Chart Node',
      detail: 'Details of the new chart node',
      goal: '',
      status: 'Not Completed',
      timelineEventIds: [],
      parentId: null,
      childIds: [],
      linkedNodeIds: [],
      position: { x: Math.random() * 400, y: Math.random() * 400 },
    };

    const updatedNodes = [...canvasData.nodes, newNode];
    const newCanvasData = { ...canvasData, nodes: updatedNodes };
    await onCanvasUpdate(newCanvasData);
    loadNodesForCurrentView();
  };

  // Ensure characterId is set when creating a new node from a character node
  const createNodeFromCharacter = (characterId: string) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'plotNode',
      position: { x: 0, y: 0 },
      data: {
        id: `node-${Date.now()}`,
        type: 'Character',
        characters: [{ id: characterId, name: 'New Character', type: 'Character', attributes: [] }],
        linkedNodeIds: [],
        parentId: null,
      },
    };

    setNodes(prevNodes => [...prevNodes, newNode]);
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
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddNodeToChart}
          className="flex items-center gap-1 ml-2"
        >
          <Plus size={16} />
          Add Node to Chart
        </Button>
      </div>

      {(!canvasData || canvasData.nodes?.length === 0) && (
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
        onNodesChange={onNodesChangePersist}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={handlePaneClick}
        onNodeDoubleClick={handleNodeDoubleClick} // Changed from onNodeClick
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-background"
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Meta', 'Ctrl']}
        connectionMode={ConnectionMode.Loose}
        onNodeDragStart={onNodeDragStart}
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
            characters: editingNode.characters || [],
            worlds: editingNode.worlds || [],
            onEdit: () => {},
            onAddChild: () => {},
          }}
          onClose={() => setEditingNode(null)}
          onSave={(nodeId, updatedData) => {
            handleNodeEdit(nodeId, updatedData);
          }}
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
