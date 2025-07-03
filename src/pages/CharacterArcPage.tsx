
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import CharacterArcCanvas from '@/components/CharacterArc/CharacterArcCanvas';
import { PlotCanvasData, CanvasNode } from '@/types/plotCanvas';
import { Character } from '@/types/character';
import { apiClient } from '@/lib/api';

const CharacterArcPage: React.FC = () => {
  const { bookId, versionId } = useParams<{ bookId: string; versionId: string }>();
  const [canvasData, setCanvasData] = useState<PlotCanvasData | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('CharacterArcPage mounted with bookId:', bookId, 'versionId:', versionId);

  useEffect(() => {
    fetchCharacterData();
  }, [bookId, versionId]);

  const fetchCharacterData = async () => {
    if (!bookId || !versionId) return;

    setLoading(true);
    try {
      const response = await apiClient.get(`/books/${bookId}/versions/${versionId}/characters/all`);
      const characters: Character[] = response.data || [];
      
      console.log('Fetched characters:', characters);

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
        // Character-specific fields
        aliases: character.aliases,
        age: character.age,
        birthday: character.birthday,
        gender: character.gender,
        image: character.image,
        locationId: character.locationId,
        traits: character.traits,
        backstory: character.backstory,
        beliefs: character.beliefs,
        motivations: character.motivations,
        relationships: character.relationships,
        internalConflicts: character.internalConflicts,
        externalConflicts: character.externalConflicts,
        goals: character.goals,
        arc: character.arc?.map(arcItem => ({
          actId: arcItem.actId,
          timelineEventId: arcItem.timelineEventId,
          descriptionChange: arcItem.summary || ''
        })) || [],
        characters: [{ 
          id: character.id, 
          name: character.name, 
          image: character.image,
          type: 'Character',
          attributes: []
        }],
        worlds: []
      }));

      const characterCanvasData: PlotCanvasData = {
        nodes: characterNodes,
        edges: [],
        timelineEvents: [],
        lastUpdated: new Date().toISOString()
      };

      setCanvasData(characterCanvasData);
      console.log('Character canvas data set:', characterCanvasData);
    } catch (error) {
      console.error('Failed to fetch character data:', error);
      setCanvasData({ nodes: [], edges: [], timelineEvents: [], lastUpdated: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleCanvasUpdate = async (updatedCanvasData: PlotCanvasData) => {
    if (!bookId || !versionId) return;

    try {
      console.log('Updating character canvas data:', updatedCanvasData);
      
      setCanvasData(updatedCanvasData);
      console.log('Character canvas data updated successfully');
    } catch (error) {
      console.error('Failed to update character canvas data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading Character Arcs...</div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <ReactFlowProvider>
        <CharacterArcCanvas 
          bookId={bookId} 
          versionId={versionId}
          canvasData={canvasData}
          onCanvasUpdate={handleCanvasUpdate}
        />
      </ReactFlowProvider>
    </div>
  );
};

export default CharacterArcPage;
