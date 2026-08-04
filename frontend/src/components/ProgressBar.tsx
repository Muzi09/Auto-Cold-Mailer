import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Loader2, CheckCircle2 } from 'lucide-react';

export const ProgressBar: React.FC = () => {
  const { liveProgress, applications } = useAppStore();

  const total = liveProgress?.total || applications.length;
  const current = liveProgress?.current || applications.filter(a => a.status === 'Sent' || a.status === 'Failed').length;
  
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const isCompleted = percentage === 100 && total > 0;

  return (
    <div className="w-full bg-white dark:bg-slate-900/80 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-cyan-500" />
          ) : (
            <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
          )}
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {isCompleted ? 'Campaign Execution Completed' : 'Sequential Queue Execution Progress'}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {current} / {total} Applications
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
