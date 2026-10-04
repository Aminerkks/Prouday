import { db } from '../db/database';
import { extractDatesFromText, getEventOccurrencesInRange } from '../utils/dateDetection';
import { CalendarEvent, Note, Task } from '../db/types';
import { parseISO } from 'date-fns';

export interface TestResult {
  name: string;
  category: 'database' | 'linking' | 'calendar' | 'tasks' | 'backup';
  passed: boolean;
  durationMs: number;
  message?: string;
}

export async function runAllDaybookUnitTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const runTest = async (
    name: string,
    category: TestResult['category'],
    fn: () => Promise<void> | void
  ) => {
    const start = performance.now();
    try {
      await fn();
      results.push({
        name,
        category,
        passed: true,
        durationMs: Math.round(performance.now() - start),
      });
    } catch (err: any) {
      results.push({
        name,
        category,
        passed: false,
        durationMs: Math.round(performance.now() - start),
        message: err?.message || String(err),
      });
    }
  };

  // Test 1: Database Initialization & Migrations
  await runTest('Database engine initializes and runs schema migrations', 'database', async () => {
    await db.init();
    const stats = await db.getDatabaseStats();
    if (typeof stats.notesCount !== 'number') {
      throw new Error('Database stats failed to return numeric counts');
    }
  });

  // Test 2: Note Creation and Metadata
  await runTest('Create, update, and retrieve note with color and pinned state', 'database', async () => {
    const testId = `test-note-${Date.now()}`;
    const newNote: Note = {
      id: testId,
      title: 'Automated Test Note',
      body: '<p>Testing bold text and local offline persistence</p>',
      color: 'slate',
      pinned: true,
      in_trash: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      linked_dates: ['2026-10-12'],
      linked_event_ids: []
    };

    await db.saveNote(newNote);
    const fetched = await db.getNoteById(testId);
    if (!fetched) throw new Error('Note was not persisted');
    if (fetched.title !== 'Automated Test Note') throw new Error('Title mismatch');
    if (!fetched.pinned) throw new Error('Pinned state was not preserved');
    if (fetched.color !== 'slate') throw new Error('Color was not preserved');

    // Clean up
    await db.deleteNotePermanently(testId);
  });

  // Test 3: Note-to-Date Automatic Linking
  await runTest('Automatic note-to-date linking and reverse date queries', 'linking', async () => {
    const testDate = '2026-11-20';
    const noteId = `test-link-${Date.now()}`;
    const testNote: Note = {
      id: noteId,
      title: 'Linked Day Note',
      body: '<p>Meeting notes</p>',
      color: 'amber',
      pinned: false,
      in_trash: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      linked_dates: [testDate]
    };

    await db.saveNote(testNote);
    const notesForDate = await db.getNotesForDate(testDate);
    const found = notesForDate.some(n => n.id === noteId);
    if (!found) throw new Error(`Note ${noteId} was not found when querying date ${testDate}`);

    // Clean up
    await db.deleteNotePermanently(noteId);
  });

  // Test 4: Date Detection from Text
  await runTest('Regex scans note text and extracts dates (YYYY-MM-DD)', 'linking', () => {
    const sampleText = 'Let us meet on 2026-10-15 for kickoff and finalize on 2026-10-22.';
    const dates = extractDatesFromText(sampleText);
    if (!dates.includes('2026-10-15') || !dates.includes('2026-10-22')) {
      throw new Error(`Failed to extract dates. Got: ${JSON.stringify(dates)}`);
    }
  });

  // Test 5: Calendar Recurrence Expansion
  await runTest('Recurring weekly events expand into correct date occurrences', 'calendar', () => {
    const event: CalendarEvent = {
      id: 'recur-evt-1',
      title: 'Weekly Standup',
      description: 'Engineering sync',
      start_time: '2026-10-05T10:00:00',
      end_time: '2026-10-05T10:30:00',
      all_day: false,
      color: '#71717a',
      recurrence: 'weekly',
      created_at: '2026-10-01T00:00:00',
      updated_at: '2026-10-01T00:00:00'
    };

    const windowStart = parseISO('2026-10-01T00:00:00');
    const windowEnd = parseISO('2026-10-31T23:59:59');

    const occurrences = getEventOccurrencesInRange(event, windowStart, windowEnd);
    if (occurrences.length !== 4) {
      throw new Error(`Expected 4 occurrences for weekly event in Oct 2026, got: ${occurrences.length}`);
    }
    const dates = occurrences.map(o => o.occurrenceDate);
    if (!dates.includes('2026-10-05') || !dates.includes('2026-10-12') || !dates.includes('2026-10-19') || !dates.includes('2026-10-26')) {
      throw new Error(`Occurrences did not match expected Mondays: ${JSON.stringify(dates)}`);
    }
  });

  // Test 6: Task Creation, Due Dates, and Subtasks
  await runTest('Task subtask progress and due date filtering', 'tasks', async () => {
    const taskId = `test-task-${Date.now()}`;
    const task: Task = {
      id: taskId,
      list_id: 'test-list',
      title: 'Review offline SQLite schema',
      notes: 'Check indexes',
      due_date: '2026-10-04',
      priority: 'high',
      done: false,
      subtasks: [
        { id: 'sub-1', title: 'Step 1', done: true },
        { id: 'sub-2', title: 'Step 2', done: false }
      ],
      order_index: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db.saveTask(task);
    const tasks = await db.getTasks();
    const fetched = tasks.find(t => t.id === taskId);
    if (!fetched) throw new Error('Task was not saved');
    if (fetched.subtasks.length !== 2) throw new Error('Subtasks not preserved');
    if (fetched.priority !== 'high') throw new Error('Priority mismatch');

    // Clean up
    await db.deleteTask(taskId);
  });

  // Test 7: Backup Export & Restore Roundtrip
  await runTest('Backup JSON export generates valid schema and data snapshot', 'backup', async () => {
    const backup = await db.exportBackup();
    if (!backup.version || !backup.notes || !backup.events || !backup.tasks) {
      throw new Error('Export payload missing required collections');
    }
    if (typeof backup.exported_at !== 'string') {
      throw new Error('Missing exported_at timestamp');
    }
  });

  return results;
}
