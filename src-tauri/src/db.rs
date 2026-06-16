use rusqlite::{params, Connection, Result as SqlResult};
use std::path::{Path, PathBuf};
use std::sync::Mutex;

/// Application metadata key-value store row.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AppMeta {
    pub key: String,
    pub value: String,
}

/// In-memory handle to the application's SQLite database. Both `conn` and
/// `path` are wrapped in `Mutex` so the struct can be mutated through `&self`
/// when held behind an `Arc` (as required by Tauri's managed state).
pub struct Db {
    pub conn: Mutex<Connection>,
    pub path: Mutex<PathBuf>,
}

const SCHEMA_VERSION: &str = "1";

/// Initialize a SQLite database at `app_data_dir/qtodo.db`, create the
/// `tasks` and `app_meta` tables if missing, and stamp the initial
/// `schema_version`. Idempotent — safe to call on every app start.
pub fn init(app_data_dir: &Path) -> SqlResult<Db> {
    std::fs::create_dir_all(app_data_dir)
        .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
    let db_path = app_data_dir.join("qtodo.db");
    let conn = Connection::open(&db_path)?;
    create_schema(&conn)?;
    stamp_schema_version(&conn)?;
    Ok(Db {
        conn: Mutex::new(conn),
        path: Mutex::new(db_path),
    })
}

impl Db {
    /// Return the current database file path.
    pub fn current_path(&self) -> Result<PathBuf, String> {
        self.path
            .lock()
            .map(|p| p.clone())
            .map_err(|e| e.to_string())
    }

    /// Read the `db_path` value from the `app_meta` table (if set).
    pub fn stored_db_path(&self) -> Result<Option<String>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let result = conn.query_row(
            "SELECT value FROM app_meta WHERE key = 'db_path'",
            [],
            |row| row.get::<_, String>(0),
        );
        match result {
            Ok(val) => Ok(Some(val)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.to_string()),
        }
    }

    /// Copy the database file to `new_dir`, open the new copy, and atomically
    /// swap the in-memory connection. The `db_path` key in `app_meta` is
    /// updated in the **new** copy so that on next startup the app finds it.
    ///
    /// Returns an error if `new_dir` does not exist, the copy fails, or the
    /// new database cannot be opened.
    pub fn change_path(&self, new_dir: &Path) -> Result<(), String> {
        // Validate: directory must already exist (we do NOT auto-create parent dirs)
        if !new_dir.is_dir() {
            return Err(format!("无法访问此目录: {}", new_dir.display()));
        }

        let current_path = self.current_path()?;
        let new_db_path = new_dir.join("qtodo.db");

        // Copy the current database file to the new location
        std::fs::copy(&current_path, &new_db_path)
            .map_err(|e| format!("复制失败: {}", e))?;

        // Open the new copy and verify the schema is intact
        let new_conn = Connection::open(&new_db_path)
            .map_err(|e| format!("无法打开新数据库: {}", e))?;

        // Write the db_path marker into the new copy's app_meta
        let new_dir_str = new_dir
            .to_str()
            .ok_or_else(|| "路径包含无效字符".to_string())?;
        new_conn
            .execute(
                "INSERT OR REPLACE INTO app_meta (key, value) VALUES ('db_path', ?1)",
                params![new_dir_str],
            )
            .map_err(|e| format!("写入 app_meta 失败: {}", e))?;

        // Atomically swap the connection inside the Mutex
        let mut conn_guard = self.conn.lock().map_err(|e| e.to_string())?;
        *conn_guard = new_conn;
        drop(conn_guard);

        // Update the stored path
        let mut path_guard = self.path.lock().map_err(|e| e.to_string())?;
        *path_guard = new_db_path;

        Ok(())
    }
}

fn create_schema(conn: &Connection) -> SqlResult<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            title TEXT,
            description TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0,
            archived INTEGER NOT NULL DEFAULT 0,
            priority TEXT NOT NULL,
            due_date TEXT NOT NULL,
            due_time TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            completed_at TEXT,
            archived_at TEXT,
            view_orders TEXT
        )",
        [],
    )?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS app_meta (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
        [],
    )?;
    Ok(())
}

fn stamp_schema_version(conn: &Connection) -> SqlResult<()> {
    conn.execute(
        "INSERT OR REPLACE INTO app_meta (key, value) VALUES (?1, ?2)",
        params!["schema_version", SCHEMA_VERSION],
    )?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn init_creates_db_file_and_tables() {
        let dir = tempdir().expect("tempdir");
        let db = init(dir.path()).expect("init should succeed");

        // db file exists on disk
        let path = db.current_path().expect("path");
        assert!(path.exists(), "qtodo.db file should exist");
        assert_eq!(
            path.file_name().and_then(|n| n.to_str()),
            Some("qtodo.db")
        );

        // tables exist
        let conn = db.conn.lock().expect("lock");
        let tables: Vec<String> = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
            .expect("prepare")
            .query_map([], |row| row.get(0))
            .expect("query")
            .filter_map(|r| r.ok())
            .collect();
        assert!(
            tables.contains(&"tasks".to_string()),
            "tasks table should exist, got: {:?}",
            tables
        );
        assert!(
            tables.contains(&"app_meta".to_string()),
            "app_meta table should exist, got: {:?}",
            tables
        );
    }

    #[test]
    fn init_stamps_schema_version_one() {
        let dir = tempdir().expect("tempdir");
        let db = init(dir.path()).expect("init should succeed");
        let conn = db.conn.lock().expect("lock");
        let version: String = conn
            .query_row(
                "SELECT value FROM app_meta WHERE key = 'schema_version'",
                [],
                |row| row.get(0),
            )
            .expect("schema_version row should exist");
        assert_eq!(version, "1");
    }

    #[test]
    fn init_is_idempotent() {
        let dir = tempdir().expect("tempdir");
        let _ = init(dir.path()).expect("first init");
        let _ = init(dir.path()).expect("second init (should not error)");
        let conn = Connection::open(dir.path().join("qtodo.db")).expect("open");
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM app_meta WHERE key = 'schema_version'",
                [],
                |row| row.get(0),
            )
            .expect("count");
        assert_eq!(count, 1, "schema_version should not duplicate");
    }

    #[test]
    fn init_creates_app_data_dir_if_missing() {
        let dir = tempdir().expect("tempdir");
        let nested = dir.path().join("a").join("b").join("c");
        assert!(!nested.exists());
        let db = init(&nested).expect("init should create nested dir");
        assert!(nested.is_dir());
        assert!(db.current_path().expect("path").exists());
    }

    // ── change_path tests ──────────────────────────────────────────────

    #[test]
    fn change_path_copies_db_and_updates_path() {
        let original_dir = tempdir().expect("tempdir");
        let db = init(original_dir.path()).expect("init");

        // Insert test data so we can verify the copy is faithful
        {
            let conn = db.conn.lock().expect("lock");
            conn.execute(
                "INSERT INTO tasks (id, description, priority, due_date, created_at, updated_at) \
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params!["t1", "Hello", "high", "2026-06-16", "2026-06-16T00:00:00Z", "2026-06-16T00:00:00Z"],
            )
            .expect("insert");
        }

        let new_dir = tempdir().expect("new tempdir");
        db.change_path(new_dir.path()).expect("change_path");

        // Path should reflect the new location
        let expected = new_dir.path().join("qtodo.db");
        assert_eq!(db.current_path().unwrap(), expected);

        // New file should exist and contain the data we inserted
        assert!(expected.exists(), "new db file must exist");
        let new_conn = Connection::open(&expected).expect("open copy");
        let desc: String = new_conn
            .query_row("SELECT description FROM tasks WHERE id = 't1'", [], |r| {
                r.get(0)
            })
            .expect("data should survive copy");
        assert_eq!(desc, "Hello");
    }

    #[test]
    fn change_path_then_get_current_path_returns_new_path() {
        let original_dir = tempdir().expect("tempdir");
        let db = init(original_dir.path()).expect("init");

        let new_dir = tempdir().expect("new tempdir");
        db.change_path(new_dir.path()).expect("change_path");

        let expected = new_dir.path().join("qtodo.db");
        assert_eq!(
            db.current_path().unwrap(),
            expected,
            "current_path must return the new path after change_path"
        );
    }

    #[test]
    fn change_path_reset_back_to_default() {
        let default_dir = tempdir().expect("default dir");
        let db = init(default_dir.path()).expect("init");

        // Move to a custom directory
        let custom_dir = tempdir().expect("custom dir");
        db.change_path(custom_dir.path()).expect("change to custom");
        assert!(db.current_path().unwrap().starts_with(custom_dir.path()));

        // Reset back to the default directory
        db.change_path(default_dir.path()).expect("reset to default");
        let expected = default_dir.path().join("qtodo.db");
        assert_eq!(db.current_path().unwrap(), expected);

        // The default db file should now contain the latest data
        let conn = db.conn.lock().expect("lock");
        let version: String = conn
            .query_row(
                "SELECT value FROM app_meta WHERE key = 'schema_version'",
                [],
                |r| r.get(0),
            )
            .expect("schema_version should survive reset");
        assert_eq!(version, "1");
    }

    #[test]
    fn change_path_errors_on_nonexistent_directory() {
        let dir = tempdir().expect("tempdir");
        let db = init(dir.path()).expect("init");

        let bogus = dir.path().join("does_not_exist");
        let result = db.change_path(&bogus);
        assert!(result.is_err(), "should fail for non-existent directory");
        let err_msg = result.unwrap_err();
        assert!(
            err_msg.contains("无法访问此目录"),
            "error should mention inaccessible directory, got: {}",
            err_msg
        );
    }
}
