
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Plus, Users, Globe } from 'lucide-react';
import { PlotNodeData } from '@/types/plotCanvas';

interface PlotNodeProps extends NodeProps {
  data: PlotNodeData;
}

const PlotNode: React.FC<PlotNodeProps> = ({ data }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'not-started':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'act':
        return '📚';
      case 'chapter':
        return '📄';
      case 'scene':
        return '🎬';
      case 'beat':
        return '🎵';
      default:
        return '📝';
    }
  };

  return (
    <Card className="min-w-[220px] shadow-lg border-2 hover:shadow-xl transition-shadow">
      {/* Single handles on each side that accept multiple connections */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top"
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      
      <Handle 
        type="target" 
        position={Position.Left} 
        id="left"
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right"
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom"
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getNodeIcon(data.type)}</span>
            <CardTitle className="text-sm font-semibold">{data.name}</CardTitle>
          </div>
          <Badge className={`text-xs ${getStatusColor(data.status)}`}>
            {data.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {data.detail && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {data.detail}
          </p>
        )}

        {/* Characters and Worlds indicators */}
        <div className="flex flex-wrap gap-1 mb-3">
          {data.characters && data.characters.length > 0 && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Users size={8} />
              {data.characters.length}
            </Badge>
          )}
          {data.worlds && data.worlds.length > 0 && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Globe size={8} />
              {data.worlds.length}
            </Badge>
          )}
        </div>
        
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Edit button clicked for node:', data.id);
              data.onEdit(data.id);
            }}
          >
            <Edit size={10} className="mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Add button clicked for node:', data.id);
              data.onAddChild(data.id);
            }}
          >
            <Plus size={10} className="mr-1" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlotNode;
