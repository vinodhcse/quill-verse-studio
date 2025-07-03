
import React, { useState } from 'react';
import { QuickNodeModal } from '@/components/QuickNodeModal';
import { CanvasNode, PlotCanvasData } from '@/types/plotCanvas';

interface CharacterArcPlotCanvasProps {
  canvasData: PlotCanvasData;
  onCanvasUpdate: (data: PlotCanvasData) => void;
}

const CharacterArcPlotCanvas: React.FC<CharacterArcPlotCanvasProps> = ({
  canvasData,
  onCanvasUpdate
}) => {
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickModalPosition, setQuickModalPosition] = useState({ x: 0, y: 0 });
  const [currentViewNodeId, setCurrentViewNodeId] = useState<string | null>(null);

  const handleQuickNodeSave = async (
    nodeData: any,
    position: { x: number; y: number },
    parentNodeId?: string
  ) => {
    if (!canvasData) return;

    const newNodeId = `node-${Date.now()}`;
    const newNode: CanvasNode = {
      id: newNodeId,
      type: nodeData.type || 'Character',
      name: nodeData.name || 'New Node',
      detail: nodeData.detail || '',
      goal: nodeData.goal || '',
      status: nodeData.status || 'Not Completed',
      timelineEventIds: [],
      parentId: parentNodeId || null,
      childIds: [],
      linkedNodeIds: [],
      position
    };

    const updatedNodes = [...canvasData.nodes, newNode];

    if (parentNodeId) {
      const parentIndex = updatedNodes.findIndex(n => n.id === parentNodeId);
      if (parentIndex >= 0) {
        updatedNodes[parentIndex].childIds.push(newNodeId);
      }
    }

    const newCanvasData = { ...canvasData, nodes: updatedNodes };
    await onCanvasUpdate(newCanvasData);
    setShowQuickModal(false);
  };

  const handlePaneClick = (event: any, sourceNodeId?: string) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    console.log('Pane clicked at:', event.clientX, event.clientY, 'Bounds:', bounds, 'Source Node ID:', sourceNodeId);
    setQuickModalPosition({ 
      x: event.clientX - bounds.left, 
      y: event.clientY - bounds.top 
    });
    setShowQuickModal(true);
    setCurrentViewNodeId(sourceNodeId || null);
  };

  return (
    <>
      <QuickNodeModal 
        isOpen={showQuickModal}
        position={quickModalPosition}
        onClose={() => setShowQuickModal(false)}
        onSave={(nodeData, position) => handleQuickNodeSave(nodeData, position, currentViewNodeId)}
      />
    </>
  );
};

export default CharacterArcPlotCanvas;
