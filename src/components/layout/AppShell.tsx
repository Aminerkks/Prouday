import React, { useState } from 'react';
import {
  Search,
  Plus,
  WifiOff,
  Sun,
  Moon
} from 'lucide-react';
import { useDaybook } from '../../context/DaybookContext';
import { Sidebar } from './Sidebar';
import { NotesListPane } from '../notes/NotesListPane';
import { NoteEditor } from '../notes/NoteEditor';
import { CalendarView } from '../calendar/CalendarView';
import { TasksView } from '../tasks/TasksView';
import { CommandPalette } from './CommandPalette';
import { EventModal } from '../calendar/EventModal';
import { TaskListModal } from '../tasks/TaskListModal';
import { SettingsModal } from '../settings/SettingsModal';
import { TestRunnerModal } from '../testing/TestRunnerModal';

export const AppShell: React.FC = () => {
  const {
    activeView,
    createNote,
    setIsCommandPaletteOpen,
    settings,
    updateSettings,
    toggleTheme,
    isLoading
  } = useDaybook();

  // Resizable panes: middle pane width state
  const [middlePaneWidth, setMiddlePaneWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      // 240px is sidebar width (w-60)
      const newWidth = Math.max(240, Math.min(500, moveEvent.clientX - 240));
      setMiddlePaneWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-neutral-900 text-white">
        <div className="w-12 h-12 rounded-2xl bg-neutral-700 flex items-center justify-center font-bold text-2xl shadow-xl animate-pulse mb-4">
          D
        </div>
        <h2 className="text-lg font-bold">Daybook</h2>
        <p className="text-xs text-neutral-400 mt-1">Starting offline storage...</p>
      </div>
    );
  }

  const showNotesList = activeView === 'notes' || activeView === 'trash';

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-neutral-100 dark:bg-zinc-950 text-neutral-900 dark:text-zinc-100 antialiased font-sans">
      {/* Top Desktop Window Bar */}
      <header className="h-10 bg-black/[0.03] dark:bg-zinc-900/90 border-b border-black/10 dark:border-white/10 flex items-center justify-between px-3 select-none backdrop-blur-xs shrink-0 z-30">
        {/* Left: Window Title & Status */}
        <div className="flex items-center gap-3">
          {/* Window control dots simulation (Linux / macOS style) */}
          <div className="flex items-center gap-1.5 pr-2">
            <div className="w-3 h-3 rounded-full bg-neutral-400 dark:bg-zinc-600 hover:opacity-80 cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-neutral-400 dark:bg-zinc-600 hover:opacity-80 cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-neutral-400 dark:bg-zinc-600 hover:opacity-80 cursor-pointer" />
          </div>

          <span className="text-xs font-bold text-neutral-800 dark:text-zinc-200 flex items-center gap-1.5">
            Daybook
            <span className="text-[10px] text-neutral-500 font-normal hidden sm:inline">
              — Offline Productivity Hub
            </span>
          </span>

          <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-zinc-300 font-mono">
            <WifiOff className="w-2.5 h-2.5" />
            Air-Gapped Local
          </span>
        </div>

        {/* Center: Command Palette Trigger */}
        <button
          type="button"
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/[0.1] border border-black/10 dark:border-white/10 rounded-lg text-xs text-neutral-600 dark:text-zinc-400 shadow-2xs transition-colors w-64 justify-between"
        >
          <div className="flex items-center gap-1.5 truncate">
            <Search className="w-3.5 h-3.5 text-neutral-500" />
            <span className="truncate">Quick search & commands...</span>
          </div>
          <kbd className="text-[10px] font-mono px-1 rounded bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-zinc-400 border border-black/10 dark:border-white/10">
            Ctrl+K
          </kbd>
        </button>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2">
          {/* Quick new note button */}
          <button
            type="button"
            onClick={() => createNote()}
            aria-label="Create new note"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-900 dark:bg-zinc-200 dark:hover:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Create new note (Alt+N)"
          >
            <Plus className="w-3.5 h-3.5 pointer-events-none" />
            <span>Note</span>
          </button>

          {/* Theme Quick Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Toggle theme (currently ${settings.theme})`}
            className="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-800 dark:text-zinc-200 transition-all border border-black/10 dark:border-white/10 active:scale-95 cursor-pointer flex items-center justify-center"
            title={settings.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 pointer-events-none transition-transform duration-200 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-700 dark:text-zinc-300 pointer-events-none transition-transform duration-200 hover:-rotate-12" />
            )}
          </button>
        </div>
      </header>

      {/* Main 3-Pane Body Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Pane 1: Left Navigation Sidebar */}
        <Sidebar />

        {/* Pane 2: Middle Notes/Trash List Pane */}
        {showNotesList && (
          <>
            <div style={{ width: `${middlePaneWidth}px` }} className="h-full shrink-0 flex">
              <NotesListPane />
            </div>

            {/* Resizer Handle */}
            <div
              onMouseDown={startResizing}
              className={`w-1 cursor-col-resize hover:bg-neutral-400 active:bg-neutral-600 transition-colors z-10 shrink-0 ${
                isResizing ? 'bg-neutral-500' : 'bg-transparent'
              }`}
              title="Drag to resize middle pane"
            />
          </>
        )}

        {/* Pane 3: Main Dynamic Content Pane */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-zinc-900">
          {activeView === 'notes' || activeView === 'trash' ? (
            <NoteEditor />
          ) : activeView === 'calendar' ? (
            <CalendarView />
          ) : (
            <TasksView />
          )}
        </main>
      </div>

      {/* Modals & Dialogs */}
      <CommandPalette />
      <EventModal />
      <TaskListModal />
      <SettingsModal />
      <TestRunnerModal />
    </div>
  );
};
