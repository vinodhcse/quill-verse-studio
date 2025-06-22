
import React from 'react';
import { useParams } from 'react-router-dom';
import { PlotCanvas } from '@/components/PlotCanvas';

const PlanPage: React.FC = () => {
  const { bookId, versionId } = useParams<{ bookId: string; versionId: string }>();

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Plot Planning Canvas</h1>
            <p className="text-muted-foreground">Organize your story structure</p>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <PlotCanvas bookId={bookId} />
      </div>
    </div>
  );
};

export default PlanPage;
