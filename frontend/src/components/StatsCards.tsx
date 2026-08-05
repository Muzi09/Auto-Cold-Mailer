import React from 'react';
import { Mail, Clock, RefreshCw, Check, AlertTriangle, TrendingUp, ShieldCheck, ShieldAlert, ZapOff } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const StatsCards: React.FC = () => {
  const { applications } = useAppStore();

  const total = applications.length;
  const invalidEmails = applications.filter(a => a.status === 'Invalid Email' || a.emailValidation?.isValid === false).length;
  const validatedEmails = applications.filter(a => a.emailValidation?.isValid === true || ['Generating Subject', 'Generating Email', 'Sending', 'Sent'].includes(a.status)).length;
  const processing = applications.filter(a => 
    ['Validating Email', 'Generating Subject', 'Generating Email', 'Sending', 'Retrying'].includes(a.status)
  ).length;
  const sent = applications.filter(a => a.status === 'Sent').length;
  const failed = applications.filter(a => a.status === 'Failed').length;

  const completedTotal = sent + failed;
  const successRate = completedTotal > 0 ? Math.round((sent / completedTotal) * 100) : 0;

  const cards = [
    {
      title: 'Total Applications',
      value: total,
      icon: Mail,
      valColor: 'text-blue-600 dark:text-blue-400',
      bottomBar: 'bg-blue-500'
    },
    {
      title: 'Validated Emails',
      value: validatedEmails,
      icon: ShieldCheck,
      valColor: 'text-emerald-600 dark:text-emerald-400',
      bottomBar: 'bg-emerald-500'
    },
    {
      title: 'Invalid (Skipped)',
      value: invalidEmails,
      icon: ShieldAlert,
      valColor: 'text-amber-600 dark:text-amber-400',
      bottomBar: 'bg-amber-500',
      subtitle: `${invalidEmails} LLM/SMTP saved`
    },
    {
      title: 'Successfully Sent',
      value: sent,
      icon: Check,
      valColor: 'text-emerald-500 dark:text-emerald-400',
      bottomBar: 'bg-emerald-500'
    },
    {
      title: 'Failed Attempts',
      value: failed,
      icon: AlertTriangle,
      valColor: 'text-rose-500 dark:text-rose-400',
      bottomBar: 'bg-rose-500'
    },
    {
      title: 'Success Rate',
      value: `${successRate}%`,
      icon: TrendingUp,
      valColor: 'text-cyan-600 dark:text-cyan-400',
      bottomBar: 'bg-cyan-500'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 w-full">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900/80 rounded-2xl p-4 flex flex-col justify-between border border-slate-200/80 dark:border-slate-800 relative overflow-hidden shadow-2xs hover:shadow-xs transition-all h-28"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-tight leading-tight max-w-[90px]">
                {card.title}
              </span>
              <div className="p-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-400 dark:text-slate-400">
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-2">
              <span className={`text-3xl font-extrabold tracking-tight ${card.valColor}`}>
                {card.value}
              </span>
            </div>

            <div className={`absolute bottom-0 left-0 right-0 h-[3px] ${card.bottomBar} opacity-90`} />
          </div>
        );
      })}
    </div>
  );
};
