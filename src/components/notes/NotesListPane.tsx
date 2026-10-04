import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Search,
  Plus,
  Pin,
  Calendar,
  Trash2,
  ArrowUpDown,
  Palette,
  X
} from 'lucide-react';
import { useDaybook } from '../../context/DaybookContext';
import { NOTE_COLOR_PRESETS, getNoteColorConfig } from '../../utils/colors';
import { NoteColor } from '../../db/types';

export const NotesListPane: React.FC = () => {
  const {
    notes,
    trashNotes,
    activeView,
    selectedNoteId,
    setSelectedNoteId,
    createNote,
    searchQuery,
    setSearchQuery,
    selectedColorFilter,
    setSelectedColorFilter,
    sortOption,
    setSortOption
  } = useDaybook();

  const isTrashView = activeView === 'trash';
  const sourceNotes = isTrashView ? trashNotes : notes;

  // Filter & sort logic (tags removed)
  const filteredNotes = useMemo(() => {
    return sourceNotes
      .filter(note => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = note.title.toLowerCase().includes(q);
          const matchBody = note.body.toLowerCase().includes(q);
          if (!matchTitle && !matchBody) return false;
        }

        // Color filter
        if (selectedColorFilter) {
          if (note.color !== selectedColorFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (!isTrashView && a.pinned !== b.pinned) {
          return a.pinned ? -1 : 1;
        }

        if (sortOption === 'title') {
          return a.title.localeCompare(b.title);
        } else if (sortOption === 'created') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        } else {
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        }
      });
  }, [sourceNotes, searchQuery, selectedColorFilter, sortOption, isTrashView]);

  return (
    <div className="w-80 h-full flex flex-col border-r border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 select-none shrink-0">
      {/* Search Header */}
      <div className="p-3 border-b border-black/10 dark:border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight text-neutral-800 dark:text-zinc-200 flex items-center gap-1.5">
            {isTrashView ? (
              <>
                <Trash2 className="w-4 h-4 text-neutral-500" />
                Trash ({trashNotes.length})
              </>
            ) : (
              <>
                Notes ({filteredNotes.length})
              </>
            )}
          </h2>

          {!isTrashView && (
            <button
              type="button"
              onClick={() => createNote()}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-900 dark:bg-zinc-200 dark:hover:bg-white text-white dark:text-zinc-900 shadow-2xs transition-colors"
              title="Create new note (Alt+N)"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes or text..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/5 rounded-md text-neutral-900 dark:text-zinc-100 placeholder-neutral-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-neutral-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter & Sort Bar */}
        <div className="flex items-center justify-between gap-1 pt-1 text-[11px] text-neutral-600 dark:text-zinc-400">
          {/* Color filter */}
          <div className="flex items-center gap-1">
            <select
              value={selectedColorFilter || ''}
              onChange={(e) => setSelectedColorFilter((e.target.value as NoteColor) || null)}
              className="bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 border border-black/10 dark:border-white/10 rounded px-2 py-1 text-[11px] font-medium text-neutral-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100">All Colors</option>
              {NOTE_COLOR_PRESETS.map(c => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100">{c.label}</option>
              ))}
            </select>
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-neutral-500 shrink-0" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 border border-black/10 dark:border-white/10 rounded px-2 py-1 text-[11px] font-medium text-neutral-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="updated" className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100">Recent</option>
              <option value="created" className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100">Created</option>
              <option value="title" className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100">Title</option>
            </select>
          </div>
        </div>
      </div>

      {/* Note List Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.04]">
        {filteredNotes.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400 dark:text-zinc-500">
            {searchQuery || selectedColorFilter
              ? 'No notes match your filters'
              : isTrashView
              ? 'Trash is empty'
              : 'No notes yet. Click + to create a note.'}
          </div>
        ) : (
          filteredNotes.map(note => {
            const isSelected = note.id === selectedNoteId;
            const colorConfig = getNoteColorConfig(note.color);
            const plainText = note.body.replace(/<[^>]*>/g, ' ').trim().slice(0, 90);

            return (
              <div
                key={note.id}
                onClick={() => setSelectedNoteId(note.id)}
                className={`p-3 cursor-pointer transition-colors relative group border-l-4 ${
                  note.color !== 'default' ? colorConfig.borderClass : 'border-transparent'
                } ${
                  isSelected
                    ? 'app-highlight-active font-medium'
                    : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04] text-neutral-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <h3 className={`text-xs font-semibold truncate ${isSelected ? 'text-neutral-950 dark:text-white' : ''}`}>
                    {note.title || 'Untitled Note'}
                  </h3>
                  {note.pinned && !isTrashView && (
                    <Pin className="w-3 h-3 text-neutral-500 fill-neutral-500 shrink-0 mt-0.5" />
                  )}
                </div>

                <p className="text-[11px] text-neutral-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-2">
                  {plainText || 'No additional text'}
                </p>

                <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-zinc-500 font-mono">
                  {/* Linked date badge */}
                  {note.linked_dates && note.linked_dates.length > 0 ? (
                    <span className="flex items-center gap-1 text-neutral-700 dark:text-zinc-300">
                      <Calendar className="w-2.5 h-2.5" />
                      {note.linked_dates[0]}
                      {note.linked_dates.length > 1 && ` (+${note.linked_dates.length - 1})`}
                    </span>
                  ) : (
                    <span>{format(parseISO(note.updated_at), 'MMM d, yyyy')}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
