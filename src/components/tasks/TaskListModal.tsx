import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Palette, Trash2 } from 'lucide-react';
import { useDaybook } from '../../context/DaybookContext';
import { TaskList } from '../../db/types';

export const TaskListModal: React.FC = () => {
  const {
    isTaskListModalOpen,
    setIsTaskListModalOpen,
    editingTaskList,
    saveTaskList,
    deleteTaskList,
    taskLists
  } = useDaybook();

  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');

  useEffect(() => {
    if (editingTaskList) {
      setName(editingTaskList.name);
      setColor(editingTaskList.color || '#6366f1');
    } else {
      setName('');
      setColor('#6366f1');
    }
  }, [editingTaskList]);

  if (!isTaskListModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const listToSave: TaskList = {
      id: editingTaskList?.id || `list-${crypto.randomUUID()}`,
      name: name.trim(),
      color,
      order_index: editingTaskList?.order_index ?? taskLists.length,
      created_at: editingTaskList?.created_at || new Date().toISOString()
    };

    await saveTaskList(listToSave);
  };

  const presetColors = [
    '#6366f1', // Indigo
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#f43f5e', // Rose
    '#a855f7', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 select-none">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
          <h3 className="text-base font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-500" />
            {editingTaskList ? 'Edit Task List' : 'Create Task List'}
          </h3>
          <button
            type="button"
            onClick={() => setIsTaskListModalOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
              List Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Work, Groceries, Project Daybook..."
              className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              Theme Color
            </label>
            <div className="flex items-center gap-2">
              {presetColors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    color === c ? 'border-slate-800 dark:border-white scale-110' : 'border-transparent opacity-80'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800">
            {editingTaskList ? (
              <button
                type="button"
                onClick={() => deleteTaskList(editingTaskList.id)}
                className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete List</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTaskListModalOpen(false)}
                className="px-3 py-1.5 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-xs"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
