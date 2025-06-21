
import { useState, useEffect } from 'react';
import { ClipboardService } from '@/lib/clipboardService';
import { useUserContext } from '@/lib/UserContextProvider';
import { useBookContext } from '@/lib/BookContextProvider';

export const useClipboard = () => {
  const [canCopy, setCanCopy] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { userId } = useUserContext();
  const { state: bookState } = useBookContext();

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
      const success = await ClipboardService.copyToClipboard(text);
      if (!success && window.__TAURI__) {
        // Show user-friendly message when copy is blocked
        const currentRole = await ClipboardService.getCurrentUserRole();
        if (currentRole && (currentRole.role === 'EDITOR' || currentRole.role === 'REVIEWER')) {
          console.warn(`Copy operation blocked. ${currentRole.role} role does not have clipboard access.`);
        }
      }
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
