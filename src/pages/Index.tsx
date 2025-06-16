
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import { LeftSidebar } from '@/components/LeftSidebar';
import { CenterPanel } from '@/components/CenterPanel';
import { RightSidebar } from '@/components/RightSidebar';
import { SidebarToggleButtons } from '@/components/SidebarToggleButtons';

type Mode = 'writing' | 'editing' | 'planning';

const Index = () => {
  const { bookId, versionId } = useParams();
  const [mode, setMode] = useState<Mode>('writing');
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [trackChanges, setTrackChanges] = useState(false);
  const [showComments, setShowComments] = useState(false);

  if (!bookId || !versionId) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Book or Version</h1>
          <p className="text-muted-foreground">Please check the URL and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background/95 to-background/90">
      <Header
        mode={mode}
        onModeChange={setMode}
        trackChanges={trackChanges}
        onTrackChangesChange={setTrackChanges}
        showComments={showComments}
        onShowCommentsChange={setShowComments}
      />
      
      <div className="flex-1 flex overflow-hidden relative">
        <SidebarToggleButtons
          leftSidebarCollapsed={!showLeftSidebar}
          rightSidebarCollapsed={!showRightSidebar}
          onToggleLeftSidebar={() => setShowLeftSidebar(!showLeftSidebar)}
          onToggleRightSidebar={() => setShowRightSidebar(!showRightSidebar)}
        />
        
        {showLeftSidebar && (
          <div className="w-80 border-r border-border/50 bg-background/80 backdrop-blur-md">
            <LeftSidebar 
              mode={mode} 
              isCollapsed={false}
              onToggle={() => setShowLeftSidebar(false)}
            />
          </div>
        )}
        
        <div className="flex-1 relative">
          <CenterPanel
            mode={mode}
            trackChanges={trackChanges}
            showComments={showComments}
          />
        </div>
        
        {showRightSidebar && (
          <div className="w-80 border-l border-border/50 bg-background/80 backdrop-blur-md">
            <RightSidebar
              mode={mode}
              isCollapsed={false}
              onToggle={() => setShowRightSidebar(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
