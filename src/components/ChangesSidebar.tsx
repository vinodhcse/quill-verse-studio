
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChangeLog, Comment } from '@/types/collaboration';
import { Check, X, MessageSquare, User } from 'lucide-react';

interface ChangesSidebarProps {
  changes: ChangeLog[];
  comments: Comment[];
  onAcceptChange: (changeId: string) => void;
  onRejectChange: (changeId: string) => void;
  showChanges: boolean;
  onToggleChanges: () => void;
}

export const ChangesSidebar: React.FC<ChangesSidebarProps> = ({
  changes,
  comments,
  onAcceptChange,
  onRejectChange,
  showChanges,
  onToggleChanges
}) => {
  const pendingChanges = changes.filter(change => change.status === 'pending');
  const unresolvedComments = comments.filter(comment => !comment.resolved);

  if (!showChanges) {
    return (
      <div className="w-12 border-l flex flex-col items-center py-4 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleChanges}
          className="h-8 w-8 p-0"
          title="Show changes"
        >
          <MessageSquare size={16} />
        </Button>
        {pendingChanges.length > 0 && (
          <Badge variant="destructive" className="text-xs">
            {pendingChanges.length}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="w-80 border-l bg-background/50 flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Changes & Comments</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleChanges}
            className="h-8 w-8 p-0"
          >
            <X size={16} />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Pending Changes */}
          {pendingChanges.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Pending Changes</h4>
              <div className="space-y-2">
                {pendingChanges.map((change) => (
                  <Card key={change.id} className="text-sm">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {change.change_type}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onAcceptChange(change.id)}
                            className="h-6 w-6 p-0 text-green-600"
                            title="Accept change"
                          >
                            <Check size={12} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRejectChange(change.id)}
                            className="h-6 w-6 p-0 text-red-600"
                            title="Reject change"
                          >
                            <X size={12} />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-1">
                        {change.before_text && (
                          <div className="text-red-600 line-through text-xs">
                            "{change.before_text}"
                          </div>
                        )}
                        {change.after_text && (
                          <div className="text-green-600 text-xs">
                            "{change.after_text}"
                          </div>
                        )}
                        {change.comment && (
                          <div className="text-muted-foreground text-xs mt-1">
                            {change.comment}
                          </div>
                        )}
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <User size={10} className="mr-1" />
                          {change.user_id} • {new Date(change.created_at).toLocaleTimeString()}
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

          {pendingChanges.length === 0 && unresolvedComments.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              No pending changes or comments
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
