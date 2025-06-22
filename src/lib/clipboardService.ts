
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface UserRole {
  user_id: string;
  book_id: string;
  role: string;
}

export class ClipboardService {
  private static clipboardEventListener: (() => void) | null = null;
  private static initialized = false;

  static async initialize() {
    if (this.initialized) return;
    
    console.log('ClipboardService initializing...');
    console.log('Is Tauri environment?', !!window.__TAURI__);
    
    if (window.__TAURI__) {
      try {
        // Listen for clipboard-write events from Rust
        const unlisten = await listen('clipboard-write', (event) => {
          console.log('Received clipboard-write event:', event.payload);
          const text = event.payload as string;
          this.performActualClipboardWrite(text);
        });
        this.clipboardEventListener = unlisten;
        console.log('Tauri clipboard listener established');
      } catch (error) {
        console.error('Failed to setup Tauri clipboard listener:', error);
      }
    }
    
    this.initialized = true;
  }

  static async setUserRole(userId: string, bookId: string, role: string): Promise<void> {
    console.log('Setting user role:', { userId, bookId, role });
    
    if (!window.__TAURI__) {
      console.log('Not in Tauri environment, skipping role setting');
      return;
    }

    try {
      await invoke('set_user_role', {
        userId,
        bookId,
        role,
      });
      console.log('User role set successfully');
    } catch (error) {
      console.error('Failed to set user role:', error);
      throw error;
    }
  }

  static async canAccessClipboard(): Promise<boolean> {
    if (!window.__TAURI__) {
      console.log('Not in Tauri environment, allowing clipboard access');
      return true;
    }

    try {
      const result = await invoke('can_access_clipboard');
      console.log('Clipboard access check result:', result);
      return Boolean(result);
    } catch (error) {
      console.error('Failed to check clipboard access:', error);
      return false;
    }
  }

  static async controlledCopyToClipboard(text: string): Promise<boolean> {
    if (!window.__TAURI__) {
      console.log('Not in Tauri environment, using fallback');
      return await this.performActualClipboardWrite(text);
    }

    try {
      console.log('Attempting controlled copy via Tauri...');
      const success = await invoke('controlled_copy_to_clipboard', { text });
      console.log('Controlled copy result:', success);
      
      if (!success) {
        console.warn('Clipboard access denied due to user role restrictions');
        // Show user-friendly message
        const currentRole = await this.getCurrentUserRole();
        if (currentRole && (currentRole.role === 'EDITOR' || currentRole.role === 'REVIEWER')) {
          console.warn(`Copy operation blocked. ${currentRole.role} role does not have clipboard access.`);
          // You could dispatch a custom event here to show a toast notification
          window.dispatchEvent(new CustomEvent('clipboardBlocked', {
            detail: { role: currentRole.role }
          }));
        }
      }
      
      return Boolean(success);
    } catch (error) {
      console.error('Failed to copy to clipboard via Tauri:', error);
      return false;
    }
  }

  static async getCurrentUserRole(): Promise<UserRole | null> {
    if (!window.__TAURI__) {
      return null;
    }

    try {
      return await invoke('get_current_user_role');
    } catch (error) {
      console.error('Failed to get current user role:', error);
      return null;
    }
  }

  // Perform the actual clipboard write operation
  static async performActualClipboardWrite(text: string): Promise<boolean> {
    console.log('performActualClipboardWrite called with text length:', text.length);
    
    try {
      // First try the modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        console.log('Using modern Clipboard API');
        await navigator.clipboard.writeText(text);
        console.log('Modern clipboard write successful');
        return true;
      } else {
        console.log('Modern Clipboard API not available, using fallback');
        return await this.legacyClipboardWrite(text);
      }
    } catch (error) {
      console.error('performActualClipboardWrite failed:', error);
      // Try fallback method
      return await this.legacyClipboardWrite(text);
    }
  }

  // Legacy clipboard write method
  static async legacyClipboardWrite(text: string): Promise<boolean> {
    console.log('Using legacy clipboard write method');
    
    try {
      // Create a temporary textarea element
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Make it invisible but focusable
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      textArea.style.opacity = '0';
      
      // Add to DOM
      document.body.appendChild(textArea);
      
      // Focus and select
      textArea.focus();
      textArea.select();
      
      // Try to copy
      const success = document.execCommand('copy');
      
      // Clean up
      document.body.removeChild(textArea);
      
      console.log('Legacy clipboard write result:', success);
      return success;
    } catch (error) {
      console.error('Legacy clipboard write failed:', error);
      return false;
    }
  }

  // Main copy method that handles both Tauri and web environments
  static async copyToClipboard(text: string): Promise<boolean> {
    console.log('copyToClipboard called...');
    
    // Initialize if needed
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Check if we're in a Tauri environment
    if (window.__TAURI__) {
      console.log('Using Tauri controlled clipboard');
      return await this.controlledCopyToClipboard(text);
    } else {
      console.log('Using web clipboard fallback');
      // For web environment, directly perform clipboard write
      return await this.performActualClipboardWrite(text);
    }
  }

  // Cleanup method
  static cleanup() {
    if (this.clipboardEventListener) {
      this.clipboardEventListener();
      this.clipboardEventListener = null;
    }
    this.initialized = false;
  }
}
