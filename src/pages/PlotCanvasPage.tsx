
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import PlotCanvas from '@/components/PlotCanvas';
import { PlotCanvasProvider } from '@/contexts/PlotCanvasContext';
import { apiClient } from '@/lib/api';

const PlotCanvasPage: React.FC = () => {
  const { bookId, versionId } = useParams<{ bookId: string; versionId: string }>();
  const [canvasData, setCanvasData] = useState(null);

  const fetchCanvasData = async () => {
    if (!bookId || !versionId) return;

    try {
      const response = await apiClient.get(`/books/${bookId}/versions/${versionId}/plotCanvas`);
      setCanvasData(response.data);
    } catch (error) {
      console.error('Failed to fetch canvas data:', error);
      setCanvasData(null);
    }
  };

  const handleCanvasUpdate = async (data: any) => {
    if (!bookId || !versionId) return;

    try {
      await apiClient.put(`/books/${bookId}/versions/${versionId}/plotCanvas`, data);
      setCanvasData(data);
    } catch (error) {
      console.error('Failed to save canvas data:', error);
    }
  };

  useEffect(() => {
    fetchCanvasData();
  }, [bookId, versionId]);

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1">
        <PlotCanvasProvider bookId={bookId} versionId={versionId}>
          <ReactFlowProvider>
            <PlotCanvas
              bookId={bookId}
              versionId={versionId}
              canvasData={canvasData}
              onCanvasUpdate={handleCanvasUpdate}
            />
          </ReactFlowProvider>
        </PlotCanvasProvider>
      </div>
    </div>
  );
};

export default PlotCanvasPage;
