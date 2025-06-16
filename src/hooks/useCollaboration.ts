
import { useState, useEffect } from 'react';
import { User, Comment, Change, ChangeLog } from '../types/collaboration';

export const useCollaboration = (documentId?: string) => {
  const [activeUsers, setActiveUsers] = useState<User[]>([
    { 
      id: '1', 
      name: 'Current User', 
      email: 'user@example.com',
      role: 'editor' as const, 
      color: '#3b82f6',
      isOnline: true
    }
  ]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);

  useEffect(() => {
    if (!documentId) return;

    // Simulate fetching active users, comments, and changes from an API
    const fetchInitialData = async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulate fetched data
      const fetchedUsers: User[] = [
        { id: '2', name: 'Alice', email: 'alice@example.com', role: 'reviewer' as const, color: '#4ade80', isOnline: true },
        { id: '3', name: 'Bob', email: 'bob@example.com', role: 'author' as const, color: '#f472b6', isOnline: false, lastSeen: '2024-04-28T10:00:00Z' },
      ];
      const fetchedComments: Comment[] = [
        { 
          id: 'comment1', 
          content: 'This is a great point!', 
          author: fetchedUsers[0], 
          timestamp: '2024-04-29T14:30:00Z', 
          position: 120,
          user_id: fetchedUsers[0].id,
          created_at: '2024-04-29T14:30:00Z',
          block_id: 'block_001'
        },
        { 
          id: 'comment2', 
          content: 'I disagree with this statement.', 
          author: fetchedUsers[1], 
          timestamp: '2024-04-29T15:00:00Z', 
          position: 250,
          user_id: fetchedUsers[1].id,
          created_at: '2024-04-29T15:00:00Z',
          block_id: 'block_001'
        },
      ];
      const fetchedChanges: Change[] = [
        { id: 'change1', type: 'insert', content: 'very', author: fetchedUsers[0], timestamp: '2024-04-29T16:00:00Z', position: 80 },
        { id: 'change2', type: 'delete', content: 'unnecessary', author: fetchedUsers[1], timestamp: '2024-04-29T16:30:00Z', position: 150 },
      ];
      const fetchedChangeLogs: ChangeLog[] = [
        {
          id: 'log1',
          type: 'insert',
          content: 'very',
          author: fetchedUsers[0],
          timestamp: '2024-04-29T16:00:00Z',
          position: 80,
          status: 'pending',
          change_type: 'insert',
          after_text: 'very',
          user_id: fetchedUsers[0].id,
          created_at: '2024-04-29T16:00:00Z',
          block_id: 'block_001'
        },
        {
          id: 'log2',
          type: 'delete',
          content: 'unnecessary',
          author: fetchedUsers[1],
          timestamp: '2024-04-29T16:30:00Z',
          position: 150,
          status: 'pending',
          change_type: 'delete',
          before_text: 'unnecessary',
          user_id: fetchedUsers[1].id,
          created_at: '2024-04-29T16:30:00Z',
          block_id: 'block_001'
        }
      ];

      setActiveUsers(prevUsers => [...prevUsers, ...fetchedUsers]);
      setComments(fetchedComments);
      setChanges(fetchedChanges);
      setChangeLogs(fetchedChangeLogs);
    };

    fetchInitialData();

    // Simulate real-time updates (e.g., using WebSocket)
    const intervalId = setInterval(() => {
      // Simulate user status updates
      setActiveUsers(prevUsers =>
        prevUsers.map(user => ({
          ...user,
          isOnline: Math.random() > 0.5, // Simulate online status
        }))
      );
    }, 5000);

    return () => clearInterval(intervalId);
  }, [documentId]);

  const acceptChange = (changeId: string) => {
    setChangeLogs(prevLogs => 
      prevLogs.map(log => 
        log.id === changeId ? { ...log, status: 'accepted' as const } : log
      )
    );
  };

  const rejectChange = (changeId: string) => {
    setChangeLogs(prevLogs => 
      prevLogs.map(log => 
        log.id === changeId ? { ...log, status: 'rejected' as const } : log
      )
    );
  };

  return {
    activeUsers,
    comments,
    changes,
    changeLogs,
    acceptChange,
    rejectChange,
  };
};
