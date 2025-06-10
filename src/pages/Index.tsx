
import React, { useState } from 'react';
import { ModeNavigation, Mode } from '@/components/ModeNavigation';
import { LeftSidebar } from '@/components/LeftSidebar';
import { RightSidebar } from '@/components/RightSidebar';
import { CenterPanel } from '@/components/CenterPanel';
import { SidebarToggleButtons } from '@/components/SidebarToggleButtons';

const Index = () => {
  const [currentMode, setCurrentMode] = useState<Mode>('writing');
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/3 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-primary/2 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '8s' }} />
      </div>

      <div className="relative z-10">
        <ModeNavigation 
          currentMode={currentMode}
          onModeChange={setCurrentMode}
          leftSidebarCollapsed={leftSidebarCollapsed}
          rightSidebarCollapsed={rightSidebarCollapsed}
          onToggleLeftSidebar={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
          onToggleRightSidebar={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
        />
        
        <div className="relative h-[calc(100vh-57px)] w-full">
          <LeftSidebar
            mode={currentMode}
            isCollapsed={leftSidebarCollapsed}
            onToggle={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
          />
          
          <div className="h-full px-4">
            <CenterPanel mode={currentMode} />
          </div>
          
          <RightSidebar
            mode={currentMode}
            isCollapsed={rightSidebarCollapsed}
            onToggle={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
          />

          <SidebarToggleButtons
            leftSidebarCollapsed={leftSidebarCollapsed}
            rightSidebarCollapsed={rightSidebarCollapsed}
            onToggleLeftSidebar={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
            onToggleRightSidebar={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
