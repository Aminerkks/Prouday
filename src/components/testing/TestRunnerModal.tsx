import React, { useState, useEffect } from 'react';
import { X, Play, CheckCircle2, XCircle, Clock, FlaskConical, ShieldCheck, RefreshCw } from 'lucide-react';
import { useDaybook } from '../../context/DaybookContext';
import { runAllDaybookUnitTests, TestResult } from '../../tests/daybookUnitTests';

export const TestRunnerModal: React.FC = () => {
  const { isTestRunnerOpen, setIsTestRunnerOpen } = useDaybook();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      const res = await runAllDaybookUnitTests();
      setResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (isTestRunnerOpen && !results && !isRunning) {
      handleRunTests();
    }
  }, [isTestRunnerOpen]);

  if (!isTestRunnerOpen) return null;

  const passedCount = results?.filter(r => r.passed).length || 0;
  const totalCount = results?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 select-none">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Automated Test Runner
              </h2>
              <p className="text-[11px] text-slate-400">
                Data layer, migrations, and date-linking validation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsTestRunnerOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleRunTests}
            disabled={isRunning}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running Tests...' : 'Run All Unit Tests'}</span>
          </button>

          {results && (
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className={passedCount === totalCount ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                {passedCount} / {totalCount} Passed
              </span>
              {passedCount === totalCount && (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              )}
            </div>
          )}
        </div>

        {/* Results List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {!results ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Click &quot;Run All Unit Tests&quot; to execute tests against local SQLite/IndexedDB stores.
            </div>
          ) : (
            results.map((res, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                  res.passed
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  {res.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold">{res.name}</div>
                    <div className="text-[10px] opacity-75 font-mono uppercase mt-0.5">
                      Category: {res.category}
                    </div>
                    {res.message && (
                      <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-mono">
                        {res.message}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>{res.durationMs}ms</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={() => setIsTestRunnerOpen(false)}
            className="px-4 py-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-lg text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
