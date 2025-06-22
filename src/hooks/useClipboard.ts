
import { useState, useEffect } from 'react';
import { ClipboardService } from '@/lib/clipboardService';
import { useUserContext } from '@/lib/UserContextProvider';
import { useBookContext } from '@/lib/BookContextProvider';

export const useClipboard = () => {
  const [canCopy, setCanCopy] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { userId } = useUserContext();
  const { state: bookState } = useBookContext();

  // Listen for clipboard blocked events
  useEffect(() => {
    const handleClipboardBlocked = (event: CustomEvent) => {
      const { role } = event.detail;
      console.log(`Clipboard access blocked for role: ${role}`);
      // You could show a toast notification here
      // toast.error(`Copy operation blocked. ${role} role does not have clipboard access.`);
    };

    window.addEventListener('clipboardBlocked', handleClipboardBlocked as EventListener);
    
    return () => {
      window.removeEventListener('clipboardBlocked', handleClipboardBlocked as EventListener);
    };
  }, []);

  // Update user role when book context changes
  useEffect(() => {
    const updateUserRole = async () => {
      if (userId && bookState.bookId && bookState.bookDetails?.collaborators) {
        // Find the current user's role for this book
        const currentUserCollaborator = bookState.bookDetails.collaborators.find(
          (collab: any) => collab.user_id === userId
        );
        
        const role = currentUserCollaborator?.collaborator_type || 'VIEWER';
        
        try {
          await ClipboardService.setUserRole(userId, bookState.bookId, role);
          const canAccess = await ClipboardService.canAccessClipboard();
          setCanCopy(canAccess);
          console.log('Clipboard access updated:', { userId, bookId: bookState.bookId, role, canAccess });
        } catch (error) {
          console.error('Failed to update clipboard permissions:', error);
          setCanCopy(false);
        }
      }
    };

    updateUserRole();
  }, [userId, bookState.bookId, bookState.bookDetails]);

  const copyToClipboard = async (text: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('useClipboard: copyToClipboard called');
      const success = await ClipboardService.copyToClipboard(text);
      console.log('useClipboard: Copy operation result:', success);
      return success;
    } catch (error) {
      console.error('Copy operation failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    copyToClipboard,
    canCopy,
    isLoading,
  };
};
