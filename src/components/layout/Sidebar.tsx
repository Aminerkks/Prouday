import React from 'react';
import {
  FileText,
  Calendar,
  CheckSquare,
  Trash2,
  Settings,
  HardDrive,
  ShieldCheck,
  FlaskConical,
  Plus
} from 'lucide-react';
import { useDaybook, MainView } from '../../context/DaybookContext';

export const Sidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    notes,
    trashNotes,
    tasks,
    createNote,
    setIsSettingsModalOpen,
    setIsTestRunnerOpen
  } = useDaybook();

  const pendingTasksCount = tasks.filter(t => !t.done).length;
  const trashCount = trashNotes.length;

  const navItems = [
    {
      id: 'notes' as MainView,
      label: 'Notes',
      icon: FileText,
      badge: notes.length,
      isCenteredBadge: false
    },
    {
      id: 'calendar' as MainView,
      label: 'Calendar',
      icon: Calendar,
      badge: null,
      isCenteredBadge: false
    },
    {
      id: 'tasks' as MainView,
      label: 'Tasks',
      icon: CheckSquare,
      badge: pendingTasksCount,
      isCenteredBadge: true
    },
    {
      id: 'trash' as MainView,
      label: 'Trash',
      icon: Trash2,
      badge: trashCount,
      isCenteredBadge: true
    }
  ];

  return (
    <aside className="w-60 h-full flex flex-col border-r border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-zinc-950 select-none shrink-0">
      {/* App Branding & Logo */}
      <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-neutral-800 dark:bg-zinc-200 flex items-center justify-center text-white dark:text-zinc-900 shadow-xs font-bold text-base">
            D
          </div>
          <div>
            <div className="text-sm font-bold text-neutral-900 dark:text-zinc-100 flex items-center gap-1.5">
              Daybook
              <span className="text-[10px] font-normal px-1 py-0.2 bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-zinc-300 rounded font-mono border border-black/5 dark:border-white/10">
                OFFLINE
              </span>
            </div>
            <div className="text-[10px] text-neutral-500 dark:text-zinc-400">
              Personal Productivity
            </div>
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <div className="p-2 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'app-highlight-active font-semibold border shadow-2xs'
                  : 'text-neutral-700 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-neutral-950 dark:hover:text-zinc-100'
              }`}
            >
              {/* Left icon and label */}
              <div className="flex items-center gap-2.5 min-w-[75px]">
                <Icon className="w-4 h-4 shrink-0 text-neutral-600 dark:text-zinc-400" />
                <span>{item.label}</span>
              </div>

              {/* Centered count badge for Tasks and Trash as requested! */}
              {item.isCenteredBadge ? (
                <div className="flex-1 flex justify-center">
                  <span
                    className={`inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-tight ${
                      isActive
                        ? 'bg-black/15 dark:bg-white/20 text-neutral-950 dark:text-white'
                        : 'bg-black/5 dark:bg-white/10 text-neutral-800 dark:text-zinc-300 border border-black/5 dark:border-white/5'
                    }`}
                    title={`${item.badge} ${item.label.toLowerCase()}`}
                  >
                    {item.badge ?? 0}
                  </span>
                </div>
              ) : (
                item.badge !== null && (
                  <div className="ml-auto">
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? 'bg-black/15 dark:bg-white/20 text-neutral-950 dark:text-white'
                          : 'bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-zinc-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>
                )
              )}
            </button>
          );
        })}
      </div>

      {/* Prominent Centered Counts Widget for Tasks and Trash */}
      <div className="mx-3 my-2 p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-center">
        <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-zinc-400 mb-2">
          Workspace Overview
        </div>
        <div className="grid grid-cols-2 gap-2">
          {/* Centered Tasks count */}
          <div
            onClick={() => setActiveView('tasks')}
            className="p-2 rounded-lg bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.1] cursor-pointer transition-colors"
          >
            <div className="text-lg font-bold text-neutral-900 dark:text-zinc-100 font-mono">
              {pendingTasksCount}
            </div>
            <div className="text-[10px] font-medium text-neutral-600 dark:text-zinc-400">
              Tasks
            </div>
          </div>

          {/* Centered Trash count */}
          <div
            onClick={() => setActiveView('trash')}
            className="p-2 rounded-lg bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.1] cursor-pointer transition-colors"
          >
            <div className="text-lg font-bold text-neutral-900 dark:text-zinc-100 font-mono">
              {trashCount}
            </div>
            <div className="text-[10px] font-medium text-neutral-600 dark:text-zinc-400">
              In Trash
            </div>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Tools & Settings */}
      <div className="p-3 border-t border-black/10 dark:border-white/10 space-y-1.5 text-xs">
        {/* Unit tests trigger */}
        <button
          type="button"
          onClick={() => setIsTestRunnerOpen(true)}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-neutral-700 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-medium"
        >
          <FlaskConical className="w-4 h-4 text-neutral-500 dark:text-zinc-400" />
          <span>Run Test Suite</span>
        </button>

        {/* Settings button */}
        <button
          type="button"
          onClick={() => setIsSettingsModalOpen(true)}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-neutral-700 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-medium"
        >
          <Settings className="w-4 h-4 text-neutral-500 dark:text-zinc-400" />
          <span>Settings</span>
        </button>

        {/* Offline & security status */}
        <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-[10px] text-neutral-500 dark:text-zinc-400">
          <span className="flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3 h-3 text-neutral-700 dark:text-zinc-300" />
            No Telemetry
          </span>
          <span className="flex items-center gap-1 font-mono">
            <HardDrive className="w-3 h-3 text-neutral-600 dark:text-zinc-400" />
            Local SQLite
          </span>
        </div>
      </div>
    </aside>
  );
};
