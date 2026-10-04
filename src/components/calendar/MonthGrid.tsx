import React, { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  parseISO
} from 'date-fns';
import {
  FileText,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { useDaybook } from '../../context/DaybookContext';
import { getEventOccurrencesInRange } from '../../utils/dateDetection';
import { CalendarEvent } from '../../db/types';

interface MonthGridProps {
  currentDate: Date;
}

export const MonthGrid: React.FC<MonthGridProps> = ({ currentDate }) => {
  const {
    settings,
    events,
    tasks,
    notes,
    selectedDate,
    setSelectedDate,
    setIsDayDetailOpen,
    openCreateEventForDate,
    setEditingEvent,
    setIsEventModalOpen,
    saveEvent
  } = useDaybook();

  const weekStartsOn = settings.week_start === 'sunday' ? 0 : 1;

  // Month days array
  const { days, rangeStart, rangeEnd } = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const start = startOfWeek(monthStart, { weekStartsOn });
    const end = endOfWeek(monthEnd, { weekStartsOn });
    const allDays = eachDayOfInterval({ start, end });
    return { days: allDays, rangeStart: start, rangeEnd: end };
  }, [currentDate, weekStartsOn]);

  // Expand events in this visible window
  const expandedEvents = useMemo(() => {
    const list: Array<CalendarEvent & { occurrenceDate: string }> = [];
    for (const evt of events) {
      const occs = getEventOccurrencesInRange(evt, rangeStart, rangeEnd);
      list.push(...occs);
    }
    return list;
  }, [events, rangeStart, rangeEnd]);

  // Aggregate by date (YYYY-MM-DD)
  const dateDataMap = useMemo(() => {
    const map = new Map<string, {
      events: Array<CalendarEvent & { occurrenceDate: string }>;
      tasksDueCount: number;
      notesCount: number;
    }>();

    for (const d of days) {
      const dStr = format(d, 'yyyy-MM-dd');
      map.set(dStr, {
        events: [],
        tasksDueCount: 0,
        notesCount: 0
      });
    }

    // Events
    for (const ev of expandedEvents) {
      const entry = map.get(ev.occurrenceDate);
      if (entry) {
        entry.events.push(ev);
      }
    }

    // Tasks due
    for (const t of tasks) {
      if (t.due_date && map.has(t.due_date)) {
        map.get(t.due_date)!.tasksDueCount++;
      }
    }

    // Notes linked
    for (const n of notes) {
      if (!n.in_trash && n.linked_dates) {
        for (const ld of n.linked_dates) {
          if (map.has(ld)) {
            map.get(ld)!.notesCount++;
          }
        }
      }
    }

    return map;
  }, [days, expandedEvents, tasks, notes]);

  const weekDaysHeader = useMemo(() => {
    const sampleWeek = eachDayOfInterval({
      start: startOfWeek(new Date(), { weekStartsOn }),
      end: endOfWeek(new Date(), { weekStartsOn })
    });
    return sampleWeek.map(d => format(d, 'EEE'));
  }, [weekStartsOn]);

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsDayDetailOpen(true);
  };

  const handleEventClick = (e: React.MouseEvent, evt: CalendarEvent) => {
    e.stopPropagation();
    const originalId = evt.id.split('_occ_')[0];
    const original = events.find(x => x.id === originalId) || evt;
    setEditingEvent(original);
    setIsEventModalOpen(true);
  };

  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    const originalId = eventId.split('_occ_')[0];
    e.dataTransfer.setData('text/plain', originalId);
  };

  const handleDrop = async (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/plain');
    if (!eventId) return;

    const event = events.find(ev => ev.id === eventId);
    if (!event) return;

    const prevStart = parseISO(event.start_time);
    const prevEnd = parseISO(event.end_time);

    const startHours = format(prevStart, 'HH:mm:ss');
    const endHours = format(prevEnd, 'HH:mm:ss');

    const updatedEvent: CalendarEvent = {
      ...event,
      start_time: `${targetDateStr}T${startHours}`,
      end_time: `${targetDateStr}T${endHours}`,
      updated_at: new Date().toISOString()
    };

    await saveEvent(updatedEvent);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-100 dark:bg-zinc-950 p-2.5 select-none overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-neutral-500 dark:text-zinc-400 py-1 mb-1">
        {weekDaysHeader.map(dayName => (
          <div key={dayName} className="uppercase tracking-wider">
            {dayName}
          </div>
        ))}
      </div>

      {/* Grid of days */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-1 overflow-hidden">
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelected = dateStr === selectedDate;
          const isCurrentDay = isToday(day);
          const data = dateDataMap.get(dateStr) || { events: [], tasksDueCount: 0, notesCount: 0 };

          return (
            <div
              key={dateStr}
              onClick={() => handleDayClick(dateStr)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, dateStr)}
              className={`flex flex-col p-1.5 rounded-lg border transition-all cursor-pointer overflow-hidden ${
                isSelected
                  ? 'border-neutral-800 dark:border-white ring-2 ring-black/10 dark:ring-white/10 bg-black/[0.04] dark:bg-white/[0.06]'
                  : 'border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'
              } ${
                isCurrentMonth
                  ? 'bg-white dark:bg-zinc-900 text-neutral-900 dark:text-zinc-100'
                  : 'bg-black/[0.02] dark:bg-zinc-900/30 text-neutral-400 dark:text-zinc-600'
              }`}
            >
              {/* Day header with indicators */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                    isCurrentDay
                      ? 'bg-neutral-800 text-white dark:bg-zinc-200 dark:text-zinc-900'
                      : isSelected
                      ? 'text-neutral-900 dark:text-white font-black'
                      : ''
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {/* Visual Indicators on days with notes or tasks */}
                <div className="flex items-center gap-1">
                  {data.notesCount > 0 && (
                    <span
                      title={`${data.notesCount} note(s) linked`}
                      className="inline-flex items-center text-[10px] text-neutral-600 dark:text-zinc-400 font-medium"
                    >
                      <FileText className="w-3 h-3" />
                      {data.notesCount > 1 && <span>{data.notesCount}</span>}
                    </span>
                  )}

                  {data.tasksDueCount > 0 && (
                    <span
                      title={`${data.tasksDueCount} task(s) due`}
                      className="inline-flex items-center text-[10px] text-neutral-700 dark:text-zinc-300 font-medium"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {data.tasksDueCount > 1 && <span>{data.tasksDueCount}</span>}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCreateEventForDate(dateStr);
                    }}
                    className="opacity-0 hover:opacity-100 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    title="Add Event"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Event chips */}
              <div className="flex-1 overflow-y-auto space-y-1">
                {data.events.slice(0, 3).map(ev => (
                  <div
                    key={ev.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ev.id)}
                    onClick={(e) => handleEventClick(e, ev)}
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-grab active:cursor-grabbing text-white shadow-2xs transition-transform hover:scale-[1.02]"
                    style={{ backgroundColor: ev.color || '#71717a' }}
                    title={`${ev.title} (${ev.all_day ? 'All day' : format(parseISO(ev.start_time), 'HH:mm')})`}
                  >
                    {ev.title}
                  </div>
                ))}
                {data.events.length > 3 && (
                  <div className="text-[10px] text-neutral-500 dark:text-zinc-400 font-medium pl-1">
                    +{data.events.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
