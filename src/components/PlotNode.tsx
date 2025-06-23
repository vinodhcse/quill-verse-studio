
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Plus } from 'lucide-react';
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
    <Card className="min-w-[200px] shadow-lg border-2 hover:shadow-xl transition-shadow">
      <Handle type="target" position={Position.Top} />
      
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
        
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => data.onEdit(data.id)}
          >
            <Edit size={10} className="mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => data.onAddChild(data.id)}
          >
            <Plus size={10} className="mr-1" />
            Add
          </Button>
        </div>
      </CardContent>
      
      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
};

export default PlotNode;
