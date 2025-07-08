
import { invoke } from '@tauri-apps/api/core';

export interface RephraseRequest {
  text_to_rephrase: string[];
  custom_instructions: string;
  llm_model: string;
}

export interface RephraseResponse {
  rephrased_text: string;
  success: boolean;
  error?: string;
}

export class TauriLLMService {
  static async initializeLLM(): Promise<boolean> {
    try {
      const result = await invoke<boolean>('initialize_llm');
      return result;
    } catch (error) {
      console.error('Failed to initialize LLM:', error);
      return false;
    }
  }

  static async rephraseText(request: RephraseRequest): Promise<RephraseResponse> {
    try {
      const response = await invoke<RephraseResponse>('rephrase_text_local', { request });
      return response;
    } catch (error) {
      console.error('Failed to rephrase text:', error);
      return {
        rephrased_text: '',
        success: false,
        error: `Failed to rephrase: ${error}`,
      };
    }
  }

  static async checkLLMStatus(): Promise<boolean> {
    try {
      const status = await invoke<boolean>('check_llm_status');
      return status;
    } catch (error) {
      console.error('Failed to check LLM status:', error);
      return false;
    }
  }
}
