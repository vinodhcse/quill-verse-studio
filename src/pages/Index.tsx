
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
      {/* Enhanced animated background elements with Apple-style floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary floating orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary/8 to-accent/8 rounded-full blur-3xl animate-pulse floating" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-accent/6 to-secondary/6 rounded-full blur-3xl animate-pulse floating-delayed" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-br from-primary/4 to-accent/4 rounded-full blur-2xl animate-pulse floating" style={{ animationDelay: '4s' }} />
        
        {/* Additional floating particles for depth */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-primary/3 rounded-full blur-xl floating" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-accent/4 rounded-full blur-xl floating-delayed" style={{ animationDelay: '3s' }} />
        <div className="absolute top-3/4 right-1/3 w-20 h-20 bg-secondary/5 rounded-full blur-lg floating" style={{ animationDelay: '5s' }} />
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_1px_1px,_rgb(255,255,255)_1px,_transparent_0)] bg-[length:40px_40px]" />
      </div>

      <div className="relative z-10">
        <div className="backdrop-blur-md bg-background/80 border-b border-border/50 sticky top-0 z-20 animate-slide-down">
          <ModeNavigation 
            currentMode={currentMode}
            onModeChange={setCurrentMode}
            leftSidebarCollapsed={leftSidebarCollapsed}
            rightSidebarCollapsed={rightSidebarCollapsed}
            onToggleLeftSidebar={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
            onToggleRightSidebar={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
          />
        </div>
        
        <div className="relative h-[calc(100vh-57px)] w-full">
          <div className={`transition-all duration-500 ease-in-out transform ${leftSidebarCollapsed ? 'translate-x-0' : 'translate-x-0'}`}>
            <LeftSidebar
              mode={currentMode}
              isCollapsed={leftSidebarCollapsed}
              onToggle={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
            />
          </div>
          
          <div className="h-full px-4 transition-all duration-500 ease-in-out">
            <div className="h-full animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <CenterPanel mode={currentMode} />
            </div>
          </div>
          
          <div className={`transition-all duration-500 ease-in-out transform ${rightSidebarCollapsed ? 'translate-x-0' : 'translate-x-0'}`}>
            <RightSidebar
              mode={currentMode}
              isCollapsed={rightSidebarCollapsed}
              onToggle={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
            />
          </div>

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
