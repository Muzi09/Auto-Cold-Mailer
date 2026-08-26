import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Loader2, CheckCircle2, AlertOctagon } from 'lucide-react';

export const ProgressBar: React.FC = () => {
  const { liveProgress, applications } = useAppStore();

  const total = liveProgress?.total || applications.length;
  const current = liveProgress?.current || applications.filter(a => a.status === 'Sent' || a.status === 'Failed').length;
  
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const isCompleted = percentage === 100 && total > 0 && liveProgress?.status !== 'Stopped';
  const isStopped = liveProgress?.status === 'Stopped' || liveProgress?.isQueueStopped;

  return (
    <div className={`w-full rounded-2xl p-5 border space-y-3 shadow-2xs transition-all ${
      isStopped 
        ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/60' 
        : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {isStopped ? (
            <AlertOctagon className="w-5 h-5 text-red-500" />
          ) : isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-cyan-500" />
          ) : (
            <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
          )}
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {isStopped 
              ? `Queue Halted: ${liveProgress.stopReason || 'Limit Exceeded'}`
              : isCompleted 
                ? 'Campaign Execution Completed' 
                : 'Sequential Queue Execution Progress'}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {current} / {total} Applications
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
            isStopped 
              ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300' 
              : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
          }`}>
            {percentage}%
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isStopped
              ? 'bg-gradient-to-r from-amber-500 to-red-600'
              : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
