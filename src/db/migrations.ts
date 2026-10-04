export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: '001_initial_schema',
    sql: `
      -- Schema migrations tracker
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
      );

      -- Notes table
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

      -- Tags table
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT NULL
      );

      -- Note-Tags junction table
      CREATE TABLE IF NOT EXISTS note_tags (
        note_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (note_id, tag_id),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );

      -- Note-Dates junction table (automatic and manual linking of notes to calendar dates)
      CREATE TABLE IF NOT EXISTS note_dates (
        note_id TEXT NOT NULL,
        date TEXT NOT NULL, -- YYYY-MM-DD
        PRIMARY KEY (note_id, date),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
      );

      -- Events table for Calendar
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

      -- Note-Events junction table
      CREATE TABLE IF NOT EXISTS note_events (
        note_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        PRIMARY KEY (note_id, event_id),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      );

      -- Task lists
      CREATE TABLE IF NOT EXISTS task_lists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#6366f1',
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      -- Tasks
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        list_id TEXT NOT NULL,
        title TEXT NOT NULL,
        notes TEXT DEFAULT '',
        due_date TEXT DEFAULT NULL, -- YYYY-MM-DD
        priority TEXT NOT NULL DEFAULT 'medium',
        done INTEGER NOT NULL DEFAULT 0,
        subtasks TEXT NOT NULL DEFAULT '[]',
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (list_id) REFERENCES task_lists(id) ON DELETE CASCADE
      );

      -- Key-value settings table
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      -- Performance and search indexes
      CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notes_in_trash ON notes(in_trash);
      CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(pinned);
      CREATE INDEX IF NOT EXISTS idx_note_dates_date ON note_dates(date);
      CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
      CREATE INDEX IF NOT EXISTS idx_events_end_time ON events(end_time);
      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
      CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_done ON tasks(done);
    `
  },
  {
    version: 2,
    name: '002_fts_and_performance_tuning',
    sql: `
      -- Extra indices for rapid tag filtering & calendar aggregation
      CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id);
      CREATE INDEX IF NOT EXISTS idx_note_events_event_id ON note_events(event_id);
    `
  }
];
