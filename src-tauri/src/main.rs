// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_sql::{Migration, MigrationKind};

fn main() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_schema",
            sql: "
                CREATE TABLE IF NOT EXISTS notes (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    body TEXT NOT NULL,
                    color TEXT NOT NULL DEFAULT 'default',
                    pinned INTEGER NOT NULL DEFAULT 0,
                    in_trash INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS tags (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE,
                    color TEXT DEFAULT NULL
                );

                CREATE TABLE IF NOT EXISTS note_tags (
                    note_id TEXT NOT NULL,
                    tag_id TEXT NOT NULL,
                    PRIMARY KEY (note_id, tag_id),
                    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
                    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS note_dates (
                    note_id TEXT NOT NULL,
                    date TEXT NOT NULL,
                    PRIMARY KEY (note_id, date),
                    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS events (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT DEFAULT '',
                    start_time TEXT NOT NULL,
                    end_time TEXT NOT NULL,
                    all_day INTEGER NOT NULL DEFAULT 0,
                    color TEXT NOT NULL DEFAULT '#3b82f6',
                    recurrence TEXT NOT NULL DEFAULT 'none',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS note_events (
                    note_id TEXT NOT NULL,
                    event_id TEXT NOT NULL,
                    PRIMARY KEY (note_id, event_id),
                    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
                    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS task_lists (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    color TEXT NOT NULL DEFAULT '#6366f1',
                    order_index INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS tasks (
                    id TEXT PRIMARY KEY,
                    list_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    notes TEXT DEFAULT '',
                    due_date TEXT DEFAULT NULL,
                    priority TEXT NOT NULL DEFAULT 'medium',
                    done INTEGER NOT NULL DEFAULT 0,
                    subtasks TEXT NOT NULL DEFAULT '[]',
                    order_index INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (list_id) REFERENCES task_lists(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
                CREATE INDEX IF NOT EXISTS idx_notes_in_trash ON notes(in_trash);
                CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(pinned);
                CREATE INDEX IF NOT EXISTS idx_note_dates_date ON note_dates(date);
                CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
                CREATE INDEX IF NOT EXISTS idx_events_end_time ON events(end_time);
                CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add_secondary_indices",
            sql: "
                CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id);
                CREATE INDEX IF NOT EXISTS idx_note_events_event_id ON note_events(event_id);
            ",
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:daybook.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("error while running Daybook Tauri application");
}
