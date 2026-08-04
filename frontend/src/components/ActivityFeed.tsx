import React from 'react';
import { Activity, Trash2, Sparkles, Send, CheckCircle2, AlertTriangle, Info, TrendingUp } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const ActivityFeed: React.FC = () => {
  const { activityLog, clearActivityLog } = useAppStore();

  const getLogBadge = (type: string) => {
    switch (type) {
      case 'success':
        return { bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400', Icon: CheckCircle2 };
      case 'error':
        return { bg: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400', Icon: AlertTriangle };
      case 'warning':
        return { bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400', Icon: Sparkles };
      default:
        return { bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400', Icon: Info };
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900/80 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col h-[340px] shadow-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Live Activity Feed</h3>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1E293B] text-white dark:bg-slate-800">
            {activityLog.length} events
          </span>
        </div>

        {activityLog.length > 0 && (
          <button
            onClick={clearActivityLog}
            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
            title="Clear activity log"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Scrolling Events list */}
      {activityLog.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
          <TrendingUp className="w-8 h-8 opacity-30 mb-2 text-slate-400" />
          <span className="font-semibold text-slate-400">No activity logged yet.</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {activityLog.map((log) => {
            const { bg, Icon } = getLogBadge(log.type);
            return (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5 hover:bg-slate-100/80 transition-colors"
              >
                <div className={`p-1.5 rounded-lg ${bg} flex-shrink-0 mt-0.5`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">
                      {log.companyName} {log.jobTitle ? `• ${log.jobTitle}` : ''}
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-slate-400 flex-shrink-0">{log.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{log.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
