import React, { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  X,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  FileText,
  CalendarDays,
  ChevronRight,
  Pin
} from 'lucide-react';
import { useDaybook } from '../../context/DaybookContext';
import { getEventOccurrencesInRange } from '../../utils/dateDetection';
import { CalendarEvent } from '../../db/types';

export const DayDetailPanel: React.FC = () => {
  const {
    selectedDate,
    isDayDetailOpen,
    setIsDayDetailOpen,
    events,
    tasks,
    notes,
    toggleTaskDone,
    createTask,
    createNote,
    setSelectedNoteId,
    setActiveView,
    setEditingEvent,
    setIsEventModalOpen,
    openCreateEventForDate
  } = useDaybook();

  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Events for selected date
  const dayEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateObj = parseISO(selectedDate);
    const dayStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0);
    const dayEnd = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59);

    const occurrences: CalendarEvent[] = [];
    for (const evt of events) {
      const occs = getEventOccurrencesInRange(evt, dayStart, dayEnd);
      occurrences.push(...occs);
    }
    return occurrences;
  }, [events, selectedDate]);

  // Tasks due on this day
  const dayTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter(t => t.due_date === selectedDate);
  }, [tasks, selectedDate]);

  // Notes linked to this day
  const dayNotes = useMemo(() => {
    if (!selectedDate) return [];
    return notes.filter(n => !n.in_trash && n.linked_dates?.includes(selectedDate));
  }, [notes, selectedDate]);

  if (!isDayDetailOpen) return null;

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await createTask(newTaskTitle.trim(), undefined, selectedDate);
    setNewTaskTitle('');
  };

  const handleAddNoteToDay = async () => {
    const note = await createNote(
      { title: `Note for ${selectedDate}` },
      selectedDate
    );
    setSelectedNoteId(note.id);
    setActiveView('notes');
  };

  const handleOpenNote = (noteId: string) => {
    setSelectedNoteId(noteId);
    setActiveView('notes');
  };

  const handleEditEvent = (evt: CalendarEvent) => {
    setEditingEvent(evt);
    setIsEventModalOpen(true);
  };

  const parsedDate = parseISO(selectedDate);
  const formattedHeader = format(parsedDate, 'EEEE, MMMM d, yyyy');

  return (
    <div className="w-96 h-full flex flex-col border-l border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 select-none shadow-xl z-20 shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
            Day Overview
          </span>
          <h2 className="text-sm font-bold text-neutral-900 dark:text-zinc-100">
            {formattedHeader}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setIsDayDetailOpen(false)}
          className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Action Buttons */}
      <div className="p-3 border-b border-black/10 dark:border-white/10 flex items-center gap-2">
        <button
          type="button"
          onClick={() => openCreateEventForDate(selectedDate)}
          className="flex-1 py-1.5 px-2 bg-black/[0.05] hover:bg-black/[0.1] dark:bg-white/10 dark:hover:bg-white/15 text-neutral-800 dark:text-zinc-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-black/5 dark:border-white/5"
        >
          <CalendarDays className="w-3.5 h-3.5" />
          + Event
        </button>
        <button
          type="button"
          onClick={handleAddNoteToDay}
          className="flex-1 py-1.5 px-2 bg-black/[0.05] hover:bg-black/[0.1] dark:bg-white/10 dark:hover:bg-white/15 text-neutral-800 dark:text-zinc-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-black/5 dark:border-white/5"
        >
          <FileText className="w-3.5 h-3.5" />
          + Add Note
        </button>
      </div>

      {/* Main Content Sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* SECTION 1: EVENTS */}
        <div>
          <h3 className="text-xs font-bold text-neutral-700 dark:text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-neutral-500" />
            Events ({dayEvents.length})
          </h3>

          {dayEvents.length === 0 ? (
            <div className="p-3 rounded-lg border border-dashed border-black/10 dark:border-white/10 text-center text-xs text-neutral-400">
              No events scheduled
            </div>
          ) : (
            <div className="space-y-2">
              {dayEvents.map(evt => {
                const start = parseISO(evt.start_time);
                const end = parseISO(evt.end_time);
                const timeText = evt.all_day
                  ? 'All Day'
                  : `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;

                const linkedNotes = notes.filter(n => n.linked_event_ids?.includes(evt.id));

                return (
                  <div
                    key={evt.id}
                    onClick={() => handleEditEvent(evt)}
                    className="p-3 rounded-lg border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 bg-white dark:bg-zinc-800/80 cursor-pointer shadow-2xs group transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: evt.color || '#71717a' }}
                        />
                        <h4 className="text-xs font-semibold text-neutral-900 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white">
                          {evt.title}
                        </h4>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {timeText}
                      </span>
                    </div>

                    {evt.description && (
                      <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-1 line-clamp-2">
                        {evt.description}
                      </p>
                    )}

                    {linkedNotes.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5 flex items-center gap-1.5 text-[10px] text-neutral-600 dark:text-zinc-400 font-medium">
                        <FileText className="w-3 h-3" />
                        <span>{linkedNotes.length} Linked Note(s)</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: TASKS */}
        <div>
          <h3 className="text-xs font-bold text-neutral-700 dark:text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500" />
            Tasks Due Today ({dayTasks.length})
          </h3>

          <form onSubmit={handleCreateTask} className="mb-2">
            <div className="flex items-center gap-1 bg-black/[0.03] dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded-lg px-2 py-1">
              <Plus className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add task due today..."
                className="w-full text-xs bg-transparent border-none outline-none text-neutral-800 dark:text-zinc-200 placeholder-neutral-400"
              />
            </div>
          </form>

          {dayTasks.length === 0 ? (
            <div className="p-3 rounded-lg border border-dashed border-black/10 dark:border-white/10 text-center text-xs text-neutral-400">
              No tasks due on this date
            </div>
          ) : (
            <div className="space-y-1.5">
              {dayTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-black/[0.02] dark:bg-zinc-800/60 hover:bg-black/[0.05] dark:hover:bg-zinc-800 text-xs transition-colors border border-black/5 dark:border-white/5"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleTaskDone(task.id)}
                      className="text-neutral-400 hover:text-neutral-800 dark:hover:text-zinc-200 shrink-0"
                    >
                      {task.done ? (
                        <CheckCircle2 className="w-4 h-4 text-neutral-700 dark:text-zinc-300 fill-black/10 dark:fill-white/10" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                    <span className={`truncate ${task.done ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-zinc-200'}`}>
                      {task.title}
                    </span>
                  </div>

                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase shrink-0 bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-zinc-300">
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 3: NOTES LINKED TO THIS DAY */}
        <div>
          <h3 className="text-xs font-bold text-neutral-700 dark:text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-neutral-500" />
            Linked Notes ({dayNotes.length})
          </h3>

          {dayNotes.length === 0 ? (
            <div className="p-3 rounded-lg border border-dashed border-black/10 dark:border-white/10 text-center text-xs text-neutral-400">
              No notes linked to this day
            </div>
          ) : (
            <div className="space-y-2">
              {dayNotes.map(note => {
                const plainSnippet = note.body.replace(/<[^>]*>/g, ' ').trim().slice(0, 70);
                return (
                  <div
                    key={note.id}
                    onClick={() => handleOpenNote(note.id)}
                    className="p-3 rounded-lg border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 bg-white dark:bg-zinc-800/80 cursor-pointer shadow-2xs group transition-all"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-semibold text-neutral-900 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white flex items-center gap-1">
                        {note.pinned && <Pin className="w-3 h-3 text-neutral-500 fill-neutral-500 shrink-0" />}
                        {note.title}
                      </h4>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    {plainSnippet && (
                      <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-1 line-clamp-2">
                        {plainSnippet}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
