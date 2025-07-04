
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Plus, Users, Globe, Target, ChevronDown, MapPin, Package, ArrowRight } from 'lucide-react';
import { PlotNodeData } from '@/types/plotCanvas';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlotCanvasContext } from '@/contexts/PlotCanvasContext';

interface WorldEntityArcPlotNodeProps extends NodeProps {
  data: PlotNodeData;
}

const WorldEntityArcPlotNode: React.FC<WorldEntityArcPlotNodeProps> = ({ data }) => {
  const navigate = useNavigate();
  const { bookId, versionId } = useParams<{ bookId: string; versionId: string }>();
  const { timelineEvents, plotCanvasNodes } = usePlotCanvasContext();

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
      case 'world-location':
        return <MapPin size={16} className="text-indigo-600" />;
      case 'world-object':
        return <Package size={16} className="text-yellow-600" />;
      default:
        return <Globe size={16} className="text-blue-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'world-location':
        return 'border-indigo-200 bg-indigo-50';
      case 'world-object':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'world-location':
        return 'Location';
      case 'world-object':
        return 'Object';
      default:
        return 'World Entity';
    }
  };

  const handleEntityClick = (entityId: string, entityType: string) => {
    console.log('Entity clicked:', entityId, 'Type:', entityType);
    if (entityType === 'WorldLocation' || entityType === 'WorldObject') {
      console.log('Navigating to world entity arc for:', entityId);
      if (!bookId || !versionId) {
        console.error('Missing bookId or versionId in the URL');
        return;
      }

      const url = `/plan/book/${bookId}/version/${versionId}?boards=plot-arcs&tab=world-entity-arcs&worldEntityId=${entityId}`;
      navigate(url);
    }

    if (data.onNavigateToEntity) {
      data.onNavigateToEntity(entityId);
    }
  };

  console.log('Rendering WorldEntityArcPlotNode:', data);

  return (
    <Card className={`min-w-[320px] max-w-[400px] shadow-lg border-2 hover:shadow-xl transition-shadow ${getTypeColor(data.type)}`}>
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
            {getNodeIcon(data.type)}
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-semibold truncate">{data.name}</CardTitle>
              <Badge variant="outline" className="text-xs mt-1">{getTypeLabel(data.type)}</Badge>
            </div>
          </div>
          <Badge className={`text-xs flex-shrink-0 ml-2 ${getStatusColor(data.status)}`}>
            {data.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Description */}
        {data.description && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Description</p>
            <p className="text-xs text-gray-700 line-clamp-2 bg-gray-50 p-2 rounded">
              {data.description}
            </p>
          </div>
        )}

        {/* Detail */}
        {data.detail && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Arc Detail</p>
            <p className="text-xs text-gray-700 line-clamp-2 bg-blue-50 p-2 rounded">
              {data.detail}
            </p>
          </div>
        )}

        {/* Goal */}
        {data.goal && (
          <div className="flex items-start gap-2">
            <Target size={12} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-1 flex-1">
              <p className="text-xs font-medium text-muted-foreground">Goal</p>
              <p className="text-xs text-gray-700 line-clamp-2">
                {data.goal}
              </p>
            </div>
          </div>
        )}

        {/* Rules and Beliefs */}
        {data.rulesAndBeliefs && data.rulesAndBeliefs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Rules & Beliefs</p>
            <div className="flex flex-wrap gap-1">
              {data.rulesAndBeliefs.slice(0, 3).map((rule, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {rule}
                </Badge>
              ))}
              {data.rulesAndBeliefs.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{data.rulesAndBeliefs.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Custom Attributes */}
        {data.customAttributes && Object.keys(data.customAttributes).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Attributes</p>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(data.customAttributes).slice(0, 4).map(([key, value]) => (
                <div key={key} className="bg-gray-50 p-1 rounded text-xs">
                  <span className="font-medium">{key}:</span> {String(value)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {data.history && data.history.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              History ({data.history.length} events)
            </p>
            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs text-gray-600">
                Latest: {data.history[0]?.event || 'No events'}
              </p>
            </div>
          </div>
        )}

        {/* Characters Section */}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEntityClick(character.id, 'Character');
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={character.image} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {character.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
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
                      handleEntityClick(character.id, 'Character');
                    }}
                  >
                    <ArrowRight size={12} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* World Entities Section */}
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
                  onClick={() => handleEntityClick(world.id, world.type)}
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
                      handleEntityClick(world.id, world.type);
                    }}
                  >
                    <ArrowRight size={12} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show linked node count if there are linked nodes */}
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
              data.onAddChild(data.id);
            }}
          >
            <Plus size={10} className="mr-1" />
            Add
          </Button>
        </div>
        
        {/* Delete Button */}
        <Button
          variant="destructive"
          size="sm"
          className="w-full mt-2"
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete && data.onDelete(data.id);
          }}
        >
          Delete Node
        </Button>
      </CardContent>
    </Card>
  );
};

export default WorldEntityArcPlotNode;
