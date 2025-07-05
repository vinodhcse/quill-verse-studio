
import React, { useState } from 'react';
import { ModeNavigation, Mode } from '@/components/ModeNavigation';
import { LeftSidebar } from '@/components/LeftSidebar';
import { RightSidebar } from '@/components/RightSidebar';
import { CenterPanel } from '@/components/CenterPanel';
import { SidebarToggleButtons } from '@/components/SidebarToggleButtons';
import { useBookContext } from '@/lib/BookContextProvider';
import { ArrowUp } from 'lucide-react';
import AppHeader from '@/components/AppHeader';

const Index = () => {
  const { state, loading } = useBookContext();
  const [currentMode, setCurrentMode] = useState<Mode>('writing');
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  const handleModeChange = (mode: Mode) => {
    setCurrentMode(mode);
  };

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

      {/* App Header */}
      <div className="relative z-30">
        <AppHeader />
      </div>

      {/* Navigation */}
      <div className="relative z-30">
        <div className="backdrop-blur-md bg-background/80 border-b border-border/50 sticky top-16 z-30 animate-slide-down">
          <ModeNavigation 
            currentMode={currentMode}
            onModeChange={handleModeChange}
            leftSidebarCollapsed={leftSidebarCollapsed}
            rightSidebarCollapsed={rightSidebarCollapsed}
            onToggleLeftSidebar={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
            onToggleRightSidebar={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
          />
        </div>
      </div>
        
      {/* Main Content Area */}
      <div className="relative z-10 h-[calc(100vh-113px)] w-full flex">
        {/* Left Sidebar */}
        <div className={`transition-all duration-500 ease-in-out ${leftSidebarCollapsed ? 'w-0' : 'w-64'} flex-shrink-0`}>
          <LeftSidebar
            mode={currentMode}
            isCollapsed={leftSidebarCollapsed}
            onToggle={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
          />
        </div>
        
        {/* Center Panel */}
        <div className="flex-1 px-4 transition-all duration-500 ease-in-out">
          <div className="h-full animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <CenterPanel
              mode={currentMode}
            />
          </div>
        </div>
        
        {/* Right Sidebar */}
        <div className={`transition-all duration-500 ease-in-out ${rightSidebarCollapsed ? 'w-0' : 'w-80'} flex-shrink-0`}>
          <RightSidebar
            mode={currentMode}
            isCollapsed={rightSidebarCollapsed}
            onToggle={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
          />
        </div>

        {/* Sidebar Toggle Buttons */}
        <SidebarToggleButtons
          leftSidebarCollapsed={leftSidebarCollapsed}
          rightSidebarCollapsed={rightSidebarCollapsed}
          onToggleLeftSidebar={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
          onToggleRightSidebar={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
        />
      </div>

      {/* Scroll to Top Button */}
      <button
        className="fixed bottom-4 right-4 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/80 transition-all"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ArrowUp className="w-5 h-5" />
      </button>

      {/* Loading Spinner Overlay */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
          <div className="relative inline-block w-12 h-12">
            <span className="absolute inline-block w-full h-full border-4 border-t-primary border-b-secondary rounded-full animate-spin"></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
