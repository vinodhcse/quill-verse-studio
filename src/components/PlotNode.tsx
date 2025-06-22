
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { CanvasNode } from '@/types/canvas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlotNodeData {
  onEdit: (nodeId: string) => void;
  onAddChild: (parentId: string) => void;
}

const PlotNode = memo(({ data }: NodeProps<CanvasNode & PlotNodeData>) => {
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'Outline':
        return 'bg-purple-100 border-purple-300';
      case 'Act':
        return 'bg-blue-100 border-blue-300';
      case 'Chapter':
        return 'bg-green-100 border-green-300';
      case 'SceneBeats':
        return 'bg-yellow-100 border-yellow-300';
      case 'Character':
        return 'bg-pink-100 border-pink-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Completed' ? 'bg-green-500' : 'bg-orange-500';
  };

  return (
    <Card 
      className={cn(
        'min-w-[200px] max-w-[250px] shadow-lg relative',
        getNodeColor(data.type)
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {data.type}
          </Badge>
          <Badge 
            className={cn('text-white text-xs', getStatusColor(data.status))}
          >
            {data.status}
          </Badge>
        </div>
        <CardTitle className="text-sm font-semibold line-clamp-2">
          {data.name}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        {data.detail && (
          <p className="text-xs text-muted-foreground line-clamp-3 mb-2">
            {data.detail}
          </p>
        )}
        
        <div className="flex gap-1 mt-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2"
            onClick={() => data.onEdit(data.id)}
          >
            <Edit size={12} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2"
            onClick={() => data.onAddChild(data.id)}
          >
            <Plus size={12} />
          </Button>
        </div>
      </CardContent>

      {/* Single handle on each side that acts as both source and target */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="w-4 h-4 !bg-blue-500 !border-blue-700"
        style={{ top: -8, left: '50%', transform: 'translateX(-50%)' }}
      />
      
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-4 h-4 !bg-blue-500 !border-blue-700"
        style={{ top: -8, left: '50%', transform: 'translateX(-50%)' }}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-4 h-4 !bg-blue-500 !border-blue-700"
        style={{ right: -8, top: '50%', transform: 'translateY(-50%)' }}
      />
      
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className="w-4 h-4 !bg-blue-500 !border-blue-700"
        style={{ right: -8, top: '50%', transform: 'translateY(-50%)' }}
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-4 h-4 !bg-blue-500 !border-blue-700"
        style={{ bottom: -8, left: '50%', transform: 'translateX(-50%)' }}
      />
      
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className="w-4 h-4 !bg-blue-500 !border-blue-700"
        style={{ bottom: -8, left: '50%', transform: 'translateX(-50%)' }}
      />
      
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="w-4 h-4 !bg-blue-500 !border-blue-700"
        style={{ left: -8, top: '50%', transform: 'translateY(-50%)' }}
      />
      
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-4 h-4 !bg-blue-500 !border-blue-700"
        style={{ left: -8, top: '50%', transform: 'translateY(-50%)' }}
      />
    </Card>
  );
});

PlotNode.displayName = 'PlotNode';

export default PlotNode;
