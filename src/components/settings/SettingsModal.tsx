import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Moon,
  Sun,
  Laptop,
  Download,
  Upload,
  HardDrive,
  ShieldCheck,
  Check,
  RefreshCw,
  Calendar,
  Type,
  Clock,
  Sparkles,
  Trash2,
  Terminal,
  Palette
} from 'lucide-react';
import { useDaybook } from '../../context/DaybookContext';
import { db } from '../../db/database';
import { NOTE_COLOR_PRESETS } from '../../utils/colors';
import { NoteColor, DaybookBackupPayload } from '../../db/types';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    settings,
    updateSettings,
    exportBackup,
    importBackup,
    clearAllNotes,
    refreshAll
  } = useDaybook();

  const [dbStats, setDbStats] = useState<{ notesCount: number; eventsCount: number; tasksCount: number } | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [confirmClearNotes, setConfirmClearNotes] = useState(false);

  useEffect(() => {
    if (isSettingsModalOpen) {
      db.getDatabaseStats().then(setDbStats);
    }
  }, [isSettingsModalOpen]);

  if (!isSettingsModalOpen) return null;

  const handleExport = async () => {
    const backup = await exportBackup();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `daybook-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string) as DaybookBackupPayload;
          if (!parsed.notes && !parsed.events && !parsed.tasks) {
            setImportStatus('Invalid backup file format');
            return;
          }
          await importBackup(parsed);
          setImportStatus('Backup restored successfully!');
          const stats = await db.getDatabaseStats();
          setDbStats(stats);
          setTimeout(() => setImportStatus(null), 3000);
        } catch (err) {
          console.error(err);
          setImportStatus('Failed to parse backup JSON file');
        }
      };
    }
  };

  const handleClearAllNotes = async () => {
    await clearAllNotes();
    setConfirmClearNotes(false);
    const stats = await db.getDatabaseStats();
    setDbStats(stats);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 select-none">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/10">
          <h2 className="text-base font-bold text-neutral-900 dark:text-zinc-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-neutral-600 dark:text-zinc-400" />
            Settings
          </h2>
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(false)}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs">
          {/* Section 1: Appearance & Light Mode */}
          <div>
            <h3 className="text-xs font-bold text-neutral-800 dark:text-zinc-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5" />
              Theme & Appearance
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => updateSettings({ theme: 'light' })}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-medium transition-all ${
                  settings.theme === 'light'
                    ? 'border-neutral-800 bg-black/10 text-neutral-950 font-bold shadow-xs'
                    : 'border-black/10 dark:border-white/10 hover:bg-black/5 text-neutral-700 dark:text-zinc-300'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-600" />
                <span>Light Mode</span>
              </button>

              <button
                type="button"
                onClick={() => updateSettings({ theme: 'dark' })}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-medium transition-all ${
                  settings.theme === 'dark'
                    ? 'border-white/30 bg-white/15 text-white font-bold shadow-xs'
                    : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-zinc-300'
                }`}
              >
                <Moon className="w-4 h-4 text-neutral-400" />
                <span>Dark Mode</span>
              </button>

              <button
                type="button"
                onClick={() => updateSettings({ theme: 'system' })}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-medium transition-all ${
                  settings.theme === 'system'
                    ? 'border-neutral-800 dark:border-white/30 bg-black/10 dark:bg-white/15 text-neutral-950 dark:text-white font-bold'
                    : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-zinc-300'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Section 2: Highlight Color */}
          <div>
            <h3 className="text-xs font-bold text-neutral-800 dark:text-zinc-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              App Highlight Color
            </h3>
            <div className="bg-black/[0.03] dark:bg-white/[0.04] p-3.5 rounded-xl border border-black/10 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-neutral-800 dark:text-zinc-200">
                    Highlight Palette
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-zinc-400">
                    Select active theme accents (Gray, Slate, or Zinc)
                  </div>
                </div>
                <select
                  value={settings.highlight_color}
                  onChange={(e) => updateSettings({ highlight_color: e.target.value as any })}
                  className="px-3 py-1.5 text-xs font-semibold border border-black/15 dark:border-white/15 rounded-lg bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100 shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-neutral-400"
                >
                  <option value="gray" className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100 font-medium">Gray (Transparent Black)</option>
                  <option value="slate" className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100 font-medium">Slate</option>
                  <option value="zinc" className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100 font-medium">Zinc</option>
                </select>
              </div>

              {/* Direct clickable option cards for high usability */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => updateSettings({ highlight_color: 'gray' })}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    settings.highlight_color === 'gray'
                      ? 'border-neutral-900 dark:border-white bg-black/10 dark:bg-white/15 shadow-xs font-bold'
                      : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-3 h-3 rounded-full bg-neutral-500 border border-neutral-600" />
                    <span className="text-xs text-neutral-900 dark:text-zinc-100">Gray</span>
                  </div>
                  <div className="text-[10px] text-neutral-500 dark:text-zinc-400 font-normal leading-tight">
                    Transparent black (light) / soft gray (dark)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateSettings({ highlight_color: 'slate' })}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    settings.highlight_color === 'slate'
                      ? 'border-slate-800 dark:border-slate-300 bg-slate-500/15 dark:bg-slate-400/20 shadow-xs font-bold'
                      : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-3 h-3 rounded-full bg-slate-600 border border-slate-700" />
                    <span className="text-xs text-neutral-900 dark:text-zinc-100">Slate</span>
                  </div>
                  <div className="text-[10px] text-neutral-500 dark:text-zinc-400 font-normal leading-tight">
                    Cool slate blue highlights
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateSettings({ highlight_color: 'zinc' })}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    settings.highlight_color === 'zinc'
                      ? 'border-zinc-800 dark:border-zinc-300 bg-zinc-500/15 dark:bg-zinc-400/20 shadow-xs font-bold'
                      : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-3 h-3 rounded-full bg-zinc-700 border border-zinc-800" />
                    <span className="text-xs text-neutral-900 dark:text-zinc-100">Zinc</span>
                  </div>
                  <div className="text-[10px] text-neutral-500 dark:text-zinc-400 font-normal leading-tight">
                    Clean neutral zinc highlights
                  </div>
                </button>
              </div>

              {/* Live preview banner */}
              <div className="p-2 rounded-lg bg-black/[0.04] dark:bg-white/[0.05] border border-black/5 dark:border-white/5 flex items-center justify-between text-[11px]">
                <span className="text-neutral-600 dark:text-zinc-400 font-medium">Active Selection Swatch:</span>
                <span
                  className="px-2.5 py-1 rounded text-xs font-semibold shadow-2xs transition-colors"
                  style={{
                    backgroundColor: 'var(--app-highlight-bg)',
                    color: 'var(--app-highlight-text)',
                    border: '1px solid var(--app-highlight-border)'
                  }}
                >
                  {settings.highlight_color.toUpperCase()} Active Highlight
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Editor Preferences */}
          <div>
            <h3 className="text-xs font-bold text-neutral-800 dark:text-zinc-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5" />
              Editor Preferences
            </h3>
            <div className="bg-black/[0.03] dark:bg-white/[0.04] p-3.5 rounded-xl border border-black/10 dark:border-white/10 space-y-3">
              {/* Font Family */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-neutral-800 dark:text-zinc-200">Font Style</div>
                  <div className="text-[11px] text-neutral-500 dark:text-zinc-400">Editor typography family</div>
                </div>
                <select
                  value={settings.editor_font_family}
                  onChange={(e) => updateSettings({ editor_font_family: e.target.value as any })}
                  className="px-3 py-1.5 text-xs font-medium border border-black/15 dark:border-white/15 rounded-lg bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100 shadow-2xs cursor-pointer focus:outline-none"
                >
                  <option value="sans" className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100">Sans-Serif (System)</option>
                  <option value="serif" className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100">Serif (Editorial)</option>
                  <option value="mono" className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100">Monospace (Code)</option>
                </select>
              </div>

              {/* Font Size */}
              <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                <div>
                  <div className="font-semibold text-neutral-800 dark:text-zinc-200">Font Size</div>
                  <div className="text-[11px] text-neutral-500 dark:text-zinc-400">Reading and writing scale</div>
                </div>
                <select
                  value={settings.editor_font_size}
                  onChange={(e) => updateSettings({ editor_font_size: e.target.value as any })}
                  className="px-3 py-1.5 text-xs font-medium border border-black/15 dark:border-white/15 rounded-lg bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100 shadow-2xs cursor-pointer focus:outline-none"
                >
                  <option value="small" className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100">Compact (14px)</option>
                  <option value="medium" className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100">Standard (16px)</option>
                  <option value="large" className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100">Comfortable (18px)</option>
                </select>
              </div>

              {/* Autosave delay */}
              <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                <div>
                  <div className="font-semibold text-neutral-800 dark:text-zinc-200">Autosave Delay</div>
                  <div className="text-[11px] text-neutral-500 dark:text-zinc-400">Debounce time for offline disk writes</div>
                </div>
                <select
                  value={settings.autosave_delay}
                  onChange={(e) => updateSettings({ autosave_delay: Number(e.target.value) })}
                  className="px-3 py-1.5 text-xs font-medium border border-black/15 dark:border-white/15 rounded-lg bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100 shadow-2xs cursor-pointer focus:outline-none"
                >
                  <option value={200} className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100">Fast (200ms)</option>
                  <option value={400} className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100">Balanced (400ms)</option>
                  <option value={1000} className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100">Relaxed (1000ms)</option>
                </select>
              </div>

              {/* Date detection toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                <div>
                  <div className="font-semibold text-neutral-800 dark:text-zinc-200">Date Detection</div>
                  <div className="text-[11px] text-neutral-500 dark:text-zinc-400">Suggest calendar links for dates typed in notes</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.auto_detect_dates}
                  onChange={(e) => updateSettings({ auto_detect_dates: e.target.checked })}
                  className="w-4 h-4 rounded text-neutral-800 focus:ring-neutral-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Calendar Settings */}
          <div>
            <h3 className="text-xs font-bold text-neutral-800 dark:text-zinc-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Calendar Settings
            </h3>
            <div className="bg-black/[0.03] dark:bg-white/[0.04] p-3.5 rounded-xl border border-black/10 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-neutral-800 dark:text-zinc-200">First Day of Week</div>
                  <div className="text-[11px] text-neutral-500 dark:text-zinc-400">Month and week grid starting day</div>
                </div>
                <select
                  value={settings.week_start}
                  onChange={(e) => updateSettings({ week_start: e.target.value as any })}
                  className="px-3 py-1.5 text-xs font-medium border border-black/15 dark:border-white/15 rounded-lg bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100 shadow-2xs cursor-pointer focus:outline-none"
                >
                  <option value="monday" className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100">Monday</option>
                  <option value="sunday" className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100">Sunday</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                <div>
                  <div className="font-semibold text-neutral-800 dark:text-zinc-200">Default Note Color</div>
                  <div className="text-[11px] text-neutral-500 dark:text-zinc-400">Initial color for new notes</div>
                </div>
                <select
                  value={settings.default_note_color}
                  onChange={(e) => updateSettings({ default_note_color: e.target.value as NoteColor })}
                  className="px-3 py-1.5 text-xs font-medium border border-black/15 dark:border-white/15 rounded-lg bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100 shadow-2xs cursor-pointer focus:outline-none"
                >
                  {NOTE_COLOR_PRESETS.map(c => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-zinc-800 text-neutral-900 dark:text-zinc-100">{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Fedora & Linux Support */}
          <div>
            <h3 className="text-xs font-bold text-neutral-800 dark:text-zinc-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              Fedora Linux Support
            </h3>
            <div className="bg-black/[0.03] dark:bg-white/[0.04] p-3.5 rounded-xl border border-black/10 dark:border-white/10 space-y-2">
              <div className="text-[11px] text-neutral-700 dark:text-zinc-300 leading-relaxed">
                Daybook supports <strong>Fedora Linux (.rpm and .AppImage)</strong>. Package builds with <code>rpm-build</code> and native WebKitGTK.
              </div>
              <div className="font-mono text-[10px] bg-black/5 dark:bg-white/5 p-2 rounded text-neutral-800 dark:text-zinc-300 overflow-x-auto">
                sudo dnf install webkit2gtk4.1 gtk3 libappindicator-gtk3
              </div>
            </div>
          </div>

          {/* Section 6: Offline Storage & Cleanup */}
          <div>
            <h3 className="text-xs font-bold text-neutral-800 dark:text-zinc-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" />
              Offline Storage & Maintenance
            </h3>
            <div className="bg-black/[0.03] dark:bg-white/[0.04] p-3.5 rounded-xl border border-black/10 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between text-neutral-600 dark:text-zinc-300">
                <span className="font-medium">Database Path:</span>
                <span className="font-mono text-[11px] bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded text-neutral-800 dark:text-zinc-200">
                  {settings.data_dir}
                </span>
              </div>

              {dbStats && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/5 dark:border-white/5 text-center">
                  <div className="p-2 rounded bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/5">
                    <div className="text-base font-bold text-neutral-900 dark:text-zinc-100">{dbStats.notesCount}</div>
                    <div className="text-[10px] text-neutral-500">Notes</div>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/5">
                    <div className="text-base font-bold text-neutral-900 dark:text-zinc-100">{dbStats.eventsCount}</div>
                    <div className="text-[10px] text-neutral-500">Events</div>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/5">
                    <div className="text-base font-bold text-neutral-900 dark:text-zinc-100">{dbStats.tasksCount}</div>
                    <div className="text-[10px] text-neutral-500">Tasks</div>
                  </div>
                </div>
              )}

              {/* Clear notes action */}
              <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-neutral-800 dark:text-zinc-200">Clear All Notes</div>
                  <div className="text-[11px] text-neutral-500">Remove all notes to start fresh</div>
                </div>
                {confirmClearNotes ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfirmClearNotes(false)}
                      className="px-2 py-1 text-xs text-neutral-500 hover:text-neutral-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllNotes}
                      className="px-2.5 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded font-medium"
                    >
                      Confirm Delete
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClearNotes(true)}
                    className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded border border-red-200 dark:border-red-900/50"
                  >
                    Clear Notes
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 7: Backup & Restore */}
          <div>
            <h3 className="text-xs font-bold text-neutral-800 dark:text-zinc-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Backup & Restore
            </h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExport}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-neutral-800 hover:bg-neutral-900 dark:bg-zinc-200 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl font-medium shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON Backup</span>
              </button>

              <label className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-zinc-300 rounded-xl font-medium cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                <span>Restore Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <div className="mt-2 p-2 rounded-lg bg-black/5 dark:bg-white/10 text-neutral-900 dark:text-zinc-100 font-medium text-center border border-black/10 dark:border-white/10">
                {importStatus}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/10 dark:border-white/10 flex items-center justify-between text-[11px] text-neutral-500">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-neutral-700 dark:text-zinc-300" />
            100% Offline • Air-Gapped Local Storage
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(false)}
            className="px-4 py-1.5 bg-black/10 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/15 text-neutral-900 dark:text-zinc-100 rounded-lg font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
