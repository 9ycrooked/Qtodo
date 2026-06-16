use std::sync::Arc;
use tauri::Manager;

mod db;

use db::Db;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Return the absolute path of the application's SQLite database file.
#[tauri::command]
fn get_db_path(db: tauri::State<'_, Arc<Db>>) -> Result<String, String> {
    db.current_path()
        .map(|p| {
            p.to_str()
                .map(|s| s.to_string())
                .unwrap_or_else(|| String::from("<invalid utf-8 path>"))
        })
}

/// Copy the database to a new directory and update the in-memory connection.
/// If `new_dir` is `None`, the database is copied back to the default location
/// (the app_data_dir stored at setup time).
#[tauri::command]
fn set_db_path(
    new_dir: Option<String>,
    db: tauri::State<'_, Arc<Db>>,
    app_data_dir: tauri::State<'_, std::path::PathBuf>,
) -> Result<(), String> {
    let target_dir = match &new_dir {
        Some(dir) => std::path::PathBuf::from(dir),
        None => app_data_dir.inner().clone(),
    };
    db.change_path(&target_dir)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to resolve app data dir");

            // Phase 1: open DB at default location
            let db = db::init(&app_data_dir).expect("failed to init db");

            // Phase 2: check if a custom db_path was previously stored
            if let Ok(Some(custom_dir)) = db.stored_db_path() {
                let custom_path = std::path::PathBuf::from(&custom_dir);
                if custom_path.is_dir() && custom_path.join("qtodo.db").exists() {
                    // Switch to the custom location
                    if let Err(e) = db.change_path(&custom_path) {
                        eprintln!("Warning: failed to switch to custom db_path '{}': {}", custom_dir, e);
                        // Fall through: continue using default location
                    }
                } else {
                    eprintln!(
                        "Warning: stored db_path '{}' not found, using default",
                        custom_dir
                    );
                }
            }

            // Register both the Db and the default app_data_dir as managed state
            app.manage(Arc::new(db));
            app.manage(app_data_dir);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, get_db_path, set_db_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
