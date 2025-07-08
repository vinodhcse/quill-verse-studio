use tauri::{State, Emitter, Manager};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

mod llm;
use llm::{LocalLLM, LLM_INSTANCE};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserRole {
    user_id: String,
    book_id: String,
    role: String, // "AUTHOR", "CO_WRITER", "EDITOR", "REVIEWER"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RephraseRequest {
    text_to_rephrase: Vec<String>,
    custom_instructions: String,
    llm_model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RephraseResponse {
    rephrased_text: String,
    success: bool,
    error: Option<String>,
}

#[derive(Default)]
pub struct AppState {
    current_user_role: Mutex<Option<UserRole>>,
    llm_ready: Mutex<bool>,
}

#[tauri::command]
async fn initialize_llm() -> Result<bool, String> {
    println!("Starting LLM initialization...");
    
    match LLM_INSTANCE.lock() {
        Ok(mut llm) => {
            match llm.initialize().await {
                Ok(_) => {
                    println!("LLM initialized successfully");
                    Ok(true)
                },
                Err(e) => {
                    eprintln!("Failed to initialize LLM: {}", e);
                    Err(format!("Failed to initialize LLM: {}", e))
                }
            }
        },
        Err(e) => {
            eprintln!("Failed to acquire LLM lock: {}", e);
            Err(format!("Failed to acquire LLM lock: {}", e))
        }
    }
}

#[tauri::command]
async fn rephrase_text_local(request: RephraseRequest) -> Result<RephraseResponse, String> {
    println!("Processing rephrase request: {:?}", request);
    
    match LLM_INSTANCE.lock() {
        Ok(llm) => {
            if !llm.is_ready() {
                return Ok(RephraseResponse {
                    rephrased_text: String::new(),
                    success: false,
                    error: Some("LLM model not initialized".to_string()),
                });
            }

            let combined_text = request.text_to_rephrase.join("\n\n");
            
            match llm.rephrase_text(&combined_text, &request.custom_instructions).await {
                Ok(rephrased) => {
                    Ok(RephraseResponse {
                        rephrased_text: rephrased,
                        success: true,
                        error: None,
                    })
                },
                Err(e) => {
                    eprintln!("Rephrase error: {}", e);
                    Ok(RephraseResponse {
                        rephrased_text: String::new(),
                        success: false,
                        error: Some(format!("Rephrase failed: {}", e)),
                    })
                }
            }
        },
        Err(e) => {
            eprintln!("Failed to acquire LLM lock: {}", e);
            Err(format!("Failed to acquire LLM lock: {}", e))
        }
    }
}

#[tauri::command]
async fn check_llm_status() -> Result<bool, String> {
    match LLM_INSTANCE.lock() {
        Ok(llm) => Ok(llm.is_ready()),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
async fn set_user_role(
    state: State<'_, AppState>,
    user_id: String,
    book_id: String,
    role: String,
) -> Result<(), String> {
    let mut current_role = state.current_user_role.lock().unwrap();
    println!(
        "Setting user role: user_id={}, book_id={}, role={}",
        user_id, book_id, role
    );
    *current_role = Some(UserRole {
        user_id,
        book_id,
        role,
    });
    Ok(())
}

#[tauri::command]
async fn can_access_clipboard(state: State<'_, AppState>) -> Result<bool, String> {
    let current_role = state.current_user_role.lock().unwrap();
    println!("Current user role: {:?}", current_role);
    match &*current_role {
        Some(role) => {
            match role.role.as_str() {
                "AUTHOR" | "CO_WRITER" => Ok(true),
                "EDITOR" | "REVIEWER" => Ok(false),
                _ => Ok(false),
            }
        }
        None => Ok(false), // No role set, deny access
    }
}

#[tauri::command]
async fn controlled_copy_to_clipboard(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    text: String,
) -> Result<bool, String> {
    let can_copy = can_access_clipboard(state).await?;
    
    if can_copy {
        // Use Tauri's invoke API to call the frontend clipboard API
        match app_handle.emit("clipboard-write", &text) {
            Ok(_) => Ok(true),
            Err(e) => {
                eprintln!("Failed to emit clipboard event: {}", e);
                Ok(false)
            }
        }
    } else {
        Ok(false) // Clipboard access denied
    }
}

#[tauri::command]
async fn get_current_user_role(state: State<'_, AppState>) -> Result<Option<UserRole>, String> {
    let current_role = state.current_user_role.lock().unwrap();
    Ok(current_role.clone())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            set_user_role,
            can_access_clipboard,
            controlled_copy_to_clipboard,
            get_current_user_role,
            initialize_llm,
            rephrase_text_local,
            check_llm_status
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Initialize LLM on app startup
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                match app_handle.invoke("initialize_llm", ()).await {
                    Ok(_) => println!("LLM initialization started"),
                    Err(e) => eprintln!("Failed to start LLM initialization: {}", e),
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
