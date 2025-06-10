
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
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
  );
};

export default Index;
