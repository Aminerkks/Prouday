import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  CheckCircle2,
  Calendar,
  Layers,
  AlertCircle,
  Clock,
  CheckCheck,
  FolderPlus,
  Edit2
} from 'lucide-react';
import { useDaybook } from '../../context/DaybookContext';
import { TaskItem } from './TaskItem';
import { TaskPriority } from '../../db/types';

export const TasksView: React.FC = () => {
  const {
    tasks,
    taskLists,
    selectedTaskListId,
    setSelectedTaskListId,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskDone,
    reorderTasks,
    setIsTaskListModalOpen,
    setEditingTaskList
  } = useDaybook();

  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>('all');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDueDate, setQuickDueDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  // Filter tasks based on selected list & view tab
  const filteredTasks = useMemo(() => {
    let list = tasks;

    // Filter by task list if selected
    if (selectedTaskListId) {
      list = list.filter(t => t.list_id === selectedTaskListId);
    }

    // Filter by tab
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayMidnight = new Date().setHours(0, 0, 0, 0);

    switch (activeTab) {
      case 'today':
        return list.filter(t => !t.done && t.due_date === todayStr);
      case 'upcoming':
        return list.filter(t => !t.done && t.due_date && new Date(t.due_date).getTime() > todayMidnight);
      case 'overdue':
        return list.filter(t => !t.done && t.due_date && new Date(t.due_date).getTime() < todayMidnight);
      case 'completed':
        return list.filter(t => t.done);
      case 'all':
      default:
        return [...list].sort((a, b) => {
          if (a.done !== b.done) return a.done ? 1 : -1;
          return a.order_index - b.order_index;
        });
    }
  }, [tasks, selectedTaskListId, activeTab]);

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const targetDate = quickDueDate || format(new Date(), 'yyyy-MM-dd');

    await createTask(quickTitle.trim(), selectedTaskListId || undefined, targetDate);
    setQuickTitle('');
    setQuickDueDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newTasks = [...filteredTasks];
    const temp = newTasks[index];
    newTasks[index] = newTasks[index - 1];
    newTasks[index - 1] = temp;
    reorderTasks(newTasks);
  };

  const handleMoveDown = (index: number) => {
    if (index >= filteredTasks.length - 1) return;
    const newTasks = [...filteredTasks];
    const temp = newTasks[index];
    newTasks[index] = newTasks[index + 1];
    newTasks[index + 1] = temp;
    reorderTasks(newTasks);
  };

  const currentList = taskLists.find(l => l.id === selectedTaskListId);

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-neutral-100 dark:bg-zinc-950">
      {/* Left sub-sidebar for Task Lists */}
      <div className="w-60 border-r border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 flex flex-col select-none shrink-0">
        <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-zinc-400">
            Task Lists
          </h2>
          <button
            type="button"
            onClick={() => {
              setEditingTaskList(null);
              setIsTaskListModalOpen(true);
            }}
            className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            title="Create Task List"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>

        <div className="p-2 space-y-1 flex-1 overflow-y-auto">
          {/* All lists option */}
          <button
            type="button"
            onClick={() => setSelectedTaskListId(null)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              selectedTaskListId === null
                ? 'bg-black/10 dark:bg-white/15 text-neutral-950 dark:text-white font-semibold'
                : 'text-neutral-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-neutral-500" />
              <span>All Tasks</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 font-mono text-neutral-600 dark:text-zinc-300">
              {tasks.filter(t => !t.done).length}
            </span>
          </button>

          {/* Individual lists */}
          {taskLists.map(list => {
            const count = tasks.filter(t => t.list_id === list.id && !t.done).length;
            const isSelected = selectedTaskListId === list.id;

            return (
              <div
                key={list.id}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-black/10 dark:bg-white/15 text-neutral-950 dark:text-white font-semibold'
                    : 'text-neutral-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                onClick={() => setSelectedTaskListId(list.id)}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: list.color }}
                  />
                  <span className="truncate">{list.name}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 font-mono text-neutral-600 dark:text-zinc-300">
                    {count}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTaskList(list);
                      setIsTaskListModalOpen(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-zinc-200"
                    title="Edit list"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Tasks List Pane */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header & Tabs */}
        <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 select-none">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold text-neutral-900 dark:text-zinc-100 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-neutral-700 dark:text-zinc-300" />
                {currentList ? currentList.name : 'All Tasks'}
              </h1>
              <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-0.5">
                {filteredTasks.length} task(s)
              </p>
            </div>
          </div>

          {/* View Filter Tabs: All, Today, Upcoming, Overdue, Completed */}
          <div className="flex items-center gap-2 border-b border-black/10 dark:border-white/10 pb-2">
            {[
              { id: 'all', label: 'All', icon: Layers },
              { id: 'today', label: 'Today', icon: Clock },
              { id: 'upcoming', label: 'Upcoming', icon: Calendar },
              { id: 'overdue', label: 'Overdue', icon: AlertCircle },
              { id: 'completed', label: 'Completed', icon: CheckCheck },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-neutral-800 text-white dark:bg-zinc-200 dark:text-zinc-900 shadow-2xs'
                      : 'text-neutral-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Task Creation & List Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl mx-auto w-full">
          {/* Quick Task Creation Card */}
          <form
            onSubmit={handleQuickCreate}
            className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-900 rounded-xl border border-black/10 dark:border-white/10 shadow-xs"
          >
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="+ Add a new task (press Enter to save)..."
              className="flex-1 px-3 py-2 text-sm bg-transparent border-none outline-none text-neutral-900 dark:text-zinc-100 placeholder-neutral-400"
            />

            <input
              type="date"
              value={quickDueDate}
              onChange={(e) => setQuickDueDate(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-md border border-black/15 dark:border-white/15 bg-black/[0.03] dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-neutral-400 font-medium"
              title="Due date (automatically set to today)"
            />

            <button
              type="submit"
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-900 dark:bg-zinc-200 dark:hover:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-semibold shadow-2xs"
            >
              Add Task
            </button>
          </form>

          {/* Task Items List */}
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 dark:text-zinc-500 border border-dashed border-black/10 dark:border-white/10 rounded-xl">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-neutral-300 dark:text-zinc-700" />
              <p className="text-sm font-medium">No tasks found</p>
              <p className="text-xs mt-1">Add tasks above to stay organized.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onUpdate={updateTask}
                  onDelete={deleteTask}
                  onToggleDone={toggleTaskDone}
                  onMoveUp={index > 0 ? () => handleMoveUp(index) : undefined}
                  onMoveDown={index < filteredTasks.length - 1 ? () => handleMoveDown(index) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
