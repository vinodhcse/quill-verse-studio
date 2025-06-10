
import { useState, useCallback } from 'react';
import { User, ChangeLog, EditMode, Comment } from '@/types/collaboration';

// Mock current user - in real app this would come from auth
const mockCurrentUser: User = {
  id: 'user_001',
  name: 'John Doe',
  role: 'editor',
  color: '#3b82f6'
};

export const useCollaboration = () => {
  const [currentUser] = useState<User>(mockCurrentUser);
  const [editMode, setEditMode] = useState<EditMode>('suggest');
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  const addChangeLog = useCallback((change: Omit<ChangeLog, 'id' | 'created_at'>) => {
    const newChange: ChangeLog = {
      ...change,
      id: `chg_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setChangeLogs(prev => [...prev, newChange]);
    return newChange;
  }, []);

  const acceptChange = useCallback((changeId: string) => {
    setChangeLogs(prev => 
      prev.map(change => 
        change.id === changeId 
          ? { ...change, status: 'accepted' as const }
          : change
      )
    );
  }, []);

  const rejectChange = useCallback((changeId: string) => {
    setChangeLogs(prev => 
      prev.map(change => 
        change.id === changeId 
          ? { ...change, status: 'rejected' as const }
          : change
      )
    );
  }, []);

  const addComment = useCallback((comment: Omit<Comment, 'id' | 'created_at' | 'replies'>) => {
    const newComment: Comment = {
      ...comment,
      id: `comment_${Date.now()}`,
      created_at: new Date().toISOString(),
      replies: [],
    };
    setComments(prev => [...prev, newComment]);
    return newComment;
  }, []);

  return {
    currentUser,
    editMode,
    setEditMode,
    changeLogs,
    comments,
    addChangeLog,
    acceptChange,
    rejectChange,
    addComment,
  };
};
