import { format } from 'date-fns';

export function getInitialSeedData() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const now = new Date().toISOString();

  // Task List IDs
  const listIdWork = 'list-work-001';
  const listIdPersonal = 'list-personal-002';

  return {
    notes: [], // User requested removing default notes: clean fresh start!
    note_dates: [],
    events: [],
    note_events: [],
    task_lists: [
      {
        id: listIdPersonal,
        name: 'Personal',
        color: '#71717a',
        order_index: 0,
        created_at: now
      },
      {
        id: listIdWork,
        name: 'Work',
        color: '#52525b',
        order_index: 1,
        created_at: now
      }
    ],
    tasks: [],
    settings: {
      theme: 'light', // User requested light mode on settings
      highlight_color: 'gray',
      editor_font_size: 'medium',
      editor_font_family: 'sans',
      autosave_delay: '400',
      calendar_default_view: 'month',
      week_start: 'monday',
      default_note_color: 'default',
      data_dir: '~/Daybook/data/daybook.db',
      auto_detect_dates: 'true',
      last_view: 'notes',
      last_open_note_id: ''
    }
  };
}
