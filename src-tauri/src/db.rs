use rusqlite::{params, Connection, Result as SqlResult};
use std::path::Path;
use std::sync::Mutex;

/// Application metadata key-value store row.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AppMeta {
    pub key: String,
    pub value: String,
}

/// In-memory handle to the application's SQLite database. Wrapped in `Mutex`
/// at the application layer (lib.rs) so Tauri commands can serialize access.
pub struct Db {
    pub conn: Mutex<Connection>,
    pub path: std::path::PathBuf,
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
        path: db_path,
    })
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
        assert!(db.path.exists(), "qtodo.db file should exist");
        assert_eq!(
            db.path.file_name().and_then(|n| n.to_str()),
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
        assert!(db.path.exists());
    }
}
