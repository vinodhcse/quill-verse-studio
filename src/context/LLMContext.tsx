/*
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FilesetResolver, LlmInference } from '@mediapipe/tasks-genai';

// --- Type Definitions ---
interface LLMContextType {
  llm: LlmInference | null;
  isReady: boolean;
  loadingError: string | null;
  gpuSupported: boolean; // Added to context for external use
}

interface SystemSpecs {
  total_ram_mb: number;
  cpu_cores: number;
}

interface ModelConfig {
  name: string; // User-friendly name
  delegate: 'GPU' | 'CPU';
  path: string; // Relative path to the .task file
  minRamMB: number; // Minimum system RAM in MB (including for GPU models)
  baseVramBytes: number; // Approximate size of the model's weights in bytes (for GPU/CPU estimation)
  nativeMaxTokens: number; // Max context window for the model
  recommendedCores: number; // Recommended CPU cores, particularly for CPU delegate
}

const LLMContext = createContext<LLMContextType | null>(null);

// --- Constants ---
// Factor to add a buffer to the VRAM/RAM estimation for activations, KV cache, etc.
// 1.8 means the model might need 80% more memory than its base weights size.
// This is critical for preventing Out-Of-Memory errors, especially on GPU.
const VRAM_BUFFER_FACTOR = 1.8;

// Helper to convert MB to Bytes
const mbToBytes = (mb: number) => mb * 1024 * 1024;

// --- Model Configurations to Attempt (Ordered by Preference) ---
// This array defines the exact sequence in which your app will try to load models.
const MODEL_CONFIGS_TO_ATTEMPT: ModelConfig[] = [
  // 1. Largest GPU Model First (12B)
  {
    name: 'gemma3-12b-it-int4-web (GPU)',
    delegate: 'GPU',
    path: '/src/models/gemma3-12b-it-int4-web.task',
    minRamMB: 16 * 1024, // 16GB system RAM suggested for 12B (even with GPU)
    baseVramBytes: 6.6 * 1024 * 1024 * 1024, // Approx 6.6GB for Gemma 12B int4 weights
    nativeMaxTokens: 4096,
    recommendedCores: 0, // N/A for GPU primary
  },
  // 2. Medium GPU Model (4B)
  {
    name: 'gemma3-4b-it-int4-web (GPU)',
    delegate: 'GPU',
    path: '/src/models/gemma3-4b-it-int4-web.task',
    minRamMB: 8 * 1024, // 8GB system RAM suggested for 4B
    baseVramBytes: 2.6 * 1024 * 1024 * 1024, // Approx 2.6GB for Gemma 4B int4 weights
    nativeMaxTokens: 4096,
    recommendedCores: 0,
  },
  // 3. Largest CPU Model (4B) - as a fallback if GPU models fail
  {
    name: 'gemma3-4b-it-int4-web (CPU)',
    delegate: 'CPU',
    path: '/src/models/gemma3-4b-it-int4-web.task',
    minRamMB: 12 * 1024, // CPU models often need more system RAM for overhead
    baseVramBytes: 2.6 * 1024 * 1024 * 1024, // Same model, different delegate
    nativeMaxTokens: 4096,
    recommendedCores: 8, // More cores are beneficial for CPU inference
  },
  // 4. Smallest GPU Model (1B)
  {
    name: 'gemma3-1b-it-int4-web (GPU)',
    delegate: 'GPU',
    path: '/src/models/gemma3-1b-it-int4-web.task',
    minRamMB: 4 * 1024, // 4GB system RAM suggested for 1B
    baseVramBytes: 0.5 * 1024 * 1024 * 1024, // Approx 0.5GB for Gemma 1B int4 weights
    nativeMaxTokens: 2048, // 1B models often have smaller context by default
    recommendedCores: 0,
  },
  // 5. Smallest CPU Model (1B) - ultimate fallback
  {
    name: 'gemma3-1b-it-int4-web (CPU)',
    delegate: 'CPU',
    path: '/src/models/gemma3-1b-it-int4-web.task',
    minRamMB: 6 * 1024,
    baseVramBytes: 0.5 * 1024 * 1024 * 1024,
    nativeMaxTokens: 2048,
    recommendedCores: 4,
  },
   {
    name: 'gemma3-1b-it-int4-web (CPU)',
    delegate: 'CPU',
    path: '/src/models/gemma3-1b-it-int4-web.task',
    minRamMB: 6 * 1024,
    baseVramBytes: 0.5 * 1024 * 1024 * 1024,
    nativeMaxTokens: 500,
    recommendedCores: 4,
  },
];


export const LLMContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [llm, setLlm] = useState<LlmInference | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [gpuSupported, setGpuSupported] = useState(false); // Indicates if WebGPU adapter was found at all
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Memoized function to get WebGPU max buffer size and determine support
  const getWebGPUSupportAndLimits = useCallback(async (): Promise<number> => {
    if (typeof navigator !== 'undefined' && navigator.gpu) {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter) {
          console.log("WebGPU adapter found.");
          setGpuSupported(true);
          const limits = adapter.limits;
          console.log("WebGPU max buffer size:", `${(limits.maxBufferSize / (1024 * 1024 * 1024)).toFixed(2)}GB`);
          return limits.maxBufferSize;
        } else {
          console.log("No WebGPU adapter found.");
          setGpuSupported(false);
          return 0;
        }
      } catch (error) {
        console.warn("Error requesting WebGPU adapter:", error);
        setGpuSupported(false);
        return 0;
      }
    } else {
      console.log("WebGPU not supported in this environment.");
      setGpuSupported(false);
      return 0;
    }
  }, []); // No dependencies, as it only uses browser APIs

  useEffect(() => {
    const initializeLLM = async () => {
      setLoadingError(null); // Clear previous errors
      setIsReady(false); // Not ready until a model is successfully loaded

      let systemSpecs: SystemSpecs | null = null;
      let webGpuMaxBufferSize: number = 0; // Initialize to 0

      try {
        // 1. Get system specs (RAM, CPU cores) from Tauri backend
        systemSpecs = await invoke('get_cpu_gpu_specs') as SystemSpecs; // Cast to your defined interface
        console.log("System Specs from Tauri:", systemSpecs);

        // 2. Get WebGPU support and max buffer size
        webGpuMaxBufferSize = await getWebGPUSupportAndLimits();

      } catch (error) {
        const errMsg = `Failed to get system or WebGPU info. Model loading might be affected: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errMsg);
        setLoadingError(errMsg);
        // Continue, as CPU fallback might still be possible even with partial info
      }

      // Ensure we have default values if system info failed
      const totalRamBytes = systemSpecs ? mbToBytes(systemSpecs.total_ram_mb) : 0;
      const cpuCores = systemSpecs ? systemSpecs.cpu_cores : 0;

      // Inner function to attempt loading a single model configuration
      const attemptLoadModel = async (config: ModelConfig): Promise<LlmInference | null> => {
        const { name, delegate, path, minRamMB, baseVramBytes, nativeMaxTokens, recommendedCores } = config;

        console.log(`\n--- Attempting to load: ${name} (Delegate: ${delegate}) ---`);

        // Check overall system RAM availability first for any model
        const estimatedTotalMemoryNeeded = baseVramBytes * VRAM_BUFFER_FACTOR;
        if (totalRamBytes < mbToBytes(minRamMB) || totalRamBytes < estimatedTotalMemoryNeeded) {
          console.warn(`Skipping ${name}: Insufficient system RAM. Available: ${(totalRamBytes / (1024 * 1024 * 1024)).toFixed(2)}GB, Required: Minimum ${minRamMB / 1024}GB (for model config) or estimated ${ (estimatedTotalMemoryNeeded / (1024 * 1024 * 1024)).toFixed(2)}GB (for model + buffer).`);
          return null;
        }

        // Delegate-specific checks
        if (delegate === 'GPU') {
          if (!gpuSupported) {
            console.warn(`Skipping ${name}: GPU delegate requested but WebGPU is not supported or adapter not found.`);
            return null;
          }
          // Soft check for WebGPU maxBufferSize. MediaPipe can sometimes do hybrid, so this is a warning.
          if (webGpuMaxBufferSize < estimatedTotalMemoryNeeded) {
            console.warn(`Warning for ${name} (GPU): WebGPU max buffer size (${(webGpuMaxBufferSize / (1024 * 1024 * 1024)).toFixed(2)}GB) is less than estimated needed GPU VRAM (${(estimatedTotalMemoryNeeded / (1024 * 1024 * 1024)).toFixed(2)}GB). Attempting hybrid execution, but may fail.`);
          }
        } else { // CPU delegate
          if (cpuCores < recommendedCores) {
            console.warn(`Skipping ${name}: Insufficient CPU cores. Available: ${cpuCores}, Recommended: ${recommendedCores}.`);
            return null;
          }
        }

        try {
          // Initialize FilesetResolver for MediaPipe WASM assets
          const genai = await FilesetResolver.forGenAiTasks(
            //'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@latest/wasm'
          );

          // Attempt to create the LlmInference instance
          const llmInstance = await LlmInference.createFromOptions(genai, {
            baseOptions: {
              modelAssetPath: path,
              delegate: delegate,
            },
            maxTokens: nativeMaxTokens,
            topK: 30,
            temperature: 0.3,
            randomSeed: 42,
          });

          // MediaPipe's `createFromOptions` should ideally throw on critical failure,
          // but a null check is a good safeguard if it returns an invalid instance without error.
          if (llmInstance) {
            console.log(`✅ Successfully loaded ${name}.`);
            return llmInstance;
          } else {
            console.warn(`LlmInference.createFromOptions returned null for ${name}. This indicates an issue during loading without an explicit error.`);
            return null;
          }
        } catch (error) {
          console.error(`❌ Failed to load ${name}:`, error);
          // If an error occurs during loading, return null to try the next model.
          return null;
        }
      };

      // --- Sequential Model Loading Loop ---
      let loadedLlmInstance: LlmInference | null = null;
      let finalLoadedModelName: string | null = null;
      let finalLoadedDelegate: 'GPU' | 'CPU' | null = null;

      for (const config of MODEL_CONFIGS_TO_ATTEMPT) {
        loadedLlmInstance = await attemptLoadModel(config);
        console.log(`Attempted to load model: ${config.name} (Delegate: ${config.delegate})`);
        if (loadedLlmInstance) {
          console.log(`✅ Successfully loaded model from list: ${config.name} (${config.delegate})`);
          // If successful, store the info and break the loop
          finalLoadedModelName = config.name;
          finalLoadedDelegate = config.delegate;
          break; 
        } else {
          console.warn(`Failed to load model: ${config.name}. Trying next model...`);
        }
      }

      // After trying all models
      if (loadedLlmInstance) {
        setLlm(loadedLlmInstance);
        setIsReady(true);
        setLoadingError(null);
        // We can also set the model name and delegate to context if needed
        // For now, these are local vars for logging.
        console.log(`✨ LLM initialization complete. Loaded: ${finalLoadedModelName} (${finalLoadedDelegate})`);
      } else {
        const errMsg = "No suitable LLM model could be loaded after all attempts. Please ensure correct model files, sufficient system resources, and check console for detailed errors.";
        console.error(errMsg);
        setLoadingError(errMsg);
        setIsReady(false);
      }
    };

    initializeLLM();
  }, [getWebGPUSupportAndLimits, gpuSupported]); // `gpuSupported` is a state set by `getWebGPUSupportAndLimits`, so it's a dependency

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = React.useMemo(
    () => ({
      llm,
      isReady,
      loadingError,
      gpuSupported, // Expose gpuSupported status
    }),
    [llm, isReady, loadingError, gpuSupported]
  );

  return (
    <LLMContext.Provider value={contextValue}>
      {children}
    </LLMContext.Provider>
  );
};

export const useLLM = () => {
  const context = useContext(LLMContext);
  if (!context) { // Handle null context more robustly
    throw new Error('useLLM must be used within an LLMContextProvider');
  }
  return context;
};
*/