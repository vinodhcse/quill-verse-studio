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
import PlotNode from '@/components/PlotNode';
import DeletableEdge from '@/components/DeletableEdge';
import { PlotNodeData, CanvasNode, PlotCanvasData } from '@/types/plotCanvas';
import { Button } from '@/components/ui/button';
import { debounce } from 'lodash';
import { useReactFlow } from '@xyflow/react';
import { apiClient } from '@/lib/api';
import { QuickNodeModal } from '@/components/QuickNodeModal';
import { Character } from '@/types/character';

const nodeTypes = { plotNode: PlotNode };
const edgeTypes = {
  custom: DeletableEdge,
};

interface CharacterArcCanvasProps {
  bookId?: string;
  versionId?: string;
  characterId?: string;
  canvasData?: PlotCanvasData | null;
  onCanvasUpdate?: (data: PlotCanvasData) => void;
}

const CharacterArcCanvas: React.FC<CharacterArcCanvasProps> = ({ 
  bookId, 
  versionId, 
  characterId,
  canvasData: propCanvasData,
  onCanvasUpdate: propOnCanvasUpdate
}) => {
  const [internalCanvasData, setInternalCanvasData] = useState<PlotCanvasData>({ 
    nodes: [], 
    edges: [], 
    timelineEvents: [], 
    lastUpdated: '' 
  });
  const [loading, setLoading] = useState(false);

  // Use prop data if available, otherwise use internal state
  const canvasData = propCanvasData || internalCanvasData;
  const onCanvasUpdate = propOnCanvasUpdate || setInternalCanvasData;

  console.log('CharacterArcCanvas mounted with bookId:', bookId, 'versionId:', versionId);

  useEffect(() => {
    // Only fetch data if no prop data is provided
    if (!propCanvasData && bookId && versionId) {
      fetchCharacterArcData();
    }
  }, [bookId, versionId, characterId, propCanvasData]);

  const fetchCharacterArcData = async () => {
    if (!bookId || !versionId) return;

    setLoading(true);
    try {
      const endpoint = characterId
        ? `/books/${bookId}/versions/${versionId}/characters/${characterId}`
        : `/books/${bookId}/versions/${versionId}/characters/all`;
      
      const response = await apiClient.get(endpoint);
      
      if (characterId) {
        // Single character
        const selectedCharacter = response.data;
        let characterArcs = selectedCharacter?.arcs || [];

        if (characterArcs.length === 0) {
          console.log('No arcs found for character:', characterId, 'Creating initial arc.');

          const newArcNodeId = `${characterId}-arc-${Date.now()}`;
          const newArcNode: CanvasNode = {
            id: newArcNodeId,
            type: 'Character',
            name: `${selectedCharacter?.name || 'Unnamed Character'} Arc`,
            detail: 'Initial state',
            goal: '',
            status: 'Not Completed',
            timelineEventIds: [],
            parentId: null,
            childIds: [],
            linkedNodeIds: [],
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            characters: [{ id: characterId, name: selectedCharacter?.name || 'Unnamed Character', type: 'Character' }],
            worlds: [],
          };

          characterArcs = [newArcNode];
        }

        setInternalCanvasData({
          nodes: characterArcs,
          edges: [],
          timelineEvents: [],
          lastUpdated: response.data?.arc?.lastUpdated || '',
        });
      } else {
        // All characters - convert to canvas nodes
        const characters: Character[] = response.data || [];
        const characterNodes: CanvasNode[] = characters.map((character, index) => ({
          id: character.id,
          type: 'Character',
          name: character.name,
          detail: character.description || '',
          goal: character.goals?.map(g => g.goal).join(', ') || '',
          status: 'Not Completed',
          timelineEventIds: [],
          parentId: null,
          childIds: [],
          linkedNodeIds: [],
          position: { 
            x: (index % 4) * 300 + 100, 
            y: Math.floor(index / 4) * 200 + 100 
          },
          characters: [{ 
            id: character.id, 
            name: character.name, 
            image: character.image,
            type: 'Character',
            attributes: []
          }],
          worlds: []
        }));

        setInternalCanvasData({
          nodes: characterNodes,
          edges: [],
          timelineEvents: [],
          lastUpdated: new Date().toISOString(),
        });
      }
      
      console.log('Character arc data fetched successfully');
    } catch (error) {
      console.error('Failed to fetch character arc data:', error);
      setInternalCanvasData({ nodes: [], edges: [], timelineEvents: [], lastUpdated: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleCanvasUpdate = async (updatedArcData: PlotCanvasData) => {
    if (!bookId || !versionId) return;

    try {
      console.log('Updating character arc data:', updatedArcData);
      
      if (characterId) {
        // Update specific character
        const updatedCharacterData = {
          arc: updatedArcData,
        };

        await apiClient.patch(`/books/${bookId}/versions/${versionId}/characters/${characterId}`, updatedCharacterData);
      }

      // Update local state
      onCanvasUpdate(updatedArcData);
      console.log('Character arc data updated successfully');
    } catch (error) {
      console.error('Failed to update character arc data:', error);
    }
  };

  const handleCharacterOrWorldClick = async (entityId: string) => {
    if (!bookId || !versionId) return;
    console.log('handleCharacterOrWorldClick on entity:', entityId);

    try {
      const response = await apiClient.get(`/books/${bookId}/versions/${versionId}/characters/${entityId}`);
      console.log('Fetched character data:', response.data);
      const selectedCharacter = response.data;

      if (!selectedCharacter) return;

      let characterArcs = selectedCharacter.arcs || [];

      if (characterArcs.length === 0) {
        console.log('No arcs found for character:', entityId, 'Creating initial arc.');

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
                  characters: [{ id: selectedCharacter.id, name: selectedCharacter.name }],
                  worlds: [],
                };

        characterArcs = [newArcNode];

        const updatedCharacterData = {
          ...selectedCharacter,
          arcs: characterArcs,
        };

        await apiClient.patch(`/books/${bookId}/versions/${versionId}/characters/${entityId}`, updatedCharacterData);

        console.log('Initial arc created and saved for character:', entityId);
      }

      setInternalCanvasData({
        nodes: characterArcs,
        edges: [],
        timelineEvents: [],
        lastUpdated: '',
      });
      console.log('Character arcs loaded:', characterArcs);
    } catch (error) {
      console.error('Failed to fetch character or load arcs:', error);
    }
  };

  const handleSceneBeatNodeClick = async (sceneBeatNodeId: string) => {
    if (!bookId || !versionId) return;
    console.log('SceneBeat node clicked:', sceneBeatNodeId);

    try {
      const response = await apiClient.get(`/books/${bookId}/versions/${versionId}/sceneBeats/${sceneBeatNodeId}`);
      const sceneBeatData = response.data;

      if (!sceneBeatData || !sceneBeatData.characterId) {
        console.error('No character associated with SceneBeat node:', sceneBeatNodeId);
        return;
      }

      const characterResponse = await apiClient.get(`/books/${bookId}/versions/${versionId}/characters/${sceneBeatData.characterId}`);
      const selectedCharacter = characterResponse.data;

      if (!selectedCharacter) {
        console.error('Character not found for SceneBeat node:', sceneBeatNodeId);
        return;
      }

      const characterArcs = selectedCharacter.arcs || [];

      if (characterArcs.length === 0) {
        console.error('No arcs found for character:', sceneBeatData.characterId);
        return;
      }

      setInternalCanvasData({
        nodes: characterArcs,
        edges: [],
        timelineEvents: [],
        lastUpdated: '',
      });
    } catch (error) {
      console.error('Failed to load character arcs for SceneBeat node:', error);
    }
  };

  const createReactFlowNode = (nodeData: any): any => {
    return {
      id: nodeData.id,
      type: 'characterArcNode',
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
          const nodeToEdit = canvasData?.nodes.find((n: any) => n.id === nodeId);
          if (nodeToEdit) {
            console.log('Editing node:', nodeToEdit);
          }
        },
        onAddChild: (parentId: string) => {
          console.log('Adding child to node:', parentId);
        },
        onNavigateToEntity: handleCharacterOrWorldClick,
        onDelete: (nodeId: string) => {
          console.log('Deleting node:', nodeId);
        },
      },
    };
  };

  const handleAddLinkedNode = async (parentNodeId: string, currentNodeType: string) => {
    console.log('Adding linked node:', parentNodeId);

    if (currentNodeType === 'Character') {
      const characterId = parentNodeId.split('-')[0];
      const newNodeId = `${characterId}-arc-${Date.now()}`;

      const newNode = {
        id: newNodeId,
        type: 'CharacterArc',
        data: {
          characterId,
          attributes: {}, // Populate with character attributes if available
        },
      };

      // Save the new node via the character PATCH API
      try {
        const response = await apiClient.patch(`/books/${bookId}/versions/${versionId}/characters/${characterId}`, {
          arcs: [newNode],
        });
        console.log('Character arc saved successfully:', response.data);

        // Update the canvas data
        setInternalCanvasData((prevData) => ({
          ...prevData,
          nodes: [...(prevData?.nodes || []), newNode],
        }));
      } catch (error) {
        console.error('Error saving character arc node:', error);
      }
    } else {
      console.error('Unsupported node type for adding linked node:', currentNodeType);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-lg">Loading Character Arcs...</div>
          </div>
        ) : (
          <CharacterArcPlotCanvas
            bookId={bookId}
            versionId={versionId}
            canvasData={canvasData}
            onCanvasUpdate={handleCanvasUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default CharacterArcCanvas;
