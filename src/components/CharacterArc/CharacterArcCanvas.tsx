import React, { useState, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import CharacterArcPlotCanvas from '@/components/CharacterArc/CharacterArcPlotCanvas';
import { CanvasNode} from '@/types/plotCanvas';
import { apiClient } from '@/lib/api';

interface CharacterArcCanvasProps {
  bookId: string;
  versionId: string;
  characterId?: string; // Added characterId as an optional prop
}

const CharacterArcCanvas: React.FC<CharacterArcCanvasProps> = ({ bookId, versionId, characterId }) => {
  const [canvasData, setCanvasData] = useState({ nodes: [], edges: [], timelineEvents: [], lastUpdated: '' });
  const [loading, setLoading] = useState(false);
  console.log('CharacterArcCanvas mounted with bookId:', bookId, 'versionId:', versionId);
  const fetchCharacterArcData = async () => {
    if (!bookId || !versionId) return;

    setLoading(true);
    try {
      const endpoint = characterId
        ? `/books/${bookId}/versions/${versionId}/characters/${characterId}`
        : `/books/${bookId}/versions/${versionId}/plotCanvas`;
      const response = await apiClient.get(endpoint);
      const selectedCharacter = response.data;

      let characterArcs = selectedCharacter?.arcs || [];

      if (characterArcs.length === 0 && characterId) {
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

        const updatedCharacterData = {
          ...selectedCharacter,
          arcs: characterArcs,
        };

        await apiClient.patch(`/books/${bookId}/versions/${versionId}/characters/${characterId}`, updatedCharacterData);

        console.log('Initial arc created and saved for character:', characterId);
      }

      setCanvasData({
        nodes: characterArcs,
        edges: [],
        timelineEvents: [],
        lastUpdated: response.data?.arc?.lastUpdated || '',
      });
      console.log('Character arc data fetched successfully:', canvasData);
    } catch (error) {
      console.error('Failed to fetch character arc data:', error);
      setCanvasData({ nodes: [], edges: [], timelineEvents: [], lastUpdated: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleCanvasUpdate = async (updatedArcData: any) => {
    if (!bookId || !versionId || !characterId) return;

    try {
     console.log('Updating character arc data:', updatedArcData);
      if (!updatedArcData) {
        console.error('updatedArcData data not found');
        return;
      }

      // Update only the arc array
      const updatedCharacterData = {
        arc: updatedArcData, // Replace the arc array with the updated data
      };

      // Send the updated character data back to the server
      await apiClient.patch(`/books/${bookId}/versions/${versionId}/characters/${characterId}`, updatedCharacterData);

      // Update the local state
      setCanvasData({
        nodes: updatedArcData?.nodes || [],
        edges: updatedArcData?.arc?.edges || [],
        timelineEvents: updatedArcData?.arc?.timelineEvents || [],
        lastUpdated: new Date().toISOString(),
      });
      console.log('Character arc data updated successfully:', canvasData);
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

      setCanvasData({
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

      setCanvasData({
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
        setCanvasData((prevData) => ({
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

  useEffect(() => {
    fetchCharacterArcData();
  }, [bookId, versionId, characterId]);

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-lg">Loading Character Arcs...</div>
          </div>
        ) : (
          <ReactFlowProvider>
            <CharacterArcPlotCanvas
              bookId={bookId}
              versionId={versionId}
              canvasData={canvasData}
              onCanvasUpdate={handleCanvasUpdate}
            />
          </ReactFlowProvider>
        )}
      </div>
    </div>
  );
};

export default CharacterArcCanvas;
