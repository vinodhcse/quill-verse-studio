
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MessageSquare, Settings, Users } from 'lucide-react';
import { ChangesSidebar } from './ChangesSidebar';
import { useCollaboration } from '@/hooks/useCollaboration';
import { Mode } from './ModeNavigation';
import { cn } from '@/lib/utils';

interface Change {
  id: string;
  type: 'insertion' | 'deletion';
  text: string;
  user: string;
  userId: string;
  timestamp: number;
  changeData: any;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  resolved: boolean;
  block_id: string;
}

interface RightSidebarProps {
  mode: Mode;
  isCollapsed: boolean;
  onToggle: () => void;
  extractedChanges?: Change[];
  onAcceptChange?: (changeId: string) => void;
  onRejectChange?: (changeId: string) => void;
  onChangeClick?: (changeId: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  mode,
  isCollapsed,
  onToggle,
  extractedChanges = [],
  onAcceptChange,
  onRejectChange,
  onChangeClick,
}) => {
  const [activeTab, setActiveTab] = useState<'changes' | 'settings' | 'users'>('changes');
  const {
    changeLogs,
    comments,
    acceptChange,
    rejectChange,
  } = useCollaboration();

  const mockBlockId = "block_001";
  // Fix the type issue by ensuring all required properties exist
  const blockComments: Comment[] = comments
    .filter(comment => comment.block_id === mockBlockId)
    .map(comment => ({
      id: comment.id,
      content: comment.content,
      user_id: comment.user_id || 'unknown',
      created_at: comment.created_at,
      resolved: comment.resolved || false,
      block_id: comment.block_id
    }));

  if (isCollapsed) return null;

  return (
    <div className="h-full bg-background/80 backdrop-blur-md border-l border-border/50 overflow-hidden">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="font-semibold text-lg">Tools</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0 rounded-lg hover:bg-accent/50"
          title="Collapse sidebar"
        >
          <ChevronRight size={16} />
        </Button>
      </div>

      {(mode === 'writing' || mode === 'editing') && (
        <>
          <div className="flex border-b border-border/50 bg-muted/30">
            <Button
              variant={activeTab === 'changes' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('changes')}
              className="flex-1 rounded-none h-10"
            >
              <MessageSquare size={14} className="mr-1" />
              Changes
              {extractedChanges.length > 0 && (
                <span className="ml-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {extractedChanges.length}
                </span>
              )}
            </Button>
            <Button
              variant={activeTab === 'users' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('users')}
              className="flex-1 rounded-none h-10"
            >
              <Users size={14} className="mr-1" />
              Users
            </Button>
            <Button
              variant={activeTab === 'settings' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('settings')}
              className="flex-1 rounded-none h-10"
            >
              <Settings size={14} className="mr-1" />
              Settings
            </Button>
          </div>

          <div className="flex-1 overflow-hidden h-[calc(100%-113px)]">
            {activeTab === 'changes' && (
              <ChangesSidebar
                changes={extractedChanges}
                comments={blockComments}
                onAcceptChange={onAcceptChange || acceptChange}
                onRejectChange={onRejectChange || rejectChange}
                onChangeClick={onChangeClick}
                showChanges={true}
                onToggleChanges={() => {}}
              />
            )}
            {activeTab === 'users' && (
              <div className="p-4">
                <h4 className="text-sm font-medium mb-3">Active Users</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <span className="text-sm font-medium">John Doe</span>
                      <p className="text-xs text-muted-foreground">Author</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <span className="text-sm font-medium">Jane Smith</span>
                      <p className="text-xs text-muted-foreground">Editor</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="p-4">
                <h4 className="text-sm font-medium mb-3">Editor Settings</h4>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Font size: 16px</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Line height: 1.6</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Word wrap: On</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {mode === 'planning' && (
        <div className="p-4">
          <h4 className="text-sm font-medium mb-2">Planning Tools</h4>
          <p className="text-sm text-muted-foreground">Planning options will appear here.</p>
        </div>
      )}
    </div>
  );
};
