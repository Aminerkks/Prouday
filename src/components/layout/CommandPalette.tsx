import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  FileText,
  Calendar,
  CheckSquare,
  ArrowRight
} from 'lucide-react';
import { useDaybook } from '../../context/DaybookContext';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    notes,
    events,
    tasks,
    setSelectedNoteId,
    setActiveView,
    createNote,
    openCreateEventForDate,
    createTask,
    selectedDate,
    settings,
    updateSettings,
    toggleTheme
  } = useDaybook();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  // Search results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list: Array<{
      id: string;
      title: string;
      subtitle: string;
      type: 'note' | 'event' | 'task' | 'action';
      action: () => void;
    }> = [];

    // System actions
    if (!q || 'new note'.includes(q) || 'create'.includes(q)) {
      list.push({
        id: 'action-new-note',
        title: 'Create New Note',
        subtitle: 'Start writing a rich text note',
        type: 'action',
        action: async () => {
          const note = await createNote();
          setSelectedNoteId(note.id);
          setActiveView('notes');
        }
      });
    }

    if (!q || 'new event'.includes(q) || 'calendar'.includes(q)) {
      list.push({
        id: 'action-new-event',
        title: 'Create Calendar Event',
        subtitle: 'Add an event to the schedule',
        type: 'action',
        action: () => {
          openCreateEventForDate(selectedDate);
          setActiveView('calendar');
        }
      });
    }

    if (!q || 'new task'.includes(q) || 'todo'.includes(q)) {
      list.push({
        id: 'action-new-task',
        title: 'Create Task',
        subtitle: 'Add a new offline task',
        type: 'action',
        action: async () => {
          await createTask('New Task');
          setActiveView('tasks');
        }
      });
    }

    if (!q || 'theme'.includes(q) || 'dark'.includes(q) || 'light'.includes(q)) {
      list.push({
        id: 'action-toggle-theme',
        title: `Switch Theme (currently ${settings.theme})`,
        subtitle: 'Toggle Light, Dark, or System mode',
        type: 'action',
        action: () => {
          toggleTheme();
        }
      });
    }

    // Notes matches
    if (q) {
      for (const note of notes) {
        if (note.title.toLowerCase().includes(q) || note.body.toLowerCase().includes(q)) {
          list.push({
            id: note.id,
            title: note.title,
            subtitle: note.linked_dates?.join(', ') || 'No date linked',
            type: 'note',
            action: () => {
              setSelectedNoteId(note.id);
              setActiveView('notes');
            }
          });
        }
      }

      // Event matches
      for (const ev of events) {
        if (ev.title.toLowerCase().includes(q) || ev.description?.toLowerCase().includes(q)) {
          list.push({
            id: ev.id,
            title: ev.title,
            subtitle: `Event on ${ev.start_time.split('T')[0]}`,
            type: 'event',
            action: () => {
              setActiveView('calendar');
            }
          });
        }
      }

      // Task matches
      for (const task of tasks) {
        if (task.title.toLowerCase().includes(q) || task.notes?.toLowerCase().includes(q)) {
          list.push({
            id: task.id,
            title: task.title,
            subtitle: `Priority: ${task.priority} ${task.due_date ? `(Due ${task.due_date})` : ''}`,
            type: 'task',
            action: () => {
              setActiveView('tasks');
            }
          });
        }
      }
    }

    return list.slice(0, 10);
  }, [query, notes, events, tasks, selectedDate, settings.theme, createNote, openCreateEventForDate, createTask, setSelectedNoteId, setActiveView, updateSettings]);

  if (!isCommandPaletteOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].action();
        setIsCommandPaletteOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsCommandPaletteOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
        {/* Search input bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-black/10 dark:border-white/10">
          <Search className="w-5 h-5 text-neutral-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search notes, events, tasks..."
            className="flex-1 bg-transparent border-none outline-none text-neutral-900 dark:text-zinc-100 placeholder-neutral-400 text-sm"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-neutral-500 border border-black/10 dark:border-white/10 rounded bg-black/5 dark:bg-white/10">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {results.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400">
              No matching notes, events, or commands found.
            </div>
          ) : (
            results.map((res, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={res.id}
                  onClick={() => {
                    res.action();
                    setIsCommandPaletteOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors text-xs ${
                    isSelected
                      ? 'bg-black/10 dark:bg-white/15 text-neutral-950 dark:text-white font-semibold'
                      : 'text-neutral-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="text-neutral-500 dark:text-zinc-400">
                      {res.type === 'note' && <FileText className="w-4 h-4" />}
                      {res.type === 'event' && <Calendar className="w-4 h-4" />}
                      {res.type === 'task' && <CheckSquare className="w-4 h-4" />}
                      {res.type === 'action' && <ArrowRight className="w-4 h-4" />}
                    </div>
                    <div className="truncate">
                      <div className="font-semibold truncate">{res.title}</div>
                      <div className="text-[10px] truncate opacity-75">
                        {res.subtitle}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-zinc-400">
                    {res.type}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/10 dark:border-white/10 flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-2">
            <span>Navigate: <kbd>↑</kbd> <kbd>↓</kbd></span>
            <span>Select: <kbd>↵</kbd></span>
          </div>
          <span>Daybook Offline</span>
        </div>
      </div>
    </div>
  );
};
