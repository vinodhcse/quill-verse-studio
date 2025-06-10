
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MessageSquare, Settings, Users } from 'lucide-react';
import { ChangesSidebar } from './ChangesSidebar';
import { useCollaboration } from '@/hooks/useCollaboration';

interface RightSidebarProps {
  mode: 'writing' | 'formatting' | 'review';
  isCollapsed: boolean;
  onToggle: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  mode,
  isCollapsed,
  onToggle
}) => {
  const [activeTab, setActiveTab] = useState<'changes' | 'settings' | 'users'>('changes');
  const {
    changeLogs,
    comments,
    acceptChange,
    rejectChange,
  } = useCollaboration();

  const mockBlockId = "block_001"; // This would come from the current selected block
  const blockChanges = changeLogs.filter(change => change.block_id === mockBlockId);
  const blockComments = comments.filter(comment => comment.block_id === mockBlockId);

  if (isCollapsed) {
    return (
      <div className="w-12 border-l flex flex-col items-center py-4 space-y-2 bg-background">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0"
          title="Expand sidebar"
        >
          <ChevronLeft size={16} />
        </Button>
        
        {mode === 'writing' && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Comments & Changes"
            >
              <MessageSquare size={16} />
            </Button>
            {blockChanges.length > 0 && (
              <div className="w-2 h-2 bg-destructive rounded-full" />
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="w-80 border-l bg-background flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Tools</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0"
        >
          <ChevronRight size={16} />
        </Button>
      </div>

      {mode === 'writing' && (
        <>
          <div className="flex border-b">
            <Button
              variant={activeTab === 'changes' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('changes')}
              className="flex-1 rounded-none"
            >
              <MessageSquare size={14} className="mr-1" />
              Changes
              {blockChanges.length > 0 && (
                <span className="ml-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {blockChanges.length}
                </span>
              )}
            </Button>
            <Button
              variant={activeTab === 'users' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('users')}
              className="flex-1 rounded-none"
            >
              <Users size={14} className="mr-1" />
              Users
            </Button>
            <Button
              variant={activeTab === 'settings' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('settings')}
              className="flex-1 rounded-none"
            >
              <Settings size={14} className="mr-1" />
              Settings
            </Button>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'changes' && (
              <ChangesSidebar
                changes={blockChanges}
                comments={blockComments}
                onAcceptChange={acceptChange}
                onRejectChange={rejectChange}
                showChanges={true}
                onToggleChanges={() => {}}
              />
            )}
            {activeTab === 'users' && (
              <div className="p-4">
                <h4 className="text-sm font-medium mb-2">Active Users</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">John Doe (Author)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Jane Smith (Editor)</span>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="p-4">
                <h4 className="text-sm font-medium mb-2">Editor Settings</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Font size: 16px</p>
                  <p>Line height: 1.6</p>
                  <p>Word wrap: On</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {mode === 'formatting' && (
        <div className="p-4">
          <h4 className="text-sm font-medium mb-2">Formatting Tools</h4>
          <p className="text-sm text-muted-foreground">Formatting options will appear here.</p>
        </div>
      )}

      {mode === 'review' && (
        <div className="p-4">
          <h4 className="text-sm font-medium mb-2">Review Tools</h4>
          <p className="text-sm text-muted-foreground">Review options will appear here.</p>
        </div>
      )}
    </div>
  );
};
