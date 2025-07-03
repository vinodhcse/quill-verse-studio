import React, { ReactNode, useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Plus, Users, Globe, Target, ChevronDown, MapPin, Package, ArrowRight, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { PlotNodeData, CharacterAttributes } from '@/types/plotCanvas';
import { apiClient } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

interface PlotNodeProps extends NodeProps {
  data: PlotNodeData;
}

const PlotNode: React.FC<PlotNodeProps> = ({ data }) => {
  const navigate = useNavigate();
  const [showFullAttributes, setShowFullAttributes] = useState(false);
  
  // Get plot canvas data from props instead of context
  const timelineEvents = data.timelineEvents || [];
  const plotCanvasNodes = data.plotCanvasNodes || [];

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

  const handlePlotNodeClick = (plotNodeId: string) => {
    // Navigate to plot outline page with the specific node focused
    const url = `/books/${data.bookId}/versions/${data.versionId}/plan?boards=plot-arcs&tab=plot-outline&focusNode=${plotNodeId}`;
    navigate(url);
  };

  // Function to compare attributes and show changes
  const getAttributeChanges = () => {
    if (data.type !== 'Character' || isFirstNode) return null;

    const nodeData = data as any;
    const currentAttributes = nodeData.attributes;
    
    // Type guard to check if attributes is CharacterAttributes
    if (!currentAttributes || Array.isArray(currentAttributes)) {
      return null;
    }

    // Find parent node to compare attributes
    const parentNode = plotCanvasNodes.find((n: any) => 
      n.linkedNodeIds && n.linkedNodeIds.includes(nodeData.id)
    );

    if (!parentNode || !parentNode.attributes || Array.isArray(parentNode.attributes)) return null;

    const parentAttributes = parentNode.attributes as CharacterAttributes;
    const changes: string[] = [];

    // Compare key attributes
    const attributesToCheck = ['aliases', 'traits', 'beliefs', 'motivations', 'internalConflicts', 'externalConflicts'];
    
    attributesToCheck.forEach(attr => {
      const currentValue = (currentAttributes as any)[attr] || [];
      const parentValue = (parentAttributes as any)[attr] || [];
      
      if (Array.isArray(currentValue) && Array.isArray(parentValue)) {
        const added = currentValue.filter((item: string) => !parentValue.includes(item));
        const removed = parentValue.filter((item: string) => !currentValue.includes(item));
        
        if (added.length > 0) {
          changes.push(`Added ${attr}: ${added.join(', ')}`);
        }
        if (removed.length > 0) {
          changes.push(`Removed ${attr}: ${removed.join(', ')}`);
        }
      }
    });

    // Check other attributes with proper type checking
    const currentAttrs = currentAttributes as CharacterAttributes;
    const parentAttrs = parentAttributes as CharacterAttributes;

    if (currentAttrs.age !== parentAttrs.age) {
      changes.push(`Age: ${parentAttrs.age} → ${currentAttrs.age}`);
    }
    if (currentAttrs.gender !== parentAttrs.gender) {
      changes.push(`Gender: ${parentAttrs.gender} → ${currentAttrs.gender}`);
    }
    if (currentAttrs.description !== parentAttrs.description) {
      changes.push(`Description changed`);
    }
    if (currentAttrs.backstory !== parentAttrs.backstory) {
      changes.push(`Backstory updated`);
    }

    return changes.length > 0 ? changes : null;
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
    
    // Type guard to check if attributes is CharacterAttributes
    if (!attributes || Array.isArray(attributes)) {
      return null;
    }

    const characterAttrs = attributes as CharacterAttributes;

    if (showFullAttributes) {
      // Show full attributes
      return (
        <div className="space-y-2">
          {characterAttrs.age && <p className="text-xs font-medium">Age: {characterAttrs.age}</p>}
          {characterAttrs.gender && <p className="text-xs font-medium">Gender: {characterAttrs.gender}</p>}
          {characterAttrs.description && <p className="text-xs font-medium">Description: {characterAttrs.description}</p>}
          {characterAttrs.traits && characterAttrs.traits.length > 0 && (
            <p className="text-xs font-medium">Traits: {characterAttrs.traits.join(', ')}</p>
          )}
          {characterAttrs.backstory && <p className="text-xs font-medium">Backstory: {characterAttrs.backstory}</p>}
          {characterAttrs.beliefs && characterAttrs.beliefs.length > 0 && (
            <p className="text-xs font-medium">Beliefs: {characterAttrs.beliefs.join(', ')}</p>
          )}
          {characterAttrs.motivations && characterAttrs.motivations.length > 0 && (
            <p className="text-xs font-medium">Motivations: {characterAttrs.motivations.join(', ')}</p>
          )}
          {characterAttrs.internalConflicts && characterAttrs.internalConflicts.length > 0 && (
            <p className="text-xs font-medium">Internal Conflicts: {characterAttrs.internalConflicts.join(', ')}</p>
          )}
          {characterAttrs.externalConflicts && characterAttrs.externalConflicts.length > 0 && (
            <p className="text-xs font-medium">External Conflicts: {characterAttrs.externalConflicts.join(', ')}</p>
          )}
        </div>
      );
    } else {
      // Show condensed view
      const condensedTraits = characterAttrs.traits && characterAttrs.traits.length > 0 
        ? characterAttrs.traits.slice(0, 2).join(', ') + (characterAttrs.traits.length > 2 ? '...' : '')
        : null;
      
      const condensedMotivations = characterAttrs.motivations && characterAttrs.motivations.length > 0
        ? characterAttrs.motivations.slice(0, 1).join(', ') + (characterAttrs.motivations.length > 1 ? '...' : '')
        : null;

      return (
        <div className="space-y-1">
          {characterAttrs.age && <div className="text-xs"><strong>Age:</strong> {characterAttrs.age}</div>}
          {characterAttrs.gender && <div className="text-xs"><strong>Gender:</strong> {characterAttrs.gender}</div>}
          {condensedTraits && <div className="text-xs"><strong>Traits:</strong> {condensedTraits}</div>}
          {condensedMotivations && <div className="text-xs"><strong>Motivations:</strong> {condensedMotivations}</div>}
        </div>
      );
    }
  };

  // Function to render linked Plot Canvas nodes - now using props data
  const renderLinkedPlotNodes = () => {
    const nodeData = data as any;
    const linkedPlotNodeIds = nodeData.linkedNodeIds || [];
    
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
              <div 
                key={nodeId} 
                className="flex items-center gap-2 p-1 rounded-md bg-background border hover:bg-accent transition-colors cursor-pointer"
                onClick={() => handlePlotNodeClick(nodeId)}
              >
                <span className="text-xs">{getNodeIcon(plotNode.type)}</span>
                <span className="text-xs font-medium">{plotNode.name}</span>
                <Badge variant="outline" className="text-xs">{plotNode.type}</Badge>
                <ExternalLink size={10} className="ml-auto text-muted-foreground" />
              </div>
            ) : (
              <div key={nodeId} className="flex items-center gap-2 p-1 rounded-md bg-background border">
                <span className="text-xs">🔗</span>
                <span className="text-xs font-medium">{nodeId}</span>
                <Badge variant="outline" className="text-xs">Unknown</Badge>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Function to render linked Timeline Events - now using props data
  const renderLinkedTimelineEvents = () => {
    const nodeData = data as any;
    const timelineEventIds = nodeData.timelineEventIds || [];
    
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
            ) : (
              <div key={eventId} className="flex items-center gap-2 p-1 rounded-md bg-background border">
                <span className="text-xs">📅</span>
                <span className="text-xs font-medium">{eventId}</span>
                <Badge variant="outline" className="text-xs">Unknown</Badge>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  console.log('PlotNode data:', data);

  const attributeChanges = getAttributeChanges();

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

        {/* Attribute Changes Summary (for non-first character nodes) */}
        {data.type === 'Character' && !isFirstNode && attributeChanges && attributeChanges.length > 0 && (
          <div className="space-y-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-yellow-800">Character Changes:</span>
            </div>
            <div className="space-y-1">
              {attributeChanges.slice(0, 3).map((change, index) => (
                <div key={index} className="text-xs text-yellow-700">• {change}</div>
              ))}
              {attributeChanges.length > 3 && (
                <div className="text-xs text-yellow-600">...and {attributeChanges.length - 3} more changes</div>
              )}
            </div>
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
