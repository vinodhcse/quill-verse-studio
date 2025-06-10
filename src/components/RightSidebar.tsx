
import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Wand2, BarChart3, MessageSquare, Settings } from 'lucide-react';
import { Mode } from './ModeNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RightSidebarProps {
  mode: Mode;
  isCollapsed: boolean;
  onToggle: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  mode,
  isCollapsed,
  onToggle,
}) => {
  const renderContent = () => {
    switch (mode) {
      case 'writing':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Wand2 size={14} />
                  <span>AI Assistant</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  Improve Grammar
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  Rephrase Selection
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  Generate Ideas
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <BarChart3 size={14} />
                  <span>Chapter Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Words:</span>
                  <span className="font-medium">2,340</span>
                </div>
                <div className="flex justify-between">
                  <span>Reading time:</span>
                  <span className="font-medium">9 min</span>
                </div>
                <div className="flex justify-between">
                  <span>Characters:</span>
                  <span className="font-medium">3</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'editing':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <MessageSquare size={14} />
                  <span>Recent Changes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { user: 'Alex', action: 'suggested edit', time: '2 min ago' },
                  { user: 'Maria', action: 'added comment', time: '5 min ago' },
                ].map((change, i) => (
                  <div key={i} className="text-xs p-2 bg-muted rounded">
                    <div className="font-medium">{change.user}</div>
                    <div className="text-muted-foreground">{change.action}</div>
                    <div className="text-muted-foreground">{change.time}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pending Suggestions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex space-x-1">
                  <Button size="sm" className="flex-1 text-xs">Accept</Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs">Reject</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'formatting':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Settings size={14} />
                  <span>Format Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  Typography
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  Layout
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  Export Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      
      default:
        return (
          <div className="text-sm text-muted-foreground">
            Tools for {mode} mode
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "border-l bg-background transition-all duration-300 flex flex-col",
        isCollapsed ? "w-12" : "w-64"
      )}
    >
      <div className="p-4 border-b flex items-center justify-between">
        <button
          onClick={onToggle}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          {isCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
        {!isCollapsed && (
          <h2 className="font-medium text-sm">Tools</h2>
        )}
      </div>
      
      {!isCollapsed && (
        <div className="flex-1 p-4 overflow-y-auto">
          {renderContent()}
        </div>
      )}
    </div>
  );
};
