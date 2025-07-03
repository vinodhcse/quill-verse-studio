
import React, { ReactNode, useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Plus, Users, Globe, Target, ChevronDown, MapPin, Package, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { PlotNodeData } from '@/types/plotCanvas';
import { apiClient } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

interface PlotNodeProps extends NodeProps {
  data: PlotNodeData;
}

const PlotNode: React.FC<PlotNodeProps> = ({ data }) => {
  const navigate = useNavigate();
  const [showFullAttributes, setShowFullAttributes] = useState(false);

  // Determine if this is the first node (no parent and no incoming linked nodes)
  const isFirstNode = data.parentId === null && (!data.linkedNodeIds || data.linkedNodeIds.length === 0);

  // Set initial state for showFullAttributes based on whether it's the first node
  useEffect(() => {
    if (data.type === 'Character') {
      setShowFullAttributes(isFirstNode);
    }
  }, [data.type, isFirstNode]);

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

  // Function to render character details from node attributes
  const renderCharacterDetails = (): ReactNode => {
    if (data.type !== 'Character') return null;

    // Get attributes from the node data
    const nodeData = data as any;
    const attributes = nodeData.attributes;
    
    if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) {
      return null;
    }

    if (showFullAttributes) {
      // Show full attributes
      return (
        <div className="space-y-2">
          {attributes.age && <p className="text-xs font-medium">Age: {attributes.age}</p>}
          {attributes.gender && <p className="text-xs font-medium">Gender: {attributes.gender}</p>}
          {attributes.description && <p className="text-xs font-medium">Description: {attributes.description}</p>}
          {attributes.traits && attributes.traits.length > 0 && (
            <p className="text-xs font-medium">Traits: {attributes.traits.join(', ')}</p>
          )}
          {attributes.backstory && <p className="text-xs font-medium">Backstory: {attributes.backstory}</p>}
          {attributes.beliefs && attributes.beliefs.length > 0 && (
            <p className="text-xs font-medium">Beliefs: {attributes.beliefs.join(', ')}</p>
          )}
          {attributes.motivations && attributes.motivations.length > 0 && (
            <p className="text-xs font-medium">Motivations: {attributes.motivations.join(', ')}</p>
          )}
          {attributes.internalConflicts && attributes.internalConflicts.length > 0 && (
            <p className="text-xs font-medium">Internal Conflicts: {attributes.internalConflicts.join(', ')}</p>
          )}
          {attributes.externalConflicts && attributes.externalConflicts.length > 0 && (
            <p className="text-xs font-medium">External Conflicts: {attributes.externalConflicts.join(', ')}</p>
          )}
        </div>
      );
    } else {
      // Show condensed view
      const condensedTraits = attributes.traits && attributes.traits.length > 0 
        ? attributes.traits.slice(0, 2).join(', ') + (attributes.traits.length > 2 ? '...' : '')
        : null;
      
      const condensedMotivations = attributes.motivations && attributes.motivations.length > 0
        ? attributes.motivations.slice(0, 1).join(', ') + (attributes.motivations.length > 1 ? '...' : '')
        : null;

      return (
        <div className="space-y-1">
          {attributes.age && <div className="text-xs"><strong>Age:</strong> {attributes.age}</div>}
          {attributes.gender && <div className="text-xs"><strong>Gender:</strong> {attributes.gender}</div>}
          {condensedTraits && <div className="text-xs"><strong>Traits:</strong> {condensedTraits}</div>}
          {condensedMotivations && <div className="text-xs"><strong>Motivations:</strong> {condensedMotivations}</div>}
        </div>
      );
    }
  };

  // Function to render linked Plot Canvas nodes
  const renderLinkedPlotNodes = () => {
    const nodeData = data as any;
    const linkedPlotNodeIds = nodeData.linkedPlotNodeIds || [];
    const plotCanvasNodes = nodeData.plotCanvasNodes || [];
    
    if (linkedPlotNodeIds.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <Target size={12} className="text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            Linked Plot Nodes ({linkedPlotNodeIds.length})
          </span>
        </div>
        <div className="space-y-1">
          {linkedPlotNodeIds.map((nodeId: string) => {
            const plotNode = plotCanvasNodes.find((n: any) => n.id === nodeId);
            return plotNode ? (
              <div key={nodeId} className="flex items-center gap-2 p-1 rounded-md bg-background border">
                <span className="text-xs">{getNodeIcon(plotNode.type)}</span>
                <span className="text-xs font-medium">{plotNode.name}</span>
                <Badge variant="outline" className="text-xs">{plotNode.type}</Badge>
              </div>
            ) : null;
          })}
        </div>
      </div>
    );
  };

  // Function to render linked Timeline Events
  const renderLinkedTimelineEvents = () => {
    const nodeData = data as any;
    const timelineEventIds = nodeData.timelineEventIds || [];
    const timelineEvents = nodeData.timelineEvents || [];
    
    if (timelineEventIds.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <ChevronDown size={12} className="text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            Timeline Events ({timelineEventIds.length})
          </span>
        </div>
        <div className="space-y-1">
          {timelineEventIds.map((eventId: string) => {
            const event = timelineEvents.find((e: any) => e.id === eventId);
            return event ? (
              <div key={eventId} className="flex items-center gap-2 p-1 rounded-md bg-background border">
                <span className="text-xs">📅</span>
                <span className="text-xs font-medium">{event.name}</span>
                <Badge variant="outline" className="text-xs">{event.type}</Badge>
              </div>
            ) : null;
          })}
        </div>
      </div>
    );
  };

  console.log('PlotNode data:', data);

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

        {/* Character Details Section with Show/Hide Button */}
        {data.type === 'Character' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Character Details</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowFullAttributes(!showFullAttributes)}
              >
                {showFullAttributes ? <EyeOff size={12} /> : <Eye size={12} />}
              </Button>
            </div>
            {renderCharacterDetails()}
          </div>
        )}

        {/* Linked Plot Canvas Nodes */}
        {renderLinkedPlotNodes()}

        {/* Linked Timeline Events */}
        {renderLinkedTimelineEvents()}

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
          onClick={() => data.onDelete && data.onDelete(data.id)}
        >
          Delete Node
        </Button>
      </CardContent>
    </Card>
  );
};

export default PlotNode;
