import React from 'react';
import { AlertOctagon, Settings, ShieldAlert, XCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const QueueStoppedBanner: React.FC = () => {
  const { liveProgress, setIsSettingsOpen } = useAppStore();

  if (!liveProgress || (liveProgress.status !== 'Stopped' && !liveProgress.isQueueStopped)) {
    return null;
  }

  const stopReason = liveProgress.stopReason || 'Limit Error Encountered';
  const errorMessage = liveProgress.error || 'Execution stopped to prevent further failures. Remaining items were not processed.';

  const isLlmError = stopReason.toLowerCase().includes('llm') || errorMessage.toLowerCase().includes('llm') || errorMessage.toLowerCase().includes('token');

  return (
    <div className="w-full bg-gradient-to-r from-red-500/10 via-amber-500/10 to-red-500/10 dark:from-red-950/40 dark:via-amber-950/30 dark:to-red-950/40 border-2 border-red-500/30 dark:border-red-500/40 rounded-3xl p-5 sm:p-6 shadow-lg relative overflow-hidden backdrop-blur-md transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 dark:bg-red-500/30 flex items-center justify-center flex-shrink-0 text-red-600 dark:text-red-400">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white shadow-xs">
                Queue Halted
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <span>{stopReason}</span>
              </h3>
            </div>
            
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed max-w-3xl">
              {errorMessage}
            </p>
            
            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
              * Remaining queue items were skipped and marked as pending/stopped to protect your account.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          {isLlmError && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Update Settings</span>
            </button>
          )}

          <div className="px-3 py-1.5 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs font-mono font-bold">
            {liveProgress.current} / {liveProgress.total} Processed
          </div>
        </div>

      </div>
    </div>
  );
};
