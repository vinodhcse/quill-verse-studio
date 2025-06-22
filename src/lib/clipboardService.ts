
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface UserRole {
  user_id: string;
  book_id: string;
  role: string;
}

export class ClipboardService {
  private static clipboardEventListener: (() => void) | null = null;

  static async initialize() {
    if (window.__TAURI__ && !this.clipboardEventListener) {
      // Listen for clipboard-write events from Rust
      const unlisten = await listen('clipboard-write', (event) => {
        const text = event.payload as string;
        this.fallbackCopyToClipboard(text);
      });
      this.clipboardEventListener = unlisten;
    }
  }

  static async setUserRole(userId: string, bookId: string, role: string): Promise<void> {
    try {
      await invoke('set_user_role', {
        userId,
        bookId,
        role,
      });
      console.log('User role set:', { userId, bookId, role });
    } catch (error) {
      console.error('Failed to set user role:', error);
      throw error;
    }
  }

  static async canAccessClipboard(): Promise<boolean> {
    try {
      const result = await invoke('can_access_clipboard');
      return Boolean(result);
    } catch (error) {
      console.error('Failed to check clipboard access:', error);
      return false;
    }
  }

  static async controlledCopyToClipboard(text: string): Promise<boolean> {
    try {
      const success = await invoke('controlled_copy_to_clipboard', { text });
      if (!success) {
        console.warn('Clipboard access denied due to user role restrictions');
      }
      return Boolean(success);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  static async getCurrentUserRole(): Promise<UserRole | null> {
    try {
      return await invoke('get_current_user_role');
    } catch (error) {
      console.error('Failed to get current user role:', error);
      return null;
    }
  }

  // Fallback for non-Tauri environments (web)
  static async fallbackCopyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
      }
    } catch (error) {
      console.error('Fallback clipboard copy failed:', error);
      return false;
    }
  }

  // Main copy method that handles both Tauri and web environments
  static async copyToClipboard(text: string): Promise<boolean> {
    // Initialize listener if needed
    await this.initialize();
    
    // Check if we're in a Tauri environment
    if (window.__TAURI__) {
      return await this.controlledCopyToClipboard(text);
    } else {
      // Fallback to regular clipboard API for web
      return await this.fallbackCopyToClipboard(text);
    }
  }
}
