import { Note, NoteDate, CalendarEvent, NoteEvent, TaskList, Task, AppSettings, DaybookBackupPayload } from './types';
import { MIGRATIONS } from './migrations';
import { getInitialSeedData } from './seeds';

const DB_NAME = 'daybook_offline_sqlite_v1';
const DB_VERSION = 2;

class DaybookDatabase {
  private db: IDBDatabase | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Migrations store
        if (!db.objectStoreNames.contains('schema_migrations')) {
          db.createObjectStore('schema_migrations', { keyPath: 'version' });
        }

        // Notes store
        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
          notesStore.createIndex('updated_at', 'updated_at', { unique: false });
          notesStore.createIndex('pinned', 'pinned', { unique: false });
          notesStore.createIndex('in_trash', 'in_trash', { unique: false });
        }

        // Note-Dates junction
        if (!db.objectStoreNames.contains('note_dates')) {
          const noteDatesStore = db.createObjectStore('note_dates', { keyPath: ['note_id', 'date'] });
          noteDatesStore.createIndex('note_id', 'note_id', { unique: false });
          noteDatesStore.createIndex('date', 'date', { unique: false });
        }

        // Events store
        if (!db.objectStoreNames.contains('events')) {
          const eventsStore = db.createObjectStore('events', { keyPath: 'id' });
          eventsStore.createIndex('start_time', 'start_time', { unique: false });
          eventsStore.createIndex('end_time', 'end_time', { unique: false });
        }

        // Note-Events junction
        if (!db.objectStoreNames.contains('note_events')) {
          const noteEventsStore = db.createObjectStore('note_events', { keyPath: ['note_id', 'event_id'] });
          noteEventsStore.createIndex('note_id', 'note_id', { unique: false });
          noteEventsStore.createIndex('event_id', 'event_id', { unique: false });
        }

        // Task Lists
        if (!db.objectStoreNames.contains('task_lists')) {
          const taskListsStore = db.createObjectStore('task_lists', { keyPath: 'id' });
          taskListsStore.createIndex('order_index', 'order_index', { unique: false });
        }

        // Tasks
        if (!db.objectStoreNames.contains('tasks')) {
          const tasksStore = db.createObjectStore('tasks', { keyPath: 'id' });
          tasksStore.createIndex('list_id', 'list_id', { unique: false });
          tasksStore.createIndex('due_date', 'due_date', { unique: false });
          tasksStore.createIndex('done', 'done', { unique: false });
        }

        // Settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = async (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isInitialized = true;
        try {
          await this.applyMigrationsAndCleanup();
        } catch (err) {
          console.warn('Migrations or cleanup non-fatal warning:', err);
        } finally {
          resolve();
        }
      };

      request.onerror = (event) => {
        console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.initPromise;
  }

  private async applyMigrationsAndCleanup(): Promise<void> {
    try {
      const migrations = await this.getAllFromStore<{ version: number; name: string; applied_at: string }>('schema_migrations');
      const appliedVersions = new Set(migrations.map(m => m.version));

      for (const migration of MIGRATIONS) {
        if (!appliedVersions.has(migration.version)) {
          await this.putInStore('schema_migrations', {
            version: migration.version,
            name: migration.name,
            applied_at: new Date().toISOString()
          });
        }
      }

      // Check for default welcome notes and remove them per user request!
      const defaultIds = ['note-welcome-001', 'note-shortcuts-002'];
      for (const id of defaultIds) {
        await this.deleteFromStore('notes', id).catch(() => {});
      }

      // Seed task lists and settings if empty
      const listCount = await this.countInStore('task_lists');
      if (listCount === 0) {
        const seed = getInitialSeedData();
        for (const list of seed.task_lists) {
          await this.putInStore('task_lists', list);
        }
        for (const [key, value] of Object.entries(seed.settings)) {
          await this.putInStore('settings', { key, value });
        }
      }
    } catch (err) {
      console.warn('Error during migrations and cleanup:', err);
    }
  }

  // --- Core IndexedDB helper primitives ---

  private getStore(storeName: string, mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const tx = this.db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  private async getAllFromStore<T>(storeName: string): Promise<T[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  private async getByIdFromStore<T>(storeName: string, id: IDBValidKey): Promise<T | null> {
    await this.init();
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readonly');
      const request = store.get(id);
      request.onsuccess = () => resolve((request.result as T) || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async putInStore<T>(storeName: string, value: T): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const request = store.put(value);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteFromStore(storeName: string, id: IDBValidKey): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async countInStore(storeName: string): Promise<number> {
    await this.init();
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readonly');
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // --- High Level Typed Repositories ---

  // NOTES
  public async getNotes(trashFilter?: boolean): Promise<Note[]> {
    await this.init();
    const [rawNotes, noteDates, noteEvents] = await Promise.all([
      this.getAllFromStore<Note>('notes'),
      this.getAllFromStore<NoteDate>('note_dates'),
      this.getAllFromStore<NoteEvent>('note_events'),
    ]);

    const noteDatesMap = new Map<string, string[]>();
    for (const nd of noteDates) {
      const list = noteDatesMap.get(nd.note_id) || [];
      list.push(nd.date);
      noteDatesMap.set(nd.note_id, list);
    }

    const noteEventsMap = new Map<string, string[]>();
    for (const ne of noteEvents) {
      const list = noteEventsMap.get(ne.note_id) || [];
      list.push(ne.event_id);
      noteEventsMap.set(ne.note_id, list);
    }

    return rawNotes
      .filter(n => {
        if (trashFilter === undefined) return true;
        return trashFilter ? Boolean(n.in_trash) : !n.in_trash;
      })
      .map(n => ({
        ...n,
        pinned: Boolean(n.pinned),
        in_trash: Boolean(n.in_trash),
        linked_dates: noteDatesMap.get(n.id) || [],
        linked_event_ids: noteEventsMap.get(n.id) || []
      }))
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
  }

  public async getNoteById(id: string): Promise<Note | null> {
    await this.init();
    const raw = await this.getByIdFromStore<Note>('notes', id);
    if (!raw) return null;
    const [noteDates, noteEvents] = await Promise.all([
      this.getAllFromStore<NoteDate>('note_dates'),
      this.getAllFromStore<NoteEvent>('note_events'),
    ]);
    return {
      ...raw,
      pinned: Boolean(raw.pinned),
      in_trash: Boolean(raw.in_trash),
      linked_dates: noteDates.filter(d => d.note_id === id).map(d => d.date),
      linked_event_ids: noteEvents.filter(e => e.note_id === id).map(e => e.event_id)
    };
  }

  public async saveNote(note: Note): Promise<void> {
    await this.init();
    const now = new Date().toISOString();
    const updatedNote: Note = {
      ...note,
      updated_at: now,
      pinned: Boolean(note.pinned),
      in_trash: Boolean(note.in_trash)
    };

    const { linked_dates, linked_event_ids, ...rawNote } = updatedNote;
    await this.putInStore('notes', rawNote);

    // Sync linked dates
    if (linked_dates) {
      const allNoteDates = await this.getAllFromStore<NoteDate>('note_dates');
      for (const nd of allNoteDates) {
        if (nd.note_id === note.id) {
          await this.deleteFromStore('note_dates', [nd.note_id, nd.date]);
        }
      }
      for (const date of linked_dates) {
        await this.putInStore('note_dates', { note_id: note.id, date });
      }
    }

    // Sync linked events
    if (linked_event_ids) {
      const allNoteEvents = await this.getAllFromStore<NoteEvent>('note_events');
      for (const ne of allNoteEvents) {
        if (ne.note_id === note.id) {
          await this.deleteFromStore('note_events', [ne.note_id, ne.event_id]);
        }
      }
      for (const event_id of linked_event_ids) {
        await this.putInStore('note_events', { note_id: note.id, event_id });
      }
    }
  }

  public async trashNote(id: string): Promise<void> {
    const note = await this.getByIdFromStore<Note>('notes', id);
    if (note) {
      note.in_trash = true;
      note.updated_at = new Date().toISOString();
      await this.putInStore('notes', note);
    }
  }

  public async restoreNote(id: string): Promise<void> {
    const note = await this.getByIdFromStore<Note>('notes', id);
    if (note) {
      note.in_trash = false;
      note.updated_at = new Date().toISOString();
      await this.putInStore('notes', note);
    }
  }

  public async deleteNotePermanently(id: string): Promise<void> {
    await this.init();
    const [noteDates, noteEvents] = await Promise.all([
      this.getAllFromStore<NoteDate>('note_dates'),
      this.getAllFromStore<NoteEvent>('note_events'),
    ]);

    for (const nd of noteDates.filter(x => x.note_id === id)) {
      await this.deleteFromStore('note_dates', [nd.note_id, nd.date]);
    }
    for (const ne of noteEvents.filter(x => x.note_id === id)) {
      await this.deleteFromStore('note_events', [ne.note_id, ne.event_id]);
    }
    await this.deleteFromStore('notes', id);
  }

  public async clearAllNotes(): Promise<void> {
    await this.init();
    const notesStore = this.getStore('notes', 'readwrite');
    notesStore.clear();
    const noteDatesStore = this.getStore('note_dates', 'readwrite');
    noteDatesStore.clear();
    const noteEventsStore = this.getStore('note_events', 'readwrite');
    noteEventsStore.clear();
  }

  // NOTE DATES (Linking logic)
  public async getNotesForDate(date: string): Promise<Note[]> {
    const allNotes = await this.getNotes(false);
    return allNotes.filter(n => n.linked_dates?.includes(date));
  }

  public async linkNoteToDate(noteId: string, date: string): Promise<void> {
    await this.putInStore('note_dates', { note_id: noteId, date });
  }

  public async unlinkNoteFromDate(noteId: string, date: string): Promise<void> {
    await this.deleteFromStore('note_dates', [noteId, date]);
  }

  // CALENDAR EVENTS
  public async getEvents(): Promise<CalendarEvent[]> {
    const rawEvents = await this.getAllFromStore<CalendarEvent>('events');
    return rawEvents.map(e => ({
      ...e,
      all_day: Boolean(e.all_day)
    })).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }

  public async saveEvent(event: CalendarEvent): Promise<void> {
    await this.putInStore('events', {
      ...event,
      all_day: Boolean(event.all_day),
      updated_at: new Date().toISOString()
    });
  }

  public async deleteEvent(id: string): Promise<void> {
    await this.init();
    const noteEvents = await this.getAllFromStore<NoteEvent>('note_events');
    for (const ne of noteEvents.filter(x => x.event_id === id)) {
      await this.deleteFromStore('note_events', [ne.note_id, ne.event_id]);
    }
    await this.deleteFromStore('events', id);
  }

  public async getLinkedNotesForEvent(eventId: string): Promise<Note[]> {
    const allNotes = await this.getNotes(false);
    return allNotes.filter(n => n.linked_event_ids?.includes(eventId));
  }

  // TASK LISTS & TASKS
  public async getTaskLists(): Promise<TaskList[]> {
    const lists = await this.getAllFromStore<TaskList>('task_lists');
    return lists.sort((a, b) => a.order_index - b.order_index);
  }

  public async saveTaskList(list: TaskList): Promise<void> {
    await this.putInStore('task_lists', list);
  }

  public async deleteTaskList(id: string): Promise<void> {
    await this.init();
    const allTasks = await this.getAllFromStore<Task>('tasks');
    for (const t of allTasks.filter(x => x.list_id === id)) {
      await this.deleteFromStore('tasks', t.id);
    }
    await this.deleteFromStore('task_lists', id);
  }

  public async getTasks(listId?: string): Promise<Task[]> {
    const rawTasks = await this.getAllFromStore<any>('tasks');
    const tasks: Task[] = rawTasks.map(t => ({
      ...t,
      done: Boolean(t.done),
      subtasks: typeof t.subtasks === 'string' ? JSON.parse(t.subtasks || '[]') : (t.subtasks || [])
    }));

    const filtered = listId ? tasks.filter(t => t.list_id === listId) : tasks;
    return filtered.sort((a, b) => a.order_index - b.order_index);
  }

  public async saveTask(task: Task): Promise<void> {
    const now = new Date().toISOString();
    await this.putInStore('tasks', {
      ...task,
      done: Boolean(task.done),
      subtasks: JSON.stringify(task.subtasks || []),
      updated_at: now
    });
  }

  public async deleteTask(id: string): Promise<void> {
    await this.deleteFromStore('tasks', id);
  }

  public async reorderTasks(tasks: Task[]): Promise<void> {
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      await this.putInStore('tasks', {
        ...task,
        order_index: i,
        done: Boolean(task.done),
        subtasks: JSON.stringify(task.subtasks || [])
      });
    }
  }

  // SETTINGS
  public async getSettings(): Promise<AppSettings> {
    const defaultSettings: AppSettings = {
      theme: 'light',
      highlight_color: 'gray',
      editor_font_size: 'medium',
      editor_font_family: 'sans',
      autosave_delay: 400,
      calendar_default_view: 'month',
      week_start: 'monday',
      default_note_color: 'default',
      data_dir: '~/Daybook/data/daybook.db',
      auto_detect_dates: true,
      last_view: 'notes',
      last_open_note_id: null
    };

    const records = await this.getAllFromStore<{ key: string; value: string }>('settings');
    const map = new Map(records.map(r => [r.key, r.value]));

    return {
      theme: (map.get('theme') as any) || defaultSettings.theme,
      highlight_color: (map.get('highlight_color') as any) || defaultSettings.highlight_color,
      editor_font_size: (map.get('editor_font_size') as any) || defaultSettings.editor_font_size,
      editor_font_family: (map.get('editor_font_family') as any) || defaultSettings.editor_font_family,
      autosave_delay: Number(map.get('autosave_delay')) || defaultSettings.autosave_delay,
      calendar_default_view: (map.get('calendar_default_view') as any) || defaultSettings.calendar_default_view,
      week_start: (map.get('week_start') as any) || defaultSettings.week_start,
      default_note_color: (map.get('default_note_color') as any) || defaultSettings.default_note_color,
      data_dir: map.get('data_dir') || defaultSettings.data_dir,
      auto_detect_dates: map.get('auto_detect_dates') !== 'false',
      last_view: (map.get('last_view') as any) || defaultSettings.last_view,
      last_open_note_id: map.get('last_open_note_id') || null
    };
  }

  public async saveSetting(key: string, value: string): Promise<void> {
    await this.putInStore('settings', { key, value });
  }

  // BACKUP & RESTORE
  public async exportBackup(): Promise<DaybookBackupPayload> {
    await this.init();
    const [notes, note_dates, events, note_events, task_lists, tasks, settingsList] = await Promise.all([
      this.getAllFromStore<Note>('notes'),
      this.getAllFromStore<NoteDate>('note_dates'),
      this.getAllFromStore<CalendarEvent>('events'),
      this.getAllFromStore<NoteEvent>('note_events'),
      this.getAllFromStore<TaskList>('task_lists'),
      this.getAllFromStore<any>('tasks'),
      this.getAllFromStore<{ key: string; value: string }>('settings')
    ]);

    const settings: Record<string, string> = {};
    for (const s of settingsList) settings[s.key] = s.value;

    return {
      version: 1,
      exported_at: new Date().toISOString(),
      notes,
      note_dates,
      events,
      note_events,
      task_lists,
      tasks,
      settings
    };
  }

  public async importBackup(payload: DaybookBackupPayload): Promise<void> {
    await this.init();
    const storeNames = ['notes', 'note_dates', 'events', 'note_events', 'task_lists', 'tasks', 'settings'];
    for (const name of storeNames) {
      const store = this.getStore(name, 'readwrite');
      store.clear();
    }

    for (const note of payload.notes || []) {
      const { linked_dates: _, linked_event_ids: __, ...raw } = note;
      await this.putInStore('notes', raw);
    }
    for (const nd of payload.note_dates || []) {
      await this.putInStore('note_dates', nd);
    }
    for (const evt of payload.events || []) {
      await this.putInStore('events', evt);
    }
    for (const ne of payload.note_events || []) {
      await this.putInStore('note_events', ne);
    }
    for (const list of payload.task_lists || []) {
      await this.putInStore('task_lists', list);
    }
    for (const task of payload.tasks || []) {
      await this.putInStore('tasks', {
        ...task,
        subtasks: typeof task.subtasks === 'string' ? task.subtasks : JSON.stringify(task.subtasks || [])
      });
    }
    for (const [key, value] of Object.entries(payload.settings || {})) {
      await this.putInStore('settings', { key, value });
    }
  }

  public async getDatabaseStats() {
    await this.init();
    const [notesCount, eventsCount, tasksCount] = await Promise.all([
      this.countInStore('notes'),
      this.countInStore('events'),
      this.countInStore('tasks')
    ]);
    return {
      notesCount,
      eventsCount,
      tasksCount,
      tagsCount: 0
    };
  }
}

export const db = new DaybookDatabase();
