use std::sync::Arc;
use tauri::Manager;

mod db;

use db::Db;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Return the absolute path of the application's SQLite database file.
/// Exposed as a Tauri command so the frontend can verify the storage
/// location (and so #10 can later show it in the Settings panel).
#[tauri::command]
fn get_db_path(db: tauri::State<'_, Arc<Db>>) -> String {
    db.path
        .to_str()
        .map(|s| s.to_string())
        .unwrap_or_else(|| String::from("<invalid utf-8 path>"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to resolve app data dir");
            let db = db::init(&app_data_dir).expect("failed to init db");
            app.manage(Arc::new(db));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, get_db_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
