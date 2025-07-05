
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PenTool, User, Settings, LogOut, Sun, Moon, Monitor, ArrowUp } from 'lucide-react';
import { ModeNavigation, Mode } from '@/components/ModeNavigation';
import { LeftSidebar } from '@/components/LeftSidebar';
import { RightSidebar } from '@/components/RightSidebar';
import { CenterPanel } from '@/components/CenterPanel';
import { SidebarToggleButtons } from '@/components/SidebarToggleButtons';
import { useBookContext } from '@/lib/BookContextProvider';
import { useUserContext } from '@/lib/UserContextProvider';
import { useTheme } from '@/components/ThemeProvider';

const Index = () => {
  const { state, loading } = useBookContext();
  const { name, email } = useUserContext();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [currentMode, setCurrentMode] = useState<Mode>('writing');
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  const handleModeChange = (mode: Mode) => {
    setCurrentMode(mode);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.length > 1 
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : names[0][0].toUpperCase();
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

      {/* Updated Header with AppHeader sections */}
      <header className="relative z-30 sticky top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo - Left Section from AppHeader */}
            <Link to="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <PenTool className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                AuthorStudio
              </span>
            </Link>

            {/* Right side actions - Right Section from AppHeader */}
            <div className="flex items-center space-x-2">
              {/* Theme Toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border border-border shadow-lg">
                  <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
                    <Monitor className="mr-2 h-4 w-4" />
                    System
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="" alt={name || 'User'} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {getInitials(name || 'User')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-background border border-border shadow-lg" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {name && <p className="font-medium">{name}</p>}
                      {email && <p className="w-[200px] truncate text-sm text-muted-foreground">{email}</p>}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/account">
                      <User className="mr-2 h-4 w-4" />
                      Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

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
