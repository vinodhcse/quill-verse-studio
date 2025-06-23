
import React from 'react';
import { Mode } from './ModeNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IntegratedPlotCanvas } from './IntegratedPlotCanvas';

interface CenterPanelProps {
  mode: Mode;
}

export const CenterPanel: React.FC<CenterPanelProps> = ({ mode }) => {
  const renderContent = () => {
    switch (mode) {
      case 'writing':
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Writing Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Select a chapter from the left sidebar to start writing.
              </p>
            </CardContent>
          </Card>
        );
      
      case 'planning':
        return (
          <div className="h-full">
            <IntegratedPlotCanvas className="h-full" />
          </div>
        );
      
      case 'research':
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Research Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Research tools and resources will be available here.
              </p>
            </CardContent>
          </Card>
        );
      
      case 'review':
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Review Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Review and editing tools will be available here.
              </p>
            </CardContent>
          </Card>
        );
      
      default:
        return (
          <Card className="h-full">
            <CardContent className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Select a mode to begin</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="h-full">
      {renderContent()}
    </div>
  );
};
