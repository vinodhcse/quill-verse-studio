use candle_core::{Tensor, Device};
use candle_transformers::models::gemma3::{Config, Model as GemmaModel};
use candle_nn::VarBuilder;
use safetensors::SafeTensors;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{Emitter, State, Window};
use tokenizers::Tokenizer;

pub enum Model {
    Gemma(GemmaModel),
}

impl Model {
    pub fn forward(&mut self, input_ids: &Tensor, pos: usize) -> candle_core::Result<Tensor> {
        match self {
            Self::Gemma(m) => m.forward(input_ids, pos),
        }
    }
}

pub struct ModelState {
    pub model: Mutex<Option<Model>>,
    pub tokenizer: Tokenizer,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
pub struct StreamPayload {
    pub token: String,
}

#[tauri::command]
pub async fn expand_text_stream(
    prompt: String,
    window: Window,
    model_state: State<'_, ModelState>,
) -> Result<(), String> {
    let mut model_guard = model_state.model.lock().unwrap();
    let model = model_guard.as_mut().ok_or("Model not loaded")?;

    // Tokenize input
    let encoding = model_state
        .tokenizer
        .encode(prompt.clone(), true)
        .map_err(|e| e.to_string())?;
    let tokens = encoding.get_ids().to_vec();

    let input = Tensor::new(tokens.as_slice(), &Device::Cpu)
        .map_err(|e| e.to_string())?
        .unsqueeze(0)
        .map_err(|e| e.to_string())?;

    // Forward pass
    let logits = model.forward(&input, 0).map_err(|e| e.to_string())?;

    // Emit output token shape for demonstration
    let payload = StreamPayload {
        token: format!("Logits shape: {:?}", logits.shape()),
    };
    window
        .emit("llm-stream", payload)
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn load_model_and_tokenizer() -> Result<ModelState, String> {
    let model_path = PathBuf::from("models/model.safetensors");
    if !model_path.exists() {
        return Err(format!("Model file not found at path: {:?}", model_path));
    }

    let device = Device::Cpu;

    // Load safetensors model
    let data =
        std::fs::read(&model_path).map_err(|e| format!("Model load error (read file): {e}"))?;
    let safetensors = SafeTensors::deserialize(&data)
        .map_err(|e| format!("SafeTensors deserialize error: {e}"))?;

    // Convert safetensors tensors to HashMap
    let tensor_names = safetensors.names();
    let tensors: HashMap<String, Tensor> = tensor_names
        .iter()
        .map(|name| {
            let view = safetensors
                .tensor(name)
                .map_err(|e| format!("Failed to read tensor {name}: {e}"))?;
            let shape: Vec<usize> = view.shape().iter().map(|&d| d as usize).collect();
            let data = view.data();
            Tensor::from_slice(data, shape.as_slice(), &device)
                .map(|tensor| (name.to_string(), tensor))
                .map_err(|e| format!("Failed to build tensor {name}: {e}"))
        })
        .collect::<Result<HashMap<_, _>, _>>()?;

    // Create VarBuilder from tensors
    let var_builder =
        VarBuilder::from_tensors(tensors, candle_core::DType::F32, &device);

    // Define model config (ensure these match your config.json exactly)
    let config = Config {
    attention_bias: false,
    attn_logit_softcapping: None, // "null" in JSON maps to None
    final_logit_softcapping: None,
    head_dim: 256,
    hidden_activation: candle_nn::Activation::GeluPytorchTanh, // mapped from "gelu_pytorch_tanh"
    hidden_size: 1152,
    intermediate_size: 6912,
    num_attention_heads: 4,
    num_hidden_layers: 26,
    num_key_value_heads: 1,
    query_pre_attn_scalar: 256,
    rms_norm_eps: 1e-6,
    vocab_size: 262144,
    max_position_embeddings: 32768,
    rope_local_base_freq: 10000.0,
    rope_theta: 1000000.0,
    sliding_window: 512,
    sliding_window_pattern: 6,
};


    let gemma_model = GemmaModel::new(false, &config, var_builder)
        .map_err(|e| format!("Model initialization error: {e}"))?;

    // Load tokenizer using the JSON file as bytes
    let tokenizer_path = PathBuf::from("models/tokenizer.json");
    let tokenizer_data = std::fs::read(&tokenizer_path)
        .map_err(|e| format!("Tokenizer file read error: {e}"))?;
    let tokenizer = Tokenizer::from_bytes(tokenizer_data)
        .map_err(|e| format!("Tokenizer load error: {e}"))?;

    // Additional validation for tokenizer
    if tokenizer.get_vocab_size(true) == 0 {
        return Err("Tokenizer vocabulary is empty".to_string());
    }

    Ok(ModelState {
        model: Mutex::new(Some(Model::Gemma(gemma_model))),
        tokenizer,
    })
}
