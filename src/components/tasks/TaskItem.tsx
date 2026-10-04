import React, { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import {
  CheckCircle2,
  Circle,
  Calendar,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
  X,
  FileText,
  GripVertical
} from 'lucide-react';
import { Task, SubTask, TaskPriority } from '../../db/types';

interface TaskItemProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleDone: (id: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onUpdate,
  onDelete,
  onToggleDone,
  onMoveUp,
  onMoveDown
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const completedSubtasks = task.subtasks.filter(s => s.done).length;
  const totalSubtasks = task.subtasks.length;
  const progressPercent = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const handlePriorityChange = (priority: TaskPriority) => {
    onUpdate({ ...task, priority });
  };

  const handleDueDateChange = (dueDate: string | null) => {
    onUpdate({ ...task, due_date: dueDate });
    setIsDatePickerOpen(false);
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const newSubtask: SubTask = {
      id: `sub-${crypto.randomUUID()}`,
      title: newSubtaskTitle.trim(),
      done: false
    };
    onUpdate({
      ...task,
      subtasks: [...task.subtasks, newSubtask]
    });
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subtaskId: string) => {
    onUpdate({
      ...task,
      subtasks: task.subtasks.map(s => s.id === subtaskId ? { ...s, done: !s.done } : s)
    });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    onUpdate({
      ...task,
      subtasks: task.subtasks.filter(s => s.id !== subtaskId)
    });
  };

  const isOverdue = task.due_date && !task.done && new Date(task.due_date).getTime() < new Date().setHours(0, 0, 0, 0);

  return (
    <div
      className={`rounded-xl border transition-all ${
        task.done
          ? 'bg-slate-50/60 dark:bg-zinc-900/40 border-slate-200/60 dark:border-zinc-800/60 opacity-75'
          : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-2xs hover:shadow-xs'
      }`}
    >
      {/* Main Task Row */}
      <div className="p-3.5 flex items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Reorder arrows */}
          <div className="flex flex-col gap-0.5 text-slate-300 dark:text-zinc-600">
            {onMoveUp && (
              <button
                type="button"
                onClick={onMoveUp}
                className="hover:text-slate-600 dark:hover:text-zinc-300 p-0.5"
                title="Move Up"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                onClick={onMoveDown}
                className="hover:text-slate-600 dark:hover:text-zinc-300 p-0.5"
                title="Move Down"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Checkbox */}
          <button
            type="button"
            onClick={() => onToggleDone(task.id)}
            className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0"
          >
            {task.done ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>

          {/* Title & snippet */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <div className={`text-sm font-medium truncate ${task.done ? 'line-through text-slate-400' : 'text-slate-900 dark:text-zinc-100'}`}>
              {task.title}
            </div>

            {/* Subtask progress preview */}
            {totalSubtasks > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-20 bg-slate-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {completedSubtasks}/{totalSubtasks}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right action badges */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Priority pill */}
          <select
            value={task.priority}
            onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border-none cursor-pointer focus:ring-1 focus:ring-indigo-500 ${
              task.priority === 'high'
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                : task.priority === 'medium'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          {/* Due date badge & picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-md transition-colors ${
                isOverdue
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-medium'
                  : task.due_date
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>{task.due_date ? format(parseISO(task.due_date), 'MMM d') : 'No Date'}</span>
            </button>

            {isDatePickerOpen && (
              <div className="absolute right-0 top-full mt-1 p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg shadow-xl z-20 flex flex-col gap-1.5 min-w-[170px]">
                <input
                  type="date"
                  value={task.due_date || ''}
                  onChange={(e) => handleDueDateChange(e.target.value || null)}
                  className="px-2 py-1 text-xs border border-slate-200 dark:border-zinc-700 rounded bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100"
                />
                <button
                  type="button"
                  onClick={() => handleDueDateChange(null)}
                  className="text-[10px] text-rose-500 hover:underline text-left px-1"
                >
                  Clear Due Date
                </button>
              </div>
            )}
          </div>

          {/* Expand details button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded"
            title="Expand task details"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Delete button */}
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="p-1 text-slate-300 hover:text-rose-500 rounded"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Details Pane (Subtasks & Notes) */}
      {isExpanded && (
        <div className="px-5 pb-4 pt-2 border-t border-slate-100 dark:border-zinc-800/80 space-y-3">
          {/* Notes description textarea */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Notes / Description
            </label>
            <textarea
              rows={2}
              value={task.notes}
              onChange={(e) => onUpdate({ ...task, notes: e.target.value })}
              placeholder="Add extra context or checklist notes..."
              className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Subtasks Section */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1 block">
              Subtasks ({completedSubtasks}/{totalSubtasks})
            </label>

            {/* Subtask items */}
            <div className="space-y-1 mb-2">
              {task.subtasks.map(sub => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-zinc-800/60 text-xs"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <button
                      type="button"
                      onClick={() => handleToggleSubtask(sub.id)}
                      className="text-slate-400 hover:text-emerald-600"
                    >
                      {sub.done ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Circle className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span className={sub.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-zinc-300'}>
                      {sub.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(sub.id)}
                    className="text-slate-300 hover:text-rose-500 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Subtask Form */}
            <form onSubmit={handleAddSubtask} className="flex items-center gap-1.5">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="+ Add a subtask (press Enter)..."
                className="flex-1 text-xs px-2.5 py-1 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md text-slate-900 dark:text-zinc-100"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs rounded-md hover:bg-slate-300 dark:hover:bg-zinc-600"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
