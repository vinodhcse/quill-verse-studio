
import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  Edge,
} from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DeletableEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: any;
  targetPosition: any;
  style?: React.CSSProperties;
  markerEnd?: string;
  data?: {
    type?: 'parent-child' | 'linked';
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
  style = {},
  markerEnd,
  data,
}) => {
  const { setEdges, setNodes } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Remove the edge
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
    
    // Update nodes to remove linked relationships
    if (data?.type === 'linked') {
      const edgeParts = id.split('_');
      if (edgeParts.length >= 3) {
        const sourceId = edgeParts[1];
        const targetId = edgeParts[2];
        
        setNodes((nodes) => nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            linkedNodeIds: node.data.linkedNodeIds?.filter((linkId: string) => 
              linkId !== sourceId && linkId !== targetId
            ) || []
          }
        })));
      }
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
            variant="destructive"
            className="h-6 w-6 p-0 rounded-full opacity-70 hover:opacity-100"
            onClick={onEdgeClick}
          >
            <X size={12} />
          </Button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default DeletableEdge;
