import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { db } from '../db/database';
import { Note, CalendarEvent, Task, TaskList, AppSettings, NoteColor, DaybookBackupPayload } from '../db/types';

export type MainView = 'notes' | 'calendar' | 'tasks' | 'trash';

interface DaybookContextType {
  // Data
  notes: Note[];
  trashNotes: Note[];
  events: CalendarEvent[];
  taskLists: TaskList[];
  tasks: Task[];
  settings: AppSettings;
  isLoading: boolean;

  // Navigation & Active item state
  activeView: MainView;
  setActiveView: (view: MainView) => void;
  selectedNoteId: string | null;
  setSelectedNoteId: (id: string | null) => void;
  selectedNote: Note | null;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedTaskListId: string | null; // null = all
  setSelectedTaskListId: (id: string | null) => void;

  // Search & Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedColorFilter: NoteColor | null;
  setSelectedColorFilter: (color: NoteColor | null) => void;
  sortOption: 'updated' | 'created' | 'title';
  setSortOption: (sort: 'updated' | 'created' | 'title') => void;

  // UI Modals
  isDayDetailOpen: boolean;
  setIsDayDetailOpen: (open: boolean) => void;
  isEventModalOpen: boolean;
  setIsEventModalOpen: (open: boolean) => void;
  editingEvent: CalendarEvent | null;
  setEditingEvent: (event: CalendarEvent | null) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isTestRunnerOpen: boolean;
  setIsTestRunnerOpen: (open: boolean) => void;
  isTaskListModalOpen: boolean;
  setIsTaskListModalOpen: (open: boolean) => void;
  editingTaskList: TaskList | null;
  setEditingTaskList: (list: TaskList | null) => void;

  // Note actions
  createNote: (initial?: Partial<Note>, dateToLink?: string) => Promise<Note>;
  updateNote: (note: Note) => Promise<void>;
  trashNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  deleteNotePermanently: (id: string) => Promise<void>;
  clearAllNotes: () => Promise<void>;
  togglePinNote: (id: string) => Promise<void>;
  linkNoteToDate: (noteId: string, date: string) => Promise<void>;
  unlinkNoteFromDate: (noteId: string, date: string) => Promise<void>;

  // Calendar actions
  saveEvent: (event: CalendarEvent) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  openCreateEventForDate: (date: string) => void;

  // Task actions
  createTask: (title: string, listId?: string, dueDate?: string | null) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskDone: (id: string) => Promise<void>;
  reorderTasks: (tasks: Task[]) => Promise<void>;

  // Task List actions
  saveTaskList: (list: TaskList) => Promise<void>;
  deleteTaskList: (id: string) => Promise<void>;

  // Settings & Backups
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  toggleTheme: () => void;
  exportBackup: () => Promise<DaybookBackupPayload>;
  importBackup: (payload: DaybookBackupPayload) => Promise<void>;
  refreshAll: () => Promise<void>;
}

const DaybookContext = createContext<DaybookContextType | null>(null);

export const DaybookProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [trashNotes, setTrashNotes] = useState<Note[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  const [settings, setSettings] = useState<AppSettings>({
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
  });

  const [activeView, setActiveView] = useState<MainView>('notes');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTaskListId, setSelectedTaskListId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColorFilter, setSelectedColorFilter] = useState<NoteColor | null>(null);
  const [sortOption, setSortOption] = useState<'updated' | 'created' | 'title'>('updated');

  // Modals
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isTestRunnerOpen, setIsTestRunnerOpen] = useState(false);
  const [isTaskListModalOpen, setIsTaskListModalOpen] = useState(false);
  const [editingTaskList, setEditingTaskList] = useState<TaskList | null>(null);

  // Theme and Highlight application
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }

    // Apply highlight color attribute (gray, slate, zinc)
    root.setAttribute('data-highlight', settings.highlight_color || 'gray');
  }, [settings.theme, settings.highlight_color]);

  // Load initial data
  const refreshAll = useCallback(async () => {
    try {
      await db.init();
      const [fetchedNotes, fetchedTrash, fetchedEvents, fetchedLists, fetchedTasks, fetchedSettings] = await Promise.all([
        db.getNotes(false),
        db.getNotes(true),
        db.getEvents(),
        db.getTaskLists(),
        db.getTasks(),
        db.getSettings()
      ]);

      setNotes(fetchedNotes);
      setTrashNotes(fetchedTrash);
      setEvents(fetchedEvents);
      setTaskLists(fetchedLists);
      setTasks(fetchedTasks);
      setSettings(fetchedSettings);

      // Restore last open note if valid
      if (fetchedSettings.last_open_note_id && fetchedNotes.some(n => n.id === fetchedSettings.last_open_note_id)) {
        setSelectedNoteId(fetchedSettings.last_open_note_id);
      } else if (fetchedNotes.length > 0) {
        setSelectedNoteId(fetchedNotes[0].id);
      } else {
        setSelectedNoteId(null);
      }
    } catch (err) {
      console.error('Failed to load Daybook data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Active selected note
  const selectedNote = useMemo(() => {
    if (activeView === 'trash') {
      return trashNotes.find(n => n.id === selectedNoteId) || null;
    }
    return notes.find(n => n.id === selectedNoteId) || null;
  }, [activeView, notes, trashNotes, selectedNoteId]);

  // Note actions
  const createNote = useCallback(async (initial?: Partial<Note>, dateToLink?: string): Promise<Note> => {
    const id = `note-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const targetDate = dateToLink || format(new Date(), 'yyyy-MM-dd');

    const newNote: Note = {
      id,
      title: initial?.title || 'Untitled Note',
      body: initial?.body || '<p></p>',
      color: initial?.color || settings.default_note_color || 'default',
      pinned: initial?.pinned || false,
      in_trash: false,
      created_at: now,
      updated_at: now,
      linked_dates: [targetDate, ...(initial?.linked_dates || [])],
      linked_event_ids: initial?.linked_event_ids || []
    };

    // Optimistically update notes so it's instantly created & opened
    setNotes(prev => [newNote, ...prev]);
    setSelectedNoteId(id);
    setActiveView('notes');

    await db.saveNote(newNote);
    await db.saveSetting('last_open_note_id', id);
    return newNote;
  }, [settings.default_note_color]);

  const updateNote = useCallback(async (updated: Note) => {
    // Optimistic UI update
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
    await db.saveNote(updated);
  }, []);

  const trashNote = useCallback(async (id: string) => {
    await db.trashNote(id);
    await refreshAll();
    // Select next note
    setNotes(prev => {
      const remaining = prev.filter(n => n.id !== id);
      if (remaining.length > 0) setSelectedNoteId(remaining[0].id);
      else setSelectedNoteId(null);
      return remaining;
    });
  }, [refreshAll]);

  const restoreNote = useCallback(async (id: string) => {
    await db.restoreNote(id);
    await refreshAll();
  }, [refreshAll]);

  const deleteNotePermanently = useCallback(async (id: string) => {
    await db.deleteNotePermanently(id);
    await refreshAll();
    setTrashNotes(prev => {
      const remaining = prev.filter(n => n.id !== id);
      if (remaining.length > 0) setSelectedNoteId(remaining[0].id);
      else setSelectedNoteId(null);
      return remaining;
    });
  }, [refreshAll]);

  const clearAllNotes = useCallback(async () => {
    await db.clearAllNotes();
    await refreshAll();
    setSelectedNoteId(null);
  }, [refreshAll]);

  const togglePinNote = useCallback(async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const updated: Note = { ...note, pinned: !note.pinned };
    await updateNote(updated);
    await refreshAll();
  }, [notes, updateNote, refreshAll]);

  const linkNoteToDate = useCallback(async (noteId: string, date: string) => {
    await db.linkNoteToDate(noteId, date);
    await refreshAll();
  }, [refreshAll]);

  const unlinkNoteFromDate = useCallback(async (noteId: string, date: string) => {
    await db.unlinkNoteFromDate(noteId, date);
    await refreshAll();
  }, [refreshAll]);

  // Calendar actions
  const saveEvent = useCallback(async (event: CalendarEvent) => {
    await db.saveEvent(event);
    await refreshAll();
    setIsEventModalOpen(false);
    setEditingEvent(null);
  }, [refreshAll]);

  const deleteEvent = useCallback(async (id: string) => {
    await db.deleteEvent(id);
    await refreshAll();
    setIsEventModalOpen(false);
    setEditingEvent(null);
  }, [refreshAll]);

  const openCreateEventForDate = useCallback((date: string) => {
    const newEvent: CalendarEvent = {
      id: `event-${crypto.randomUUID()}`,
      title: '',
      description: '',
      start_time: `${date}T09:00:00`,
      end_time: `${date}T10:00:00`,
      all_day: false,
      color: '#71717a',
      recurrence: 'none',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setEditingEvent(newEvent);
    setIsEventModalOpen(true);
  }, []);

  // Tasks actions
  const createTask = useCallback(async (title: string, listId?: string, dueDate?: string | null) => {
    const targetListId = listId || (taskLists.length > 0 ? taskLists[0].id : 'list-default');
    const newTask: Task = {
      id: `task-${crypto.randomUUID()}`,
      list_id: targetListId,
      title,
      notes: '',
      due_date: dueDate || null,
      priority: 'medium',
      done: false,
      subtasks: [],
      order_index: tasks.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await db.saveTask(newTask);
    await refreshAll();
  }, [taskLists, tasks.length, refreshAll]);

  const updateTask = useCallback(async (task: Task) => {
    setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    await db.saveTask(task);
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await db.deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleTaskDone = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updated = { ...task, done: !task.done };
    await updateTask(updated);
  }, [tasks, updateTask]);

  const reorderTasks = useCallback(async (reordered: Task[]) => {
    setTasks(reordered);
    await db.reorderTasks(reordered);
  }, []);

  // Task lists
  const saveTaskList = useCallback(async (list: TaskList) => {
    await db.saveTaskList(list);
    await refreshAll();
    setIsTaskListModalOpen(false);
    setEditingTaskList(null);
  }, [refreshAll]);

  const deleteTaskList = useCallback(async (id: string) => {
    await db.deleteTaskList(id);
    if (selectedTaskListId === id) setSelectedTaskListId(null);
    await refreshAll();
  }, [selectedTaskListId, refreshAll]);

  // Settings
  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    for (const [k, v] of Object.entries(newSettings)) {
      await db.saveSetting(k, String(v));
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setSettings(prev => {
      const isCurrentlyDark =
        prev.theme === 'dark' ||
        (prev.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ||
        document.documentElement.classList.contains('dark');
      const nextTheme: 'light' | 'dark' = isCurrentlyDark ? 'light' : 'dark';

      const root = document.documentElement;
      if (nextTheme === 'dark') {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      }

      db.saveSetting('theme', nextTheme).catch(console.error);
      return { ...prev, theme: nextTheme };
    });
  }, []);

  // Backups
  const exportBackup = useCallback(async () => {
    return await db.exportBackup();
  }, []);

  const importBackup = useCallback(async (payload: DaybookBackupPayload) => {
    await db.importBackup(payload);
    await refreshAll();
  }, [refreshAll]);

  // Keyboard shortcuts listener (global)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K: Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      // Ctrl+Alt+N or Alt+N: New Note
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createNote();
      }
      // Ctrl+,: Settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setIsSettingsModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNote]);

  const value = {
    notes,
    trashNotes,
    events,
    taskLists,
    tasks,
    settings,
    isLoading,
    activeView,
    setActiveView,
    selectedNoteId,
    setSelectedNoteId,
    selectedNote,
    selectedDate,
    setSelectedDate,
    selectedTaskListId,
    setSelectedTaskListId,
    searchQuery,
    setSearchQuery,
    selectedColorFilter,
    setSelectedColorFilter,
    sortOption,
    setSortOption,
    isDayDetailOpen,
    setIsDayDetailOpen,
    isEventModalOpen,
    setIsEventModalOpen,
    editingEvent,
    setEditingEvent,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    isTestRunnerOpen,
    setIsTestRunnerOpen,
    isTaskListModalOpen,
    setIsTaskListModalOpen,
    editingTaskList,
    setEditingTaskList,
    createNote,
    updateNote,
    trashNote,
    restoreNote,
    deleteNotePermanently,
    clearAllNotes,
    togglePinNote,
    linkNoteToDate,
    unlinkNoteFromDate,
    saveEvent,
    deleteEvent,
    openCreateEventForDate,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskDone,
    reorderTasks,
    saveTaskList,
    deleteTaskList,
    updateSettings,
    toggleTheme,
    exportBackup,
    importBackup,
    refreshAll
  };

  return <DaybookContext.Provider value={value}>{children}</DaybookContext.Provider>;
};

export const useDaybook = () => {
  const context = useContext(DaybookContext);
  if (!context) throw new Error('useDaybook must be used within DaybookProvider');
  return context;
};
