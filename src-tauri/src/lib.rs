#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::sync::Mutex;
use tauri::{AppHandle, Manager, Runtime, Window};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri::webview::WebviewUrl;

#[cfg(target_os = "windows")]
use winapi::um::winuser::{OpenClipboard, EmptyClipboard, CloseClipboard};

#[cfg(target_os = "macos")]
use cocoa::appkit::NSPasteboard;

#[derive(Default)]
struct AppState {
    current_user_role: Mutex<String>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_clipboard_manager::init()) // Initialize the clipboard plugin
    .manage(AppState::default())
    .setup(|app| {
      // Suppress unused variable warning
      let _window = app.get_webview_window("main").unwrap();

      // Disable developer tools in production
      #[cfg(not(debug_assertions))]
      _window.set_devtools(false)?;

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
        blur_screen,
        add_watermark,
        notify_screen_recording_detected,
        get_user_role,
        set_user_role,
        copy_text_secure,
        read_text_secure,
        login_user,
        update_user_role
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn blur_screen(window: Window) {
    window.set_decorations(false).unwrap(); // Example: Remove decorations to simulate blur
    std::thread::sleep(std::time::Duration::from_secs(5)); // Keep blurred for 5 seconds
    window.set_decorations(true).unwrap();
}

#[tauri::command]
fn add_watermark(_window: Window, watermark: String) {
    println!("Watermark added: {}", watermark);
    // Logic to overlay watermark on the application content
}

#[tauri::command]
fn notify_screen_recording_detected() -> String {
    "Screen recording detected. Blurring content.".to_string()
}

fn detect_screen_recording(window: tauri::Window) {
    // Placeholder logic for screen recording detection
    // TODO: Implement actual detection logic for Windows and macOS
    let is_recording = false; // Replace with real detection

    if is_recording {
        // Apply a blur effect by setting the window to decoration-less
        window.set_decorations(false).unwrap(); // Remove window decorations

        // Optionally, you can add logic to restore the original state when recording stops
    }
}

// Ensure `clear_clipboard_if_app_in_focus` is only called when the app is active
fn clear_clipboard_if_app_in_focus(window: tauri::Window) {
    if window.is_focused().unwrap_or(false) {
        #[cfg(target_os = "windows")]
        {
            if unsafe { OpenClipboard(std::ptr::null_mut()) } != 0 {
                unsafe {
                    EmptyClipboard();
                    CloseClipboard();
                }
            }
        }

        #[cfg(target_os = "macos")]
        {
            // macOS clipboard clearing logic
        }
    }
}

#[tauri::command]
async fn get_user_role<R: Runtime>(app_handle: AppHandle<R>) -> Result<String, String> {
    let state = app_handle.state::<AppState>();
    let role = state.current_user_role.lock().unwrap().clone();
    Ok(role)
}

#[tauri::command]
async fn set_user_role(app_handle: AppHandle, role: String) -> Result<(), String> {
    let state = app_handle.state::<AppState>();
    *state.current_user_role.lock().unwrap() = role;
    Ok(())
}

#[tauri::command]
async fn copy_text_secure<R: Runtime>(app_handle: AppHandle<R>, text: String) -> Result<(), String> {
    let user_role = get_user_role(app_handle.clone()).await?;

    println!("Attempting to copy text. User role: {}", user_role);

    if user_role == "restricted" {
        println!("Clipboard write denied for role: {}", user_role);
        return Err("Clipboard access denied for this role.".to_string());
    }

    println!("Clipboard write allowed for role: {}", user_role);
    app_handle.clipboard().write_text(text).map_err(|e| e.to_string())
}

#[tauri::command]
async fn read_text_secure<R: Runtime>(app_handle: AppHandle<R>) -> Result<Option<String>, String> {
    let user_role = get_user_role(app_handle.clone()).await?;

    println!("Attempting to read text. User role: {}", user_role);

    if user_role == "restricted" {
        println!("Clipboard read denied for role: {}", user_role);
        return Err("Clipboard access denied for this role.".to_string());
    }

    println!("Clipboard read allowed for role: {}", user_role);
    app_handle
        .clipboard()
        .read_text()
        .map(|text| Some(text)) // Wrap the result in Some to match the expected return type
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn login_user<R: Runtime>(app_handle: AppHandle<R>, username: String, password: String) -> Result<String, String> {
    // Authenticate user and determine role securely on the Rust side
    let user_role = if username == "reviewer" && password == "pass" {
        "Reviewer"
    } else if username == "admin" && password == "adminpass" {
        "Admin"
    } else {
        return Err("Invalid credentials".to_string());
    };

    // Close existing main window if it exists
    if let Some(main_window) = app_handle.get_webview_window("main") {
        main_window.close().map_err(|e| e.to_string())?;
    }

    // Create a new window with the appropriate capability
    let capability_id = match user_role {
        "Reviewer" | "Editor" => "restricted-capability",
        "Admin" => "unrestricted-capability",
        _ => "restricted-capability", // Default to restricted if somehow unknown
    };

    let window_builder = tauri::webview::WebviewWindowBuilder::new(
        &app_handle,
        "main", // Window label
        WebviewUrl::App("index.html".into()) // Your app's entry point
    )
    .title("My Secure App")
    .inner_size(800.0, 600.0)
    .center()
    .with_devtools(true) // For development
    .enable_capability(capability_id); // Apply the capability

    window_builder.build().map_err(|e| e.to_string())?;

    Ok(format!("Logged in as {}", user_role))
}

#[tauri::command]
async fn update_user_role<R: Runtime>(app_handle: AppHandle<R>, role: String) -> Result<(), String> {
    let state = app_handle.state::<AppState>();
    *state.current_user_role.lock().unwrap() = role.clone();

    println!("User role updated to: {}", role);

    // Dynamically adjust capabilities based on the new role
    let capability_id = match role.as_str() {
        "Reviewer" | "Editor" => "restricted-capability",
        "Admin" | "Author" => "unrestricted-capability",
        _ => "restricted-capability", // Default to restricted if unknown
    };

    if let Some(main_window) = app_handle.get_webview_window("main") {
        main_window.add_capability(capability_id).map_err(|e| e.to_string())?;
    }

    Ok(())
}
