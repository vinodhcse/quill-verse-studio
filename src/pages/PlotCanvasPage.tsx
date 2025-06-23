
import React from 'react';
import { useParams } from 'react-router-dom';
import PlotCanvas from '@/components/PlotCanvas';

const PlotCanvasPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1">
        <PlotCanvas bookId={bookId} />
      </div>
    </div>
  );
};

export default PlotCanvasPage;
