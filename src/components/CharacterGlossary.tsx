
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { Character } from '@/types/character';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Edit, Users, Calendar, MapPin, Target } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreateCharacterModal } from './CreateCharacterModal';

interface CharacterGlossaryProps {
  bookId?: string;
  versionId?: string;
}

export const CharacterGlossary: React.FC<CharacterGlossaryProps> = ({ bookId, versionId }) => {
  const { bookId: paramBookId, versionId: paramVersionId } = useParams();
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const currentBookId = bookId || paramBookId;
  const currentVersionId = versionId || paramVersionId;

  useEffect(() => {
    fetchCharacters();
  }, [currentBookId, currentVersionId]);

  const fetchCharacters = async () => {
    if (!currentBookId || !currentVersionId) return;

    setLoading(true);
    try {
      const response = await apiClient.get(`/books/${currentBookId}/versions/${currentVersionId}/characters`);
      setCharacters(response.data.characters || []);
    } catch (error) {
      console.error('Failed to fetch characters:', error);
      setCharacters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCharacterArc = (characterId: string) => {
    navigate(`/plan/book/${currentBookId}/version/${currentVersionId}?tab=character-arcs&characterId=${characterId}`);
  };

  const handleCreateCharacter = async (characterData: Omit<Character, 'id'>) => {
    try {
      const response = await apiClient.post(`/books/${currentBookId}/versions/${currentVersionId}/characters`, characterData);
      setCharacters(prev => [...prev, response.data]);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create character:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading Characters...</div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Character Glossary</h2>
          <p className="text-muted-foreground">Manage your story characters and their arcs</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus size={16} />
          Add Character
        </Button>
      </div>

      {characters.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Characters Yet</h3>
            <p className="text-muted-foreground mb-4">Start building your character glossary</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={16} className="mr-2" />
              Create First Character
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {characters.map((character) => (
            <Card key={character.id} className="hover:shadow-lg transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={character.image} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {character.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{character.name}</CardTitle>
                      {character.aliases.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          aka {character.aliases.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditCharacterArc(character.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit size={14} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {character.description}
                </p>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>Age {character.age}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={12} />
                    <span>{character.gender}</span>
                  </div>
                </div>

                {character.traits.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {character.traits.slice(0, 3).map((trait) => (
                      <Badge key={trait} variant="secondary" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                    {character.traits.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{character.traits.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Target size={12} />
                    <span>{character.goals.length} goals</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditCharacterArc(character.id)}
                    className="text-xs"
                  >
                    Edit Arc
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateCharacterModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateCharacter}
      />
    </div>
  );
};
