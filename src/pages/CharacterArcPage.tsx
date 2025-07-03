
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import CharacterArcCanvas from '@/components/CharacterArc/CharacterArcCanvas';
import { PlotCanvasData, CanvasNode } from '@/types/plotCanvas';
import { Character } from '@/types/character';
import { apiClient } from '@/lib/api';

const CharacterArcPage: React.FC = () => {
  const { bookId, versionId } = useParams<{ bookId: string; versionId: string }>();
  const [searchParams] = useSearchParams();
  const characterId = searchParams.get('characterId');
  const [canvasData, setCanvasData] = useState<PlotCanvasData | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('CharacterArcPage mounted with bookId:', bookId, 'versionId:', versionId, 'characterId:', characterId);

  useEffect(() => {
    fetchCharacterData();
  }, [bookId, versionId, characterId]);

  const fetchCharacterData = async () => {
    if (!bookId || !versionId) return;

    setLoading(true);
    try {
      if (characterId) {
        // Load specific character's arc
        console.log('Loading specific character arc for:', characterId);
        const response = await apiClient.get(`/books/${bookId}/versions/${versionId}/characters/all`);
        const characters: Character[] = response.data || [];
        
        const selectedCharacter = characters.find(char => char.id === characterId);
        console.log('Found selected character:', selectedCharacter);
        
        if (selectedCharacter && selectedCharacter.arc) {
          console.log('Loading character arc data:', selectedCharacter.arc);
          setCanvasData(selectedCharacter.arc);
        } else {
          // No arc data, create empty canvas
          setCanvasData({ 
            nodes: [], 
            edges: [], 
            timelineEvents: [], 
            lastUpdated: new Date().toISOString() 
          });
        }
      } else {
        // Load all characters as nodes
        console.log('Loading all characters');
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
          arc: character.arc?.nodes?.map(arcNode => ({
            actId: arcNode.id,
            timelineEventId: arcNode.timelineEventIds?.[0] || '',
            descriptionChange: arcNode.detail || ''
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
      }
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
      
      if (characterId) {
        // Update specific character's arc
        await apiClient.patch(`/books/${bookId}/versions/${versionId}/characters/${characterId}`, {
          arc: updatedCanvasData
        });
      }
      
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
          characterId={characterId}
          canvasData={canvasData}
          onCanvasUpdate={handleCanvasUpdate}
        />
      </ReactFlowProvider>
    </div>
  );
};

export default CharacterArcPage;
