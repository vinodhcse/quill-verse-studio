import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import CharacterArcCanvas from '@/components/CharacterArc/CharacterArcCanvas';
import { PlotCanvasProvider } from '@/contexts/PlotCanvasContext';
import { PlotCanvasData, CanvasNode } from '@/types/plotCanvas';
import { Character } from '@/types/character';
import { apiClient } from '@/lib/api';

const CharacterArcPage: React.FC = () => {
  const { bookId, versionId } = useParams<{ bookId: string; versionId: string }>();
  const [searchParams] = useSearchParams();
  const characterId = searchParams.get('characterId');
  const [canvasData, setCanvasData] = useState<PlotCanvasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingCanvas, setUpdatingCanvas] = useState(false);

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
        
        if (selectedCharacter && selectedCharacter.arc && 
            typeof selectedCharacter.arc === 'object' &&
            'nodes' in selectedCharacter.arc && Array.isArray(selectedCharacter.arc.nodes) &&
            'edges' in selectedCharacter.arc && Array.isArray(selectedCharacter.arc.edges)) {
          // Character has proper canvas data - ensure it has required properties
          const arcData = selectedCharacter.arc as any;
          const properCanvasData: PlotCanvasData = {
            nodes: arcData.nodes || [],
            edges: arcData.edges || [],
            timelineEvents: arcData.timelineEvents || [],
            lastUpdated: arcData.lastUpdated || new Date().toISOString()
          };
          console.log('Loading character arc canvas data:', properCanvasData);
          setCanvasData(properCanvasData);
        } else {
          // Create initial node from character data with proper attributes structure
          const initialNode: CanvasNode = {
            id: `${characterId}-arc-initial`,
            type: 'Character',
            name: selectedCharacter?.name || 'Character',
            detail: 'Initial character state',
            goal: selectedCharacter?.goals?.map(g => g.goal).join(', ') || '',
            status: 'Not Completed',
            timelineEventIds: [],
            parentId: null,
            childIds: [],
            linkedNodeIds: [],
            position: { x: 100, y: 100 },
            characters: selectedCharacter ? [{ 
              id: selectedCharacter.id, 
              name: selectedCharacter.name, 
              image: selectedCharacter.image,
              type: 'Character',
              attributes: []
            }] : [],
            worlds: [],
            attributes: {
              age: selectedCharacter?.age,
              birthday: selectedCharacter?.birthday,
              gender: selectedCharacter?.gender,
              description: selectedCharacter?.description,
              image: selectedCharacter?.image,
              aliases: selectedCharacter?.aliases || [],
              traits: selectedCharacter?.traits || [],
              backstory: selectedCharacter?.backstory,
              beliefs: selectedCharacter?.beliefs || [],
              motivations: selectedCharacter?.motivations || [],
              internalConflicts: selectedCharacter?.internalConflicts || [],
              externalConflicts: selectedCharacter?.externalConflicts || [],
              relationships: selectedCharacter?.relationships || [],
              goals: selectedCharacter?.goals || []
            }
          };

          setCanvasData({ 
            nodes: [initialNode], 
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
          characters: [{ 
            id: character.id, 
            name: character.name, 
            image: character.image,
            type: 'Character',
            attributes: []
          }],
          worlds: [],
          attributes: {
            age: character.age,
            birthday: character.birthday,
            gender: character.gender,
            description: character.description,
            image: character.image,
            aliases: character.aliases || [],
            traits: character.traits || [],
            backstory: character.backstory,
            beliefs: character.beliefs || [],
            motivations: character.motivations || [],
            internalConflicts: character.internalConflicts || [],
            externalConflicts: character.externalConflicts || [],
            relationships: character.relationships || [],
            goals: character.goals || []
          }
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

    setUpdatingCanvas(true);
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
    } finally {
      setUpdatingCanvas(false);
    }
  };

  return (
    <div className="relative h-screen">
      {(loading || updatingCanvas) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}
      <PlotCanvasProvider bookId={bookId} versionId={versionId}>
        <ReactFlowProvider>
          <CharacterArcCanvas 
            bookId={bookId} 
            versionId={versionId}
            characterId={characterId}
            canvasData={canvasData}
            onCanvasUpdate={handleCanvasUpdate}
          />
        </ReactFlowProvider>
      </PlotCanvasProvider>
    </div>
  );
};

export default CharacterArcPage;
