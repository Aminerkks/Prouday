import React, { useMemo } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  parseISO
} from 'date-fns';
import {
  FileText,
  CheckCircle2
} from 'lucide-react';
import { useDaybook } from '../../context/DaybookContext';
import { getEventOccurrencesInRange } from '../../utils/dateDetection';
import { CalendarEvent } from '../../db/types';

interface WeekGridProps {
  currentDate: Date;
}

export const WeekGrid: React.FC<WeekGridProps> = ({ currentDate }) => {
  const {
    settings,
    events,
    tasks,
    notes,
    selectedDate,
    setSelectedDate,
    setIsDayDetailOpen,
    setEditingEvent,
    setIsEventModalOpen,
    saveEvent
  } = useDaybook();

  const weekStartsOn = settings.week_start === 'sunday' ? 0 : 1;

  const { weekDays, rangeStart, rangeEnd } = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn });
    const end = endOfWeek(currentDate, { weekStartsOn });
    return {
      weekDays: eachDayOfInterval({ start, end }),
      rangeStart: start,
      rangeEnd: end
    };
  }, [currentDate, weekStartsOn]);

  // Hours: 07:00 to 22:00
  const hours = useMemo(() => Array.from({ length: 16 }, (_, i) => i + 7), []);

  // Events in this week range
  const expandedEvents = useMemo(() => {
    const list: Array<CalendarEvent & { occurrenceDate: string }> = [];
    for (const evt of events) {
      const occs = getEventOccurrencesInRange(evt, rangeStart, rangeEnd);
      list.push(...occs);
    }
    return list;
  }, [events, rangeStart, rangeEnd]);

  const handleTimeSlotClick = (dateStr: string, hour: number) => {
    const newEvent: CalendarEvent = {
      id: `event-${crypto.randomUUID()}`,
      title: '',
      description: '',
      start_time: `${dateStr}T${String(hour).padStart(2, '0')}:00:00`,
      end_time: `${dateStr}T${String(hour + 1).padStart(2, '0')}:00:00`,
      all_day: false,
      color: '#71717a',
      recurrence: 'none',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setEditingEvent(newEvent);
    setIsEventModalOpen(true);
  };

  const handleEventClick = (e: React.MouseEvent, evt: CalendarEvent) => {
    e.stopPropagation();
    const originalId = evt.id.split('_occ_')[0];
    const original = events.find(x => x.id === originalId) || evt;
    setEditingEvent(original);
    setIsEventModalOpen(true);
  };

  // Resize event handler (+30 mins)
  const handleExtendDuration = async (e: React.MouseEvent, evt: CalendarEvent) => {
    e.stopPropagation();
    const originalId = evt.id.split('_occ_')[0];
    const original = events.find(x => x.id === originalId);
    if (!original) return;

    const currentEnd = parseISO(original.end_time);
    const newEnd = new Date(currentEnd.getTime() + 30 * 60 * 1000);

    const updated: CalendarEvent = {
      ...original,
      end_time: format(newEnd, "yyyy-MM-dd'T'HH:mm:ss"),
      updated_at: new Date().toISOString()
    };
    await saveEvent(updated);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-100 dark:bg-zinc-950 p-2 select-none overflow-hidden">
      {/* Header with week days */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 border-b border-black/10 dark:border-white/10 pb-2 mb-1">
        <div className="text-right pr-2 text-xs font-semibold text-neutral-400">Time</div>
        {weekDays.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isCurrentDay = isToday(day);
          const isSelected = dateStr === selectedDate;
          const notesCount = notes.filter(n => !n.in_trash && n.linked_dates?.includes(dateStr)).length;
          const tasksCount = tasks.filter(t => t.due_date === dateStr).length;

          return (
            <div
              key={dateStr}
              onClick={() => {
                setSelectedDate(dateStr);
                setIsDayDetailOpen(true);
              }}
              className={`p-1.5 rounded-lg text-center cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-black/10 dark:bg-white/10 border border-black/15 dark:border-white/15'
                  : 'hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-zinc-400">
                {format(day, 'EEE')}
              </div>
              <div
                className={`text-sm font-bold w-7 h-7 mx-auto flex items-center justify-center rounded-full mt-0.5 ${
                  isCurrentDay ? 'bg-neutral-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'text-neutral-800 dark:text-zinc-200'
                }`}
              >
                {format(day, 'd')}
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-1 text-[10px]">
                {notesCount > 0 && (
                  <span className="flex items-center text-neutral-600 dark:text-zinc-400" title={`${notesCount} linked notes`}>
                    <FileText className="w-2.5 h-2.5" />
                  </span>
                )}
                {tasksCount > 0 && (
                  <span className="flex items-center text-neutral-600 dark:text-zinc-400" title={`${tasksCount} tasks due`}>
                    <CheckCircle2 className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time slots container */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 relative min-h-[900px]">
          {/* Time markers column */}
          <div className="flex flex-col">
            {hours.map(h => (
              <div
                key={h}
                className="h-14 border-t border-black/5 dark:border-white/5 pr-2 text-right text-[11px] text-neutral-400 font-mono"
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Days columns */}
          {weekDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayEvents = expandedEvents.filter(ev => ev.occurrenceDate === dateStr);

            return (
              <div key={dateStr} className="relative flex flex-col bg-white dark:bg-zinc-900 rounded border border-black/10 dark:border-white/10">
                {/* Hourly background lines */}
                {hours.map(h => (
                  <div
                    key={h}
                    onClick={() => handleTimeSlotClick(dateStr, h)}
                    className="h-14 border-t border-black/5 dark:border-white/5 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer transition-colors"
                  />
                ))}

                {/* Event overlay cards */}
                {dayEvents.map(ev => {
                  const start = parseISO(ev.start_time);
                  const end = parseISO(ev.end_time);
                  const startHour = start.getHours() + start.getMinutes() / 60;
                  const endHour = end.getHours() + end.getMinutes() / 60;

                  const clampedStart = Math.max(7, Math.min(23, startHour));
                  const clampedEnd = Math.max(clampedStart + 0.5, Math.min(23, endHour));

                  const topPx = (clampedStart - 7) * 56;
                  const heightPx = Math.max(28, (clampedEnd - clampedStart) * 56);

                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => handleEventClick(e, ev)}
                      style={{
                        top: `${topPx}px`,
                        height: `${heightPx}px`,
                        backgroundColor: ev.color || '#71717a'
                      }}
                      className="absolute inset-x-1 rounded p-1.5 text-white shadow-xs z-10 cursor-pointer overflow-hidden flex flex-col justify-between group hover:ring-2 hover:ring-white/80 transition-all"
                    >
                      <div>
                        <div className="font-semibold text-xs truncate">{ev.title}</div>
                        <div className="text-[10px] opacity-90 font-mono">
                          {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                        </div>
                      </div>

                      {/* Resize drag handle */}
                      <button
                        type="button"
                        onClick={(e) => handleExtendDuration(e, ev)}
                        title="Extend 30 mins"
                        className="self-end text-[9px] bg-black/20 hover:bg-black/40 px-1 rounded opacity-0 group-hover:opacity-100"
                      >
                        +30m
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
