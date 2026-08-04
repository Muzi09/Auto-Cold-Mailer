import React from 'react';
import { Building2, Briefcase, Code, Loader2, Sparkles, Send, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const CurrentJobCard: React.FC = () => {
  const { liveProgress, applications } = useAppStore();

  if (!liveProgress || liveProgress.status === 'Completed') {
    return (
      <div className="w-full bg-white dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium shadow-2xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-500 flex-shrink-0" />
          <span>Queue is idle. Upload applications and click "Start Applying" to initiate process.</span>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Generating Subject':
      case 'Generating Email':
        return {
          label: status,
          bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
          icon: Sparkles
        };
      case 'Sending':
      case 'Retrying':
        return {
          label: status,
          bg: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300',
          icon: Send
        };
      case 'Sent':
        return {
          label: 'Sent',
          bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
          icon: CheckCircle2
        };
      case 'Failed':
        return {
          label: 'Failed',
          bg: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
          icon: AlertTriangle
        };
      default:
        return {
          label: status,
          bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
          icon: Loader2
        };
    }
  };

  const badge = getStatusBadge(liveProgress.status);
  const StatusIcon = badge.icon;

  const activeApp = applications.find(a => a.applicationId === liveProgress.applicationId);

  return (
    <div className="w-full bg-white dark:bg-slate-900/80 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{liveProgress.companyName}</h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-semibold">{liveProgress.jobTitle}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.bg}`}>
            <StatusIcon className="w-3.5 h-3.5 animate-spin" />
            <span>{badge.label}</span>
          </div>
          <span className="text-xs font-mono text-slate-400">{liveProgress.timestamp || new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="mt-3.5 space-y-2.5">
        {activeApp?.skills && (
          <div className="flex items-center gap-2 text-xs">
            <Code className="w-4 h-4 text-cyan-500 flex-shrink-0" />
            <span className="font-bold text-slate-500 dark:text-slate-400">Target Skills:</span>
            <span className="text-slate-800 dark:text-slate-200 font-semibold">{activeApp.skills}</span>
          </div>
        )}

        {liveProgress.subject && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-bold text-slate-500 dark:text-slate-400 block mb-1">Generated Subject:</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-mono font-bold">{liveProgress.subject}</span>
          </div>
        )}
      </div>

    </div>
  );
};
