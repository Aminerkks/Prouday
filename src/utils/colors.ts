import { NoteColor } from '../db/types';

export const NOTE_COLOR_PRESETS: { id: NoteColor; label: string; bgClass: string; borderClass: string; badgeClass: string; hex: string }[] = [
  {
    id: 'default',
    label: 'Default',
    bgClass: 'bg-white dark:bg-zinc-900',
    borderClass: 'border-slate-200 dark:border-zinc-800',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300',
    hex: '#71717a'
  },
  {
    id: 'indigo',
    label: 'Indigo',
    bgClass: 'bg-indigo-50/60 dark:bg-indigo-950/25',
    borderClass: 'border-indigo-200 dark:border-indigo-900/60',
    badgeClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    hex: '#6366f1'
  },
  {
    id: 'blue',
    label: 'Blue',
    bgClass: 'bg-blue-50/60 dark:bg-blue-950/25',
    borderClass: 'border-blue-200 dark:border-blue-900/60',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    hex: '#3b82f6'
  },
  {
    id: 'emerald',
    label: 'Emerald',
    bgClass: 'bg-emerald-50/60 dark:bg-emerald-950/25',
    borderClass: 'border-emerald-200 dark:border-emerald-900/60',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    hex: '#10b981'
  },
  {
    id: 'amber',
    label: 'Amber',
    bgClass: 'bg-amber-50/60 dark:bg-amber-950/25',
    borderClass: 'border-amber-200 dark:border-amber-900/60',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    hex: '#f59e0b'
  },
  {
    id: 'rose',
    label: 'Rose',
    bgClass: 'bg-rose-50/60 dark:bg-rose-950/25',
    borderClass: 'border-rose-200 dark:border-rose-900/60',
    badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    hex: '#f43f5e'
  },
  {
    id: 'purple',
    label: 'Purple',
    bgClass: 'bg-purple-50/60 dark:bg-purple-950/25',
    borderClass: 'border-purple-200 dark:border-purple-900/60',
    badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    hex: '#a855f7'
  },
  {
    id: 'teal',
    label: 'Teal',
    bgClass: 'bg-teal-50/60 dark:bg-teal-950/25',
    borderClass: 'border-teal-200 dark:border-teal-900/60',
    badgeClass: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    hex: '#14b8a6'
  },
  {
    id: 'orange',
    label: 'Orange',
    bgClass: 'bg-orange-50/60 dark:bg-orange-950/25',
    borderClass: 'border-orange-200 dark:border-orange-900/60',
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    hex: '#f97316'
  },
  {
    id: 'slate',
    label: 'Slate',
    bgClass: 'bg-slate-100/60 dark:bg-zinc-800/40',
    borderClass: 'border-slate-300 dark:border-zinc-700',
    badgeClass: 'bg-slate-200 text-slate-800 dark:bg-zinc-700 dark:text-zinc-200',
    hex: '#64748b'
  }
];

export function getNoteColorConfig(color: NoteColor) {
  return NOTE_COLOR_PRESETS.find(c => c.id === color) || NOTE_COLOR_PRESETS[0];
}
