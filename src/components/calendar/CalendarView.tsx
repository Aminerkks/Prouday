import React, { useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  LayoutGrid,
  Columns
} from 'lucide-react';
import { useDaybook } from '../../context/DaybookContext';
import { MonthGrid } from './MonthGrid';
import { WeekGrid } from './WeekGrid';
import { DayDetailPanel } from './DayDetailPanel';

export const CalendarView: React.FC = () => {
  const {
    openCreateEventForDate,
    selectedDate
  } = useDaybook();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month');

  const handlePrev = () => {
    if (calendarMode === 'month') {
      setCurrentDate(prev => subMonths(prev, 1));
    } else {
      setCurrentDate(prev => subWeeks(prev, 1));
    }
  };

  const handleNext = () => {
    if (calendarMode === 'month') {
      setCurrentDate(prev => addMonths(prev, 1));
    } else {
      setCurrentDate(prev => addWeeks(prev, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-neutral-100 dark:bg-zinc-950">
      {/* Calendar Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Control Bar */}
        <div className="px-6 py-3 border-b border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 flex items-center justify-between select-none">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-bold text-neutral-900 dark:text-zinc-100 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-neutral-600 dark:text-zinc-400" />
              {calendarMode === 'month'
                ? format(currentDate, 'MMMM yyyy')
                : `Week of ${format(currentDate, 'MMM d, yyyy')}`}
            </h1>

            {/* Navigation buttons */}
            <div className="flex items-center gap-1 border border-black/10 dark:border-white/10 rounded-lg p-0.5 bg-black/[0.02] dark:bg-white/[0.02]">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-zinc-300"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-2 py-0.5 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 text-neutral-800 dark:text-zinc-200 rounded"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-zinc-300"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher (Month / Week) */}
            <div className="flex items-center bg-black/5 dark:bg-white/10 p-0.5 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setCalendarMode('month')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                  calendarMode === 'month'
                    ? 'bg-white dark:bg-zinc-800 text-neutral-950 dark:text-white shadow-2xs font-semibold'
                    : 'text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Month
              </button>
              <button
                type="button"
                onClick={() => setCalendarMode('week')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                  calendarMode === 'week'
                    ? 'bg-white dark:bg-zinc-800 text-neutral-950 dark:text-white shadow-2xs font-semibold'
                    : 'text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                Week
              </button>
            </div>

            {/* Quick new event */}
            <button
              type="button"
              onClick={() => openCreateEventForDate(selectedDate)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-900 dark:bg-zinc-200 dark:hover:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Event</span>
            </button>
          </div>
        </div>

        {/* View Grid */}
        {calendarMode === 'month' ? (
          <MonthGrid currentDate={currentDate} />
        ) : (
          <WeekGrid currentDate={currentDate} />
        )}
      </div>

      {/* Day Detail Side panel */}
      <DayDetailPanel />
    </div>
  );
};
