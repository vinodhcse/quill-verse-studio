
import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
} from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { X, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DeletableEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: any;
  targetPosition: any;
  source: string;
  target: string;
  style?: React.CSSProperties;
  markerEnd?: string;
  data?: {
    type?: 'parent-child' | 'linked';
    onConvertEdge?: (edgeId: string, action: string) => void;
  };
}

const DeletableEdge: React.FC<DeletableEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  source,
  target,
  style = {},
  markerEnd,
  data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('Delete button clicked for edge:', id);
    
    // Notify parent component about the deletion
    if (data?.onConvertEdge) {
      console.log('Calling onConvertEdge for deletion');
      data.onConvertEdge(id, 'delete');
    }
  };

  const onConvertEdge = (event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('Convert button clicked for edge:', id, 'current type:', data?.type);
    
    if (data?.onConvertEdge) {
      const currentType = data?.type || 'linked';
      const newType = currentType === 'parent-child' ? 'linked' : 'parent-child';
      console.log('Converting to:', newType);
      data.onConvertEdge(id, newType);
    }
  };

  const edgeType = data?.type || 'linked';
  const edgeColor = edgeType === 'parent-child' ? '#10b981' : '#6366f1';

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          className="absolute pointer-events-auto flex items-center gap-2"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          <Badge 
            variant="secondary" 
            className="text-xs px-2 py-1"
            style={{ backgroundColor: edgeColor, color: 'white' }}
          >
            {edgeType === 'parent-child' ? 'Child' : 'Link'}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            className="h-6 w-6 p-0 rounded-full opacity-70 hover:opacity-100"
            onClick={onConvertEdge}
            title={`Convert to ${edgeType === 'parent-child' ? 'Link' : 'Child'}`}
          >
            <ArrowUpDown size={10} />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="h-6 w-6 p-0 rounded-full opacity-70 hover:opacity-100"
            onClick={onEdgeDelete}
            title="Delete edge"
          >
            <X size={12} />
          </Button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default DeletableEdge;
