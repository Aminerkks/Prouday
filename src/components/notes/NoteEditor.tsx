import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';

import { format, parseISO } from 'date-fns';
import {
  Pin,
  Trash2,
  RotateCcw,
  Calendar,
  Plus,
  X,
  Sparkles,
  Download,
  Printer,
  Clock,
  CalendarDays
} from 'lucide-react';
import { useDaybook } from '../../context/DaybookContext';
import { TipTapToolbar } from './TipTapToolbar';
import { NOTE_COLOR_PRESETS, getNoteColorConfig } from '../../utils/colors';
import { extractDatesFromText } from '../../utils/dateDetection';
import { NoteColor } from '../../db/types';

export const NoteEditor: React.FC = () => {
  const {
    selectedNote,
    updateNote,
    trashNote,
    restoreNote,
    deleteNotePermanently,
    togglePinNote,
    events,
    activeView,
    settings
  } = useDaybook();

  const [title, setTitle] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isEventPickerOpen, setIsEventPickerOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [newDateValue, setNewDateValue] = useState(format(new Date(), 'yyyy-MM-dd'));

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-neutral-800 dark:text-zinc-200 underline cursor-pointer',
        },
      }),
    ],
    content: selectedNote ? selectedNote.body : '',
    onUpdate: ({ editor }) => {
      triggerAutosave(title, editor.getHTML());
    },
  });

  // Sync editor content when selected note changes
  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
      if (editor && editor.getHTML() !== selectedNote.body) {
        editor.commands.setContent(selectedNote.body || '<p></p>');
      }
    }
  }, [selectedNote?.id, editor]);

  // Autosave function with configurable debounce
  const triggerAutosave = useCallback((currentTitle: string, currentBody: string) => {
    if (!selectedNote) return;
    setSaveStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const delay = settings.autosave_delay || 400;
    saveTimeoutRef.current = setTimeout(async () => {
      await updateNote({
        ...selectedNote,
        title: currentTitle || 'Untitled Note',
        body: currentBody,
      });
      setSaveStatus('saved');
    }, delay);
  }, [selectedNote, updateNote, settings.autosave_delay]);

  // Handle title input change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    triggerAutosave(newTitle, editor ? editor.getHTML() : selectedNote?.body || '');
  };

  // Color change
  const handleColorChange = async (color: NoteColor) => {
    if (!selectedNote) return;
    await updateNote({
      ...selectedNote,
      color,
    });
  };

  // Date linking
  const handleAddDate = (date: string) => {
    if (!selectedNote || !date) return;
    const currentDates = selectedNote.linked_dates || [];
    if (!currentDates.includes(date)) {
      updateNote({
        ...selectedNote,
        linked_dates: [...currentDates, date],
      });
    }
    setIsDatePickerOpen(false);
  };

  const handleRemoveDate = (date: string) => {
    if (!selectedNote) return;
    const currentDates = selectedNote.linked_dates || [];
    updateNote({
      ...selectedNote,
      linked_dates: currentDates.filter(d => d !== date),
    });
  };

  // Event linking
  const handleToggleEventLink = (eventId: string) => {
    if (!selectedNote) return;
    const currentEvents = selectedNote.linked_event_ids || [];
    const isLinked = currentEvents.includes(eventId);
    const updated = isLinked
      ? currentEvents.filter(id => id !== eventId)
      : [...currentEvents, eventId];

    updateNote({
      ...selectedNote,
      linked_event_ids: updated,
    });
  };

  // Date suggestions from note body
  const detectedDates = useMemo(() => {
    if (!selectedNote || !selectedNote.body || !settings.auto_detect_dates) return [];
    const dates = extractDatesFromText(selectedNote.body);
    const currentLinked = new Set(selectedNote.linked_dates || []);
    return dates.filter(d => !currentLinked.has(d));
  }, [selectedNote?.body, selectedNote?.linked_dates, settings.auto_detect_dates]);

  // Export as Markdown
  const handleExportMarkdown = () => {
    if (!selectedNote) return;
    const html = editor ? editor.getHTML() : selectedNote.body;
    let md = `# ${selectedNote.title}\n\n`;
    md += `*Linked Dates: ${selectedNote.linked_dates?.join(', ') || 'None'}*\n\n`;
    
    const cleanText = html
      .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<code>(.*?)<\/code>/gi, '`$1`')
      .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n')
      .replace(/<blockquote>(.*?)<\/blockquote>/gi, '> $1\n\n')
      .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '');

    md += cleanText.trim();

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedNote.title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'note'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!selectedNote) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400 dark:text-zinc-500">
        <div className="w-16 h-16 mb-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
          <CalendarDays className="w-8 h-8 text-neutral-400 dark:text-zinc-600" />
        </div>
        <h3 className="text-base font-semibold text-neutral-700 dark:text-zinc-300">No Note Selected</h3>
        <p className="text-xs max-w-sm mt-1 text-neutral-500 dark:text-zinc-400">
          Select a note from the list or click + to create a new blank note.
        </p>
      </div>
    );
  }

  const colorConfig = getNoteColorConfig(selectedNote.color);
  const isReadOnlyTrash = activeView === 'trash';

  // Dynamic font styles from settings
  const fontClass =
    settings.editor_font_family === 'serif'
      ? 'font-serif'
      : settings.editor_font_family === 'mono'
      ? 'font-mono'
      : 'font-sans';

  const fontSizeClass =
    settings.editor_font_size === 'small'
      ? 'text-sm'
      : settings.editor_font_size === 'large'
      ? 'text-lg'
      : 'text-base';

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden transition-colors duration-150 ${colorConfig.bgClass}`}>
      {/* Top Note Action Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xs select-none">
        <div className="flex items-center gap-3">
          {/* Pinned toggle */}
          <button
            type="button"
            onClick={() => togglePinNote(selectedNote.id)}
            disabled={isReadOnlyTrash}
            className={`p-1.5 rounded-md transition-colors ${
              selectedNote.pinned
                ? 'bg-black/10 text-neutral-900 dark:bg-white/15 dark:text-white font-medium'
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-zinc-200'
            }`}
            title={selectedNote.pinned ? 'Unpin note' : 'Pin note to top'}
          >
            <Pin className={`w-4 h-4 ${selectedNote.pinned ? 'fill-neutral-700 dark:fill-zinc-300' : ''}`} />
          </button>

          {/* Color Presets */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-black/10 dark:border-white/10">
            {NOTE_COLOR_PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleColorChange(preset.id)}
                disabled={isReadOnlyTrash}
                className={`w-3.5 h-3.5 rounded-full border transition-transform hover:scale-125 ${
                  selectedNote.color === preset.id
                    ? 'ring-2 ring-neutral-700 dark:ring-zinc-300 ring-offset-1 scale-110'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: preset.hex }}
                title={preset.label}
              />
            ))}
          </div>

          {/* Save indicator */}
          <span className="text-[11px] text-neutral-400 dark:text-zinc-500 flex items-center gap-1 pl-2 font-mono">
            <Clock className="w-3 h-3" />
            {saveStatus === 'saving' ? 'Saving...' : `Saved ${format(parseISO(selectedNote.updated_at), 'HH:mm')}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Export markdown & print */}
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-zinc-300 text-xs flex items-center gap-1.5 font-medium"
            title="Export as Markdown (.md)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-zinc-300 text-xs flex items-center gap-1.5 font-medium"
            title="Print or Export as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>

          {/* Trash / Restore actions */}
          {isReadOnlyTrash ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => restoreNote(selectedNote.id)}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-900 text-white dark:bg-zinc-200 dark:text-zinc-900 rounded text-xs font-medium flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restore Note
              </button>
              <button
                type="button"
                onClick={() => deleteNotePermanently(selectedNote.id)}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Forever
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => trashNote(selectedNote.id)}
              className="p-1.5 rounded hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 text-neutral-400 transition-colors"
              title="Move note to trash"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Linked Dates Banner */}
      <div className="px-6 py-2 bg-black/[0.02] dark:bg-white/[0.03] border-b border-black/10 dark:border-white/10 flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-zinc-400">
          <Calendar className="w-3.5 h-3.5 text-neutral-700 dark:text-zinc-300" />
          <span className="font-semibold text-neutral-800 dark:text-zinc-200">Date:</span>
        </div>

        {selectedNote.linked_dates && selectedNote.linked_dates.length > 0 ? (
          selectedNote.linked_dates.map(dateStr => (
            <span
              key={dateStr}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-neutral-800 dark:text-zinc-200 border border-black/10 dark:border-white/10 font-mono text-[11px]"
            >
              {dateStr}
              {!isReadOnlyTrash && (
                <button
                  type="button"
                  onClick={() => handleRemoveDate(dateStr)}
                  className="hover:text-red-500 rounded p-0.5"
                  title="Unlink from this date"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))
        ) : (
          <span className="text-neutral-400 italic">No calendar date linked</span>
        )}

        {/* Add date button & popover */}
        {!isReadOnlyTrash && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-neutral-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 rounded border border-dashed border-black/20 dark:border-white/20"
            >
              <Plus className="w-3 h-3" />
              <span>Link Date</span>
            </button>

            {isDatePickerOpen && (
              <div className="absolute top-full left-0 mt-1.5 p-3 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg shadow-xl z-30 flex flex-col gap-2 min-w-[200px]">
                <label className="text-xs font-medium text-neutral-800 dark:text-zinc-200">Select Date:</label>
                <input
                  type="date"
                  value={newDateValue}
                  onChange={(e) => setNewDateValue(e.target.value)}
                  className="px-2 py-1 text-xs border border-black/10 dark:border-white/10 rounded bg-black/[0.02] dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100"
                />
                <div className="flex justify-end gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setIsDatePickerOpen(false)}
                    className="px-2 py-0.5 text-xs text-neutral-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddDate(newDateValue)}
                    className="px-2.5 py-0.5 text-xs bg-neutral-800 dark:bg-zinc-200 text-white dark:text-zinc-900 rounded font-medium"
                  >
                    Link
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Event Linking */}
        <div className="ml-auto flex items-center gap-1.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsEventPickerOpen(!isEventPickerOpen)}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-neutral-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 rounded border border-black/20 dark:border-white/20"
            >
              <CalendarDays className="w-3 h-3" />
              <span>
                {selectedNote.linked_event_ids?.length
                  ? `${selectedNote.linked_event_ids.length} Event(s)`
                  : 'Link Event'}
              </span>
            </button>

            {isEventPickerOpen && (
              <div className="absolute right-0 top-full mt-1.5 p-2 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg shadow-xl z-30 min-w-[240px] max-h-56 overflow-y-auto">
                <div className="text-xs font-semibold px-2 py-1 text-neutral-500 border-b border-black/5 dark:border-white/5 mb-1">
                  Link to Calendar Event
                </div>
                {events.length === 0 ? (
                  <div className="text-xs text-neutral-400 p-2">No events created yet.</div>
                ) : (
                  events.map(ev => {
                    const isLinked = selectedNote.linked_event_ids?.includes(ev.id);
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => handleToggleEventLink(ev.id)}
                        className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between ${
                          isLinked
                            ? 'bg-black/10 text-neutral-900 dark:bg-white/15 dark:text-white font-medium'
                            : 'hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-zinc-300'
                        }`}
                      >
                        <span className="truncate">{ev.title}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {format(parseISO(ev.start_time), 'MMM d')}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Date Detection Suggestions Chip Bar */}
      {detectedDates.length > 0 && !isReadOnlyTrash && (
        <div className="px-6 py-1.5 bg-black/[0.04] dark:bg-white/[0.05] border-b border-black/10 dark:border-white/10 flex items-center gap-2 text-xs text-neutral-700 dark:text-zinc-300">
          <Sparkles className="w-3.5 h-3.5 text-neutral-600 dark:text-zinc-400" />
          <span className="font-medium">Detected date in note:</span>
          {detectedDates.map(dateStr => (
            <button
              key={dateStr}
              type="button"
              onClick={() => handleAddDate(dateStr)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/10 hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15 text-neutral-900 dark:text-zinc-100 font-mono text-[11px] transition-colors"
              title="Click to link this date to the calendar"
            >
              + Link {dateStr}
            </button>
          ))}
        </div>
      )}

      {/* TipTap Formatting Toolbar */}
      {!isReadOnlyTrash && <TipTapToolbar editor={editor} />}

      {/* Main Content Area */}
      <div className={`flex-1 overflow-y-auto px-8 py-6 ${fontClass}`}>
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Note Title Input */}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            disabled={isReadOnlyTrash}
            placeholder="Note Title..."
            className="w-full text-3xl font-bold bg-transparent border-none outline-none text-neutral-900 dark:text-zinc-100 placeholder-neutral-400 dark:placeholder-zinc-600 focus:ring-0 px-0"
          />

          {/* ProseMirror TipTap Editor Body */}
          <div className={`pt-2 ${fontSizeClass}`}>
            <EditorContent editor={editor} className="prose dark:prose-invert max-w-none text-neutral-800 dark:text-zinc-200" />
          </div>
        </div>
      </div>
    </div>
  );
};
