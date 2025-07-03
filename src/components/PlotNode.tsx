import React, { ReactNode, useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Plus, Users, Globe, Target, ChevronDown, MapPin, Package, ArrowRight } from 'lucide-react';
import { PlotNodeData } from '@/types/plotCanvas';
import { apiClient } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

interface PlotNodeProps extends NodeProps {
  data: PlotNodeData;
}

const PlotNode: React.FC<PlotNodeProps> = ({ data }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Not Completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'Outline':
        return '📋';
      case 'Act':
        return '🎭';
      case 'Chapter':
        return '📄';
      case 'SceneBeats':
        return '🎬';
      case 'Character':
        return '👤';
      case 'WorldLocation':
        return '🏛️';
      case 'WorldObject':
        return '⚡';
      default:
        return '📝';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Outline':
        return 'border-purple-200 bg-purple-50';
      case 'Act':
        return 'border-blue-200 bg-blue-50';
      case 'Chapter':
        return 'border-green-200 bg-green-50';
      case 'SceneBeats':
        return 'border-orange-200 bg-orange-50';
      case 'Character':
        return 'border-red-200 bg-red-50';
      case 'WorldLocation':
        return 'border-indigo-200 bg-indigo-50';
      case 'WorldObject':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const handleEntityClick = async (entityId: string) => {
    console.log('Entity clicked:', entityId);

    if (data.type === 'SceneBeats') {
      console.log('SceneBeat node clicked:', entityId);

      try {
        // Navigate to Character Canvas Page
        navigate(`/books/${data.bookId}/versions/${data.versionId}/characters/${entityId}/arcs`);
      } catch (error) {
        console.error('Failed to load character arcs for SceneBeat node:', error);
      }
    } else if (typeof data.onCharacterOrWorldClick === 'function') {
      data.onCharacterOrWorldClick(entityId);
    }
  };

  
  // Add logic to create linked node with specific ID pattern
  const handleAddLinkedNode = (parentNodeId: string, currentNodeType: string) => {
    
    console.log('Adding linked node:', parentNodeId);

    
    if (currentNodeType === 'Character' || currentNodeType === 'WorldLocation' || currentNodeType === 'WorldObject' ) {
      if (typeof data.onAddLinkedNode === 'function') {
        data.onAddLinkedNode(parentNodeId, currentNodeType);
      }
    }   else {
       data.onAddChild(parentNodeId);
    }
    


    
  };


  
  const renderCharacterDetails = (arcId: string): ReactNode => {
    const [characterDetails, setCharacterDetails] = useState(null);
    console.log('Fetching character details for arcId:', arcId);
    useEffect(() => {
      const fetchDetails = async () => {
        const details = await data.onFetchCharacterDetails (arcId);
        setCharacterDetails(details);
      };
      fetchDetails();
    }, [arcId]);

    if (characterDetails) {
      return (
        <div className="space-y-2">
          <p className="text-xs font-medium">Aliases: {characterDetails.aliases?.join(', ')}</p>
          <p className="text-xs font-medium">Age: {characterDetails.age}</p>
          <p className="text-xs font-medium">Gender: {characterDetails.gender}</p>
          <p className="text-xs font-medium">Description: {characterDetails.description}</p>
          <p className="text-xs font-medium">Traits: {characterDetails.traits?.join(', ')}</p>
          <p className="text-xs font-medium">Backstory: {characterDetails.backstory}</p>
          <p className="text-xs font-medium">Beliefs: {characterDetails.beliefs?.join(', ')}</p>
          <p className="text-xs font-medium">Motivations: {characterDetails.motivations?.join(', ')}</p>
          <p className="text-xs font-medium">Internal Conflicts: {characterDetails.internalConflicts?.join(', ')}</p>
          <p className="text-xs font-medium">External Conflicts: {characterDetails.externalConflicts?.join(', ')}</p>
        </div>
      );
    }
    return null;
  };

  console.log('PlotNode data:', data);
  console.log('Characters in PlotNode:', data.characters);

  return (
    <Card className={`min-w-[320px] shadow-lg border-2 hover:shadow-xl transition-shadow ${getTypeColor(data.type)}`}>
      {/* Handles for connections */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top"
        className="w-3 h-3 bg-blue-500 border-2 border-white"
        isConnectable={true}
      />
      
      <Handle 
        type="target" 
        position={Position.Left} 
        id="left"
        className="w-3 h-3 bg-green-500 border-2 border-white"
        isConnectable={true}
      />
      
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right"
        className="w-3 h-3 bg-green-500 border-2 border-white"
        isConnectable={true}
      />
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom"
        className="w-3 h-3 bg-blue-500 border-2 border-white"
        isConnectable={true}
      />
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg flex-shrink-0">{getNodeIcon(data.type)}</span>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-semibold truncate">{data.name}</CardTitle>
              <Badge variant="outline" className="text-xs mt-1">{data.type}</Badge>
            </div>
          </div>
          <Badge className={`text-xs flex-shrink-0 ml-2 ${getStatusColor(data.status)}`}>
            {data.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Detail */}
        {data.detail && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {data.detail}
          </p>
        )}

        {/* Goal */}
        {data.goal && (
          <div className="flex items-start gap-2">
            <Target size={12} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground line-clamp-2">
              {data.goal}
            </p>
          </div>
        )}

        {/* Characters Section with Images and Drill-down buttons */}
        {data.type === 'Character' && typeof data.id === 'string' && renderCharacterDetails(data.id)}


        {/* Characters Section with Images and Drill-down buttons */}
        {data.characters && data.characters.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Users size={12} className="text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Characters ({data.characters.length})
                </span>
              </div>
            </div>
            <div className="space-y-1">
              {data.characters.map((character: any) => (
                <div 
                  key={character.id}
                  className="flex items-center justify-between p-2 rounded-md bg-background border hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => handleEntityClick(character.id)}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={character.image} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {character?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{character.name}</span>
                    <Badge variant="outline" className="text-xs">Character</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEntityClick(character.id);
                    }}
                  >
                    <ArrowRight size={12} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* World Entities Section with Drill-down buttons */}
        {data.worlds && data.worlds.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Globe size={12} className="text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  World Elements ({data.worlds.length})
                </span>
              </div>
            </div>
            <div className="space-y-1">
              {data.worlds.map((world: any) => (
                <div 
                  key={world.id}
                  className="flex items-center justify-between p-2 rounded-md bg-background border hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => handleEntityClick(world.id)}
                >
                  <div className="flex items-center gap-2">
                    {world.type === 'WorldLocation' ? <MapPin size={12} /> : <Package size={12} />}
                    <span className="text-xs font-medium">{world.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {world.type === 'WorldLocation' ? 'Location' : 'Object'}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEntityClick(world.id);
                    }}
                  >
                    <ArrowRight size={12} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show linked node count if there are linked nodes but they're not characters/world entities */}
        {data.linkedNodeIds && data.linkedNodeIds.length > 0 && 
         (!data.characters || data.characters.length === 0) && 
         (!data.worlds || data.worlds.length === 0) && (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                🔗 {data.linkedNodeIds.length} linked node{data.linkedNodeIds.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Child indicators */}
        {data.childIds && data.childIds.length > 0 && (
          <div className="flex items-center gap-1">
            <ChevronDown size={12} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {data.childIds.length} child{data.childIds.length !== 1 ? 'ren' : ''}
            </span>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex gap-1 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs flex-1"
            onClick={(e) => {
              e.stopPropagation();
              data.onEdit(data.id);
            }}
          >
            <Edit size={10} className="mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs flex-1"
            onClick={(e) => {
              e.stopPropagation();
              handleAddLinkedNode(data.id, data.type);
            }}
          >
            <Plus size={10} className="mr-1" />
            Add Linked Node
          </Button>
        </div>

        {/* Delete Button */}
        <Button
          variant="destructive"
          size="sm"
          className="w-full mt-2"
          onClick={() => data.onDelete(data.id)}
        >
          Delete Node
        </Button>
      </CardContent>
    </Card>
  );
};

export default PlotNode;
