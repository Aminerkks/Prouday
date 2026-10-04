import React, { useState, useEffect } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { X, Calendar, Clock, Repeat, Palette, Trash2 } from 'lucide-react';
import { useDaybook } from '../../context/DaybookContext';
import { CalendarEvent, RecurrenceType } from '../../db/types';

export const EventModal: React.FC = () => {
  const { isEventModalOpen, setIsEventModalOpen, editingEvent, saveEvent, deleteEvent } = useDaybook();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState('#3b82f6');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setDescription(editingEvent.description || '');
      setAllDay(Boolean(editingEvent.all_day));
      setColor(editingEvent.color || '#3b82f6');
      setRecurrence(editingEvent.recurrence || 'none');

      const s = parseISO(editingEvent.start_time);
      const e = parseISO(editingEvent.end_time);

      if (isValid(s)) {
        setStartDate(format(s, 'yyyy-MM-dd'));
        setStartTime(format(s, 'HH:mm'));
      } else {
        const today = format(new Date(), 'yyyy-MM-dd');
        setStartDate(today);
        setStartTime('09:00');
      }

      if (isValid(e)) {
        setEndDate(format(e, 'yyyy-MM-dd'));
        setEndTime(format(e, 'HH:mm'));
      } else {
        const today = format(new Date(), 'yyyy-MM-dd');
        setEndDate(today);
        setEndTime('10:00');
      }
    }
  }, [editingEvent]);

  if (!isEventModalOpen || !editingEvent) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const startIso = allDay
      ? `${startDate}T00:00:00`
      : `${startDate}T${startTime}:00`;
    const endIso = allDay
      ? `${endDate || startDate}T23:59:59`
      : `${endDate || startDate}T${endTime}:00`;

    const eventToSave: CalendarEvent = {
      ...editingEvent,
      title: title.trim(),
      description: description.trim(),
      start_time: startIso,
      end_time: endIso,
      all_day: allDay,
      color,
      recurrence,
      updated_at: new Date().toISOString()
    };

    saveEvent(eventToSave);
  };

  const presetColors = [
    { label: 'Blue', hex: '#3b82f6' },
    { label: 'Indigo', hex: '#6366f1' },
    { label: 'Emerald', hex: '#10b981' },
    { label: 'Amber', hex: '#f59e0b' },
    { label: 'Rose', hex: '#f43f5e' },
    { label: 'Purple', hex: '#a855f7' },
    { label: 'Teal', hex: '#14b8a6' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 select-none">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-md overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
          <h3 className="text-base font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            {editingEvent.title ? 'Edit Event' : 'Create Event'}
          </h3>
          <button
            type="button"
            onClick={() => setIsEventModalOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
              Event Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sprint Planning, Project Review..."
              className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          {/* All day toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDayCheckbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="allDayCheckbox" className="text-slate-700 dark:text-zinc-300 font-medium cursor-pointer">
              All Day Event
            </label>
          </div>

          {/* Date & Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-zinc-400 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate < e.target.value) setEndDate(e.target.value);
                }}
                className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-zinc-700 rounded-md bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100"
              />
            </div>
            {!allDay && (
              <div>
                <label className="block text-slate-600 dark:text-zinc-400 mb-1">Start Time</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-zinc-700 rounded-md bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-zinc-400 mb-1">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-zinc-700 rounded-md bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100"
              />
            </div>
            {!allDay && (
              <div>
                <label className="block text-slate-600 dark:text-zinc-400 mb-1">End Time</label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-zinc-700 rounded-md bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100"
                />
              </div>
            )}
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-slate-400" />
              Recurrence
            </label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
              className="w-full px-2.5 py-1.5 border border-black/15 dark:border-white/15 rounded-md bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100 cursor-pointer"
            >
              <option value="none" className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100">Does not repeat</option>
              <option value="daily" className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100">Daily</option>
              <option value="weekly" className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100">Weekly</option>
              <option value="monthly" className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100">Monthly</option>
              <option value="yearly" className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100">Yearly</option>
            </select>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              Color Label
            </label>
            <div className="flex items-center gap-2">
              {presetColors.map(c => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    color === c.hex
                      ? 'border-indigo-600 scale-110'
                      : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
              Description / Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, agendas, or context..."
              className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-zinc-700 rounded-md bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800">
            {editingEvent.created_at ? (
              <button
                type="button"
                onClick={() => deleteEvent(editingEvent.id)}
                className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEventModalOpen(false)}
                className="px-3 py-1.5 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-xs"
              >
                Save Event
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
