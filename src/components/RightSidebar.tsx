import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MessageSquare, Settings, Users } from 'lucide-react';
import { ChangesSidebar } from './ChangesSidebar';
import { useCollaboration } from '@/hooks/useCollaboration';
import { useBookContext } from '@/lib/BookContextProvider';
import { Mode } from './ModeNavigation';
import { extractChangesFromContent } from '@/utils/trackChangesUtils';
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
  onChangeClick?: (changeId: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  mode,
  isCollapsed,
  onToggle,
  onChangeClick,
}) => {
  const [activeTab, setActiveTab] = useState<'changes' | 'settings' | 'users'>('changes');
  const [extractedChanges, setExtractedChanges] = useState<Change[]>([]);
  const [focusedChangeId, setFocusedChangeId] = useState<string | null>(null);
  
  const { state } = useBookContext();
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

  // Extract changes from the selected chapter content
  useEffect(() => {
    console.log('RightSidebar: useEffect triggered for chapter content extraction');
    console.log('Selected chapter:', state.selectedChapter);
    
    if (state.selectedChapter?.content) {
      console.log('RightSidebar: Chapter content found, extracting changes');
      console.log('Chapter content type:', typeof state.selectedChapter.content);
      console.log('Chapter content structure:', JSON.stringify(state.selectedChapter.content, null, 2));
      
      const changes = extractChangesFromContent(state.selectedChapter.content);
      console.log('RightSidebar: Extracted changes:', changes);
      console.log('RightSidebar: Number of changes found:', changes.length);
      
      setExtractedChanges(changes);
    } else {
      console.log('RightSidebar: No chapter content available');
      console.log('Available state:', state);
      setExtractedChanges([]);
    }
  }, [state.selectedChapter?.content, state.selectedChapter?.id]);

  // Listen for changes from the editor directly and update the list
  useEffect(() => {
    const handleEditorChanges = (event: CustomEvent) => {
      console.log('RightSidebar: Received editor changes event:', event.detail);
      const changes = event.detail.changes || [];
      setExtractedChanges(changes);
    };

    const handleChangeAccepted = (event: CustomEvent) => {
      const changeId = event.detail.changeId;
      console.log('RightSidebar: Change accepted, removing from list:', changeId);
      setExtractedChanges(prev => prev.filter(change => change.id !== changeId));
    };

    const handleChangeRejected = (event: CustomEvent) => {
      const changeId = event.detail.changeId;
      console.log('RightSidebar: Change rejected, removing from list:', changeId);
      setExtractedChanges(prev => prev.filter(change => change.id !== changeId));
    };

    window.addEventListener('editorChangesUpdate', handleEditorChanges as EventListener);
    window.addEventListener('changeAccepted', handleChangeAccepted as EventListener);
    window.addEventListener('changeRejected', handleChangeRejected as EventListener);
    
    return () => {
      window.removeEventListener('editorChangesUpdate', handleEditorChanges as EventListener);
      window.removeEventListener('changeAccepted', handleChangeAccepted as EventListener);
      window.removeEventListener('changeRejected', handleChangeRejected as EventListener);
    };
  }, []);

  // Listen for change focus events from the editor
  useEffect(() => {
    const handleChangeFocus = (event: CustomEvent) => {
      const changeId = event.detail.changeId;
      console.log('RightSidebar: Received focus event for change:', changeId);
      setFocusedChangeId(changeId);
      // Scroll to the change in the sidebar
      setTimeout(() => {
        const changeElement = document.querySelector(`[data-sidebar-change-id="${changeId}"]`);
        if (changeElement) {
          changeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    };

    window.addEventListener('changeFocus', handleChangeFocus as EventListener);
    return () => {
      window.removeEventListener('changeFocus', handleChangeFocus as EventListener);
    };
  }, []);

  const handleChangeClick = (changeId: string) => {
    console.log('RightSidebar: Change clicked:', changeId);
    setFocusedChangeId(changeId);
    
    // Dispatch custom event to focus the change in the editor
    window.dispatchEvent(new CustomEvent('focusChange', {
      detail: { changeId }
    }));
    
    if (onChangeClick) {
      onChangeClick(changeId);
    }
  };

  const handleAcceptChange = (changeId: string) => {
    console.log('RightSidebar: Accepting change:', changeId);
    // Dispatch event to editor to handle the change acceptance
    window.dispatchEvent(new CustomEvent('acceptChange', {
      detail: { changeId }
    }));
    acceptChange(changeId);
    
    // Remove from local state immediately for better UX
    setExtractedChanges(prev => prev.filter(change => change.id !== changeId));
  };

  const handleRejectChange = (changeId: string) => {
    console.log('RightSidebar: Rejecting change:', changeId);
    // Dispatch event to editor to handle the change rejection
    window.dispatchEvent(new CustomEvent('rejectChange', {
      detail: { changeId }
    }));
    rejectChange(changeId);
    
    // Remove from local state immediately for better UX
    setExtractedChanges(prev => prev.filter(change => change.id !== changeId));
  };

  if (isCollapsed) return null;

  return (
    <div className="h-full bg-background/80 backdrop-blur-md border-l border-border/50 overflow-hidden flex flex-col">
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

          <div className="flex-1 overflow-hidden">
            {activeTab === 'changes' && (
              <div className="h-full flex flex-col">
                {extractedChanges.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    <p>No track changes found in this chapter.</p>
                    <p className="text-xs mt-1">Make some edits with track changes enabled to see them here.</p>
                  </div>
                )}
                <ChangesSidebar
                  changes={extractedChanges}
                  comments={blockComments}
                  onAcceptChange={handleAcceptChange}
                  onRejectChange={handleRejectChange}
                  onChangeClick={handleChangeClick}
                  focusedChangeId={focusedChangeId}
                  showChanges={true}
                  onToggleChanges={() => {}}
                />
              </div>
            )}
            {activeTab === 'users' && (
              <div className="p-4 h-full overflow-y-auto">
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
              <div className="p-4 h-full overflow-y-auto">
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
        <div className="p-4 h-full overflow-y-auto">
          <h4 className="text-sm font-medium mb-2">Planning Tools</h4>
          <p className="text-sm text-muted-foreground">Planning options will appear here.</p>
        </div>
      )}
    </div>
  );
};
