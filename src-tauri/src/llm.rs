use kalosm::language::{Llama, ChatModelExt};
use once_cell::sync::OnceCell;
use std::sync::Mutex;

pub static MODEL: OnceCell<Mutex<Llama>> = OnceCell::new();

#[derive(Default)]
pub struct ModelState;

pub fn load_model_and_tokenizer() -> Result<ModelState, String> {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let llama = Llama::new().await.map_err(|e| e.to_string())?;
        MODEL.set(Mutex::new(llama)).map_err(|_| "Failed to set model")?;
        println!("✅ Kalosm model loaded successfully.");
        Ok(ModelState) // ✅ return correct type
    })
}

#[tauri::command]
pub async fn chat_response(prompt: String) -> Result<String, String> {
    println!("✅ Kalosm model prompt: {}", prompt);
    let model = MODEL.get().ok_or("Model not initialized")?;

    // Acquire lock to create task
    let task = {
        let lock = model.lock().map_err(|_| "Failed to acquire model lock")?;
        println!("✅ Task created successfully.");
        lock.task("chat") // create task inside lock scope
    }; // lock is dropped here

    // Now run task asynchronously without holding the lock
    println!("✅ Running task asynchronously.");
    let response = task.run(&prompt).await.map_err(|e| {
        println!("❌ Error while running task: {}", e);
        e.to_string()
    })?;

    println!("✅ Response received: {}", response);
    Ok(response)
}

