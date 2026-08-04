import React, { useState } from 'react';
import { X, Copy, Check, Mail, Building2, Briefcase, Code, Clock, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const ApplicationDetailsModal: React.FC = () => {
  const { selectedApplication, isDetailsOpen, setIsDetailsOpen } = useAppStore();
  const [copied, setCopied] = useState(false);

  if (!isDetailsOpen || !selectedApplication) return null;

  const handleCopyBody = () => {
    if (selectedApplication.emailBody) {
      navigator.clipboard.writeText(selectedApplication.emailBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      
      <div className="relative w-full max-w-2xl glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-950">
        
        {/* Close Button */}
        <button
          onClick={() => setIsDetailsOpen(false)}
          className="absolute top-6 right-6 p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pr-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 p-[1px]">
            <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[15px] flex items-center justify-center">
              <Mail className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{selectedApplication.companyName}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{selectedApplication.jobTitle} • {selectedApplication.contactEmail}</p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400 font-bold">Status:</span>
            <span className="px-2.5 py-0.5 rounded-full font-bold bg-cyan-500/10 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300 border border-cyan-500/30">
              {selectedApplication.status}
            </span>
          </div>
          {selectedApplication.sentAt && (
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-mono font-semibold">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Sent: {new Date(selectedApplication.sentAt).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Target Skills */}
        {selectedApplication.skills && (
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Target Skills</span>
            </label>
            <p className="text-xs text-slate-800 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 font-medium">
              {selectedApplication.skills}
            </p>
          </div>
        )}

        {/* Subject */}
        <div className="space-y-1">
          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Email Subject</label>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 font-mono text-xs text-cyan-700 dark:text-cyan-300 font-bold">
            {selectedApplication.subject || 'No subject generated yet'}
          </div>
        </div>

        {/* Generated Email Body */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Generated Email Content</label>
            <button
              onClick={handleCopyBody}
              disabled={!selectedApplication.emailBody}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 dark:bg-cyan-950/60 hover:bg-cyan-500/20 dark:hover:bg-cyan-900/80 rounded-lg border border-cyan-500/30 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Body'}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-sans text-xs leading-relaxed text-slate-900 dark:text-slate-200 whitespace-pre-wrap font-medium">
            {selectedApplication.emailBody || 'Email body generation in progress...'}
          </div>
        </div>

        {/* Error Log */}
        {selectedApplication.error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 space-y-1 text-xs text-red-800 dark:text-red-300">
            <div className="flex items-center gap-1.5 font-bold text-red-700 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Execution Error</span>
            </div>
            <p className="font-mono text-[11px]">{selectedApplication.error}</p>
          </div>
        )}

      </div>
    </div>
  );
};

