
import React, { useEffect, useState } from 'react';
import { PlotCanvas } from './PlotCanvas';
import { useBookContext } from '@/lib/BookContextProvider';
import { CanvasData } from '@/types/canvas';

interface IntegratedPlotCanvasProps {
  className?: string;
}

export const IntegratedPlotCanvas: React.FC<IntegratedPlotCanvasProps> = ({ className }) => {
  const { state, updatePlotCanvasData } = useBookContext();
  const [localCanvasData, setLocalCanvasData] = useState<CanvasData | null>(null);

  useEffect(() => {
    if (state.plotCanvasData) {
      setLocalCanvasData(state.plotCanvasData);
    }
  }, [state.plotCanvasData]);

  const handleCanvasDataUpdate = async (data: CanvasData) => {
    try {
      await updatePlotCanvasData(data);
      setLocalCanvasData(data);
    } catch (error) {
      console.error('Failed to save canvas data:', error);
    }
  };

  if (!state.bookId || !state.versionId) {
    return (
      <div className={`flex items-center justify-center h-full ${className || ''}`}>
        <div className="text-muted-foreground">Loading plot canvas...</div>
      </div>
    );
  }

  return (
    <div className={`h-full ${className || ''}`}>
      <PlotCanvas 
        bookId={`${state.bookId}_${state.versionId}`}
        initialData={localCanvasData}
        onDataUpdate={handleCanvasDataUpdate}
      />
    </div>
  );
};
