
import React, { createContext, useContext, useState, useEffect } from 'react';
import { PlotCanvasData, TimelineEvent, CanvasNode } from '@/types/plotCanvas';
import { apiClient } from '@/lib/api';

interface PlotCanvasContextType {
  plotCanvasData: PlotCanvasData;
  timelineEvents: TimelineEvent[];
  plotCanvasNodes: CanvasNode[];
  loading: boolean;
  error: string | null;
  refreshPlotCanvasData: () => Promise<void>;
}

const PlotCanvasContext = createContext<PlotCanvasContextType | undefined>(undefined);

interface PlotCanvasProviderProps {
  children: React.ReactNode;
  bookId?: string;
  versionId?: string;
}

export const PlotCanvasProvider: React.FC<PlotCanvasProviderProps> = ({ 
  children, 
  bookId, 
  versionId 
}) => {
  const [plotCanvasData, setPlotCanvasData] = useState<PlotCanvasData>({
    nodes: [],
    edges: [],
    timelineEvents: [],
    lastUpdated: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlotCanvasData = async () => {
    if (!bookId || !versionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get(`/books/${bookId}/versions/${versionId}/plotCanvas`);
      if (response.data) {
        setPlotCanvasData(response.data);
        console.log('PlotCanvasProvider: Fetched plot canvas data:', response.data);
      }
    } catch (err) {
      console.error('PlotCanvasProvider: Failed to fetch plot canvas data:', err);
      setError('Failed to fetch plot canvas data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlotCanvasData();
  }, [bookId, versionId]);

  const refreshPlotCanvasData = async () => {
    await fetchPlotCanvasData();
  };

  const value: PlotCanvasContextType = {
    plotCanvasData,
    timelineEvents: plotCanvasData.timelineEvents || [],
    plotCanvasNodes: plotCanvasData.nodes || [],
    loading,
    error,
    refreshPlotCanvasData
  };

  return (
    <PlotCanvasContext.Provider value={value}>
      {children}
    </PlotCanvasContext.Provider>
  );
};

export const usePlotCanvasContext = () => {
  const context = useContext(PlotCanvasContext);
  if (context === undefined) {
    throw new Error('usePlotCanvasContext must be used within a PlotCanvasProvider');
  }
  return context;
};
