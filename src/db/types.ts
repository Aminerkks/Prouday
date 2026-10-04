export type NoteColor = 
  | 'default' 
  | 'slate' 
  | 'blue' 
  | 'emerald' 
  | 'amber' 
  | 'rose' 
  | 'purple' 
  | 'teal' 
  | 'indigo' 
  | 'orange';

export interface Note {
  id: string;
  title: string;
  body: string; // TipTap content as HTML/JSON
  color: NoteColor;
  pinned: boolean;
  in_trash: boolean;
  created_at: string; // UTC ISO string
  updated_at: string; // UTC ISO string
  linked_dates?: string[]; // list of YYYY-MM-DD
  linked_event_ids?: string[];
}

export interface NoteDate {
  note_id: string;
  date: string; // YYYY-MM-DD
}

export interface NoteEvent {
  note_id: string;
  event_id: string;
}

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start_time: string; // ISO
  end_time: string; // ISO
  all_day: boolean;
  color: string;
  recurrence: RecurrenceType;
  created_at: string;
  updated_at: string;
}

export interface TaskList {
  id: string;
  name: string;
  color: string;
  order_index: number;
  created_at: string;
}

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  list_id: string;
  title: string;
  notes: string;
  due_date: string | null; // YYYY-MM-DD
  priority: TaskPriority;
  done: boolean;
  subtasks: SubTask[];
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  highlight_color: 'gray' | 'slate' | 'zinc';
  editor_font_size: 'small' | 'medium' | 'large';
  editor_font_family: 'sans' | 'serif' | 'mono';
  autosave_delay: number; // ms
  calendar_default_view: 'month' | 'week';
  week_start: 'monday' | 'sunday';
  default_note_color: NoteColor;
  data_dir: string;
  auto_detect_dates: boolean;
  last_view: 'notes' | 'calendar' | 'tasks';
  last_open_note_id: string | null;
}

export interface DaybookBackupPayload {
  version: number;
  exported_at: string;
  notes: Note[];
  note_dates: NoteDate[];
  events: CalendarEvent[];
  note_events: NoteEvent[];
  task_lists: TaskList[];
  tasks: Array<Omit<Task, 'subtasks'> & { subtasks: string }>;
  settings: Record<string, string>;
}
