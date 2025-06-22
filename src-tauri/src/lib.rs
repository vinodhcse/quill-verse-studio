
use tauri::{State, Emitter};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserRole {
    user_id: String,
    book_id: String,
    role: String, // "AUTHOR", "CO_WRITER", "EDITOR", "REVIEWER"
}

#[derive(Default)]
pub struct AppState {
    current_user_role: Mutex<Option<UserRole>>,
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
            get_current_user_role
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
