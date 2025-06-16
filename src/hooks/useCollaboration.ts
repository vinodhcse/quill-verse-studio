import { useState, useEffect } from 'react';
import { User, Comment, Change } from '../types/collaboration';

export const useCollaboration = (documentId: string) => {
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

  useEffect(() => {
    // Simulate fetching active users, comments, and changes from an API
    // In a real application, you would replace this with actual API calls
    const fetchInitialData = async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulate fetched data
      const fetchedUsers: User[] = [
        { id: '2', name: 'Alice', email: 'alice@example.com', role: 'reviewer' as const, color: '#4ade80', isOnline: true },
        { id: '3', name: 'Bob', email: 'bob@example.com', role: 'author' as const, color: '#f472b6', isOnline: false, lastSeen: '2024-04-28T10:00:00Z' },
      ];
      const fetchedComments: Comment[] = [
        { id: 'comment1', content: 'This is a great point!', author: fetchedUsers[0], timestamp: '2024-04-29T14:30:00Z', position: 120 },
        { id: 'comment2', content: 'I disagree with this statement.', author: fetchedUsers[1], timestamp: '2024-04-29T15:00:00Z', position: 250 },
      ];
      const fetchedChanges: Change[] = [
        { id: 'change1', type: 'insert', content: 'very', author: fetchedUsers[0], timestamp: '2024-04-29T16:00:00Z', position: 80 },
        { id: 'change2', type: 'delete', content: 'unnecessary', author: fetchedUsers[1], timestamp: '2024-04-29T16:30:00Z', position: 150 },
      ];

      setActiveUsers(prevUsers => [...prevUsers, ...fetchedUsers]);
      setComments(fetchedComments);
      setChanges(fetchedChanges);
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

      // Simulate new comments
      if (Math.random() > 0.8) {
        const newComment: Comment = {
          id: `comment${Date.now()}`,
          content: 'Another thought...',
          author: activeUsers[Math.floor(Math.random() * activeUsers.length)],
          timestamp: new Date().toISOString(),
          position: Math.floor(Math.random() * 500),
        };
        setComments(prevComments => [...prevComments, newComment]);
      }

      // Simulate new changes
      if (Math.random() > 0.8) {
        const newChange: Change = {
          id: `change${Date.now()}`,
          type: Math.random() > 0.5 ? 'insert' : 'delete',
          content: 'something',
          author: activeUsers[Math.floor(Math.random() * activeUsers.length)],
          timestamp: new Date().toISOString(),
          position: Math.floor(Math.random() * 500),
        };
        setChanges(prevChanges => [...prevChanges, newChange]);
      }
    }, 5000);

    return () => clearInterval(intervalId); // Clean up interval on unmount
  }, [documentId]);

  return {
    activeUsers,
    comments,
    changes,
  };
};
