import { invoke } from '@tauri-apps/api/core';

/**
 * Set the user's role.
 * @param role The role to set (e.g., 'Admin', 'Editor', 'Reviewer').
 */
export async function setUserRole(role: string): Promise<void> {
  try {
    await invoke('update_user_role', { role });
    console.log(`User role updated to: ${role}`);
  } catch (error) {
    console.error('Failed to update user role:', error);
  }
}

/**
 * Securely copy text to the clipboard.
 * @param text The text to copy.
 */
export async function secureCopyText(text: string): Promise<void> {
  try {
    await invoke('copy_text_secure', { text });
    console.log('Text copied securely!');
  } catch (error) {
    console.error('Failed to copy text:', error);
    alert('Clipboard access denied.');
  }
}

/**
 * Securely read text from the clipboard.
 * @returns The text from the clipboard, or null if access is denied.
 */
export async function secureReadText(): Promise<string | null> {
  try {
    const text = await invoke<string>('read_text_secure');
    console.log('Text read securely:', text);
    return text;
  } catch (error) {
    console.error('Failed to read text:', error);
    alert('Clipboard access denied.');
    return null;
  }
}
