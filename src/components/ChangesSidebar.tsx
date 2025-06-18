
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, User } from 'lucide-react';
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

interface ChangesSidebarProps {
  changes: Change[];
  comments: Comment[];
  onAcceptChange: (changeId: string) => void;
  onRejectChange: (changeId: string) => void;
  onChangeClick?: (changeId: string) => void;
  focusedChangeId?: string | null;
  showChanges: boolean;
  onToggleChanges: () => void;
}

export const ChangesSidebar: React.FC<ChangesSidebarProps> = ({
  changes,
  comments,
  onAcceptChange,
  onRejectChange,
  onChangeClick,
  focusedChangeId,
}) => {
  const unresolvedComments = comments.filter(comment => !comment.resolved);

  const handleChangeClick = (changeId: string) => {
    if (onChangeClick) {
      onChangeClick(changeId);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Pending Changes */}
          {changes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Track Changes ({changes.length})</h4>
              <div className="space-y-2">
                {changes.map((change) => (
                  <Card 
                    key={change.id} 
                    data-sidebar-change-id={change.id}
                    className={cn(
                      "text-sm cursor-pointer transition-colors",
                      focusedChangeId === change.id 
                        ? "ring-2 ring-primary bg-primary/5" 
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => handleChangeClick(change.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            change.type === 'insertion' 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {change.type}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAcceptChange(change.id);
                            }}
                            className="h-6 w-6 p-0 text-green-600 hover:bg-green-100"
                            title="Accept change"
                          >
                            <Check size={12} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRejectChange(change.id);
                            }}
                            className="h-6 w-6 p-0 text-red-600 hover:bg-red-100"
                            title="Reject change"
                          >
                            <X size={12} />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-1">
                        <div className={`text-xs p-2 rounded ${
                          change.type === 'insertion' 
                            ? 'bg-green-50 text-green-800 border border-green-200' 
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                          {change.type === 'insertion' ? '+ ' : '- '}"{change.text}"
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <User size={10} className="mr-1" />
                          <span className="font-medium">{change.user}</span>
                          <span className="mx-1">•</span>
                          <span>{new Date(change.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          {unresolvedComments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Comments</h4>
              <div className="space-y-2">
                {unresolvedComments.map((comment) => (
                  <Card key={comment.id} className="text-sm">
                    <CardContent className="p-3">
                      <div className="space-y-1">
                        <div className="text-xs">{comment.content}</div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <User size={10} className="mr-1" />
                          {comment.user_id} • {new Date(comment.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {changes.length === 0 && unresolvedComments.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              No pending changes or comments
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
