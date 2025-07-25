
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import PlotCanvas from '@/components/PlotCanvas';
import { apiClient } from '@/lib/api';

const PlotCanvasPage: React.FC = () => {
  const { bookId, versionId } = useParams<{ bookId: string; versionId: string }>();
  const [canvasData, setCanvasData] = useState(null);

  const fetchCanvasData = async () => {
    if (!bookId || !versionId) return;

    try {
      const response = await apiClient.get(`/books/${bookId}/versions/${versionId}/plotCanvas`);
      console.log('Fetched canvas data:', response.data);
      setCanvasData(response.data);
    } catch (error) {
      console.error('Failed to fetch canvas data:', error);
      setCanvasData(null);
    }
  };

  const handleCanvasUpdate = async (data: any) => {
    console.log('Saving canvas data:', data);
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
        <ReactFlowProvider>
          <PlotCanvas
            bookId={bookId}
            versionId={versionId}
            canvasData={canvasData}
            onCanvasUpdate={handleCanvasUpdate}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default PlotCanvasPage;
