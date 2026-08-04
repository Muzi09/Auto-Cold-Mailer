import React, { useState } from 'react';
import { Play, Trash2, Building2, Briefcase, Mail, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { getStoredSMTPConfig, getStoredResumeConfig } from '../utils/storage';

export const PreviewTable: React.FC = () => {
  const { parsedRows, removeParsedRow, clearParsedRows, setApplications, addActivityLog, smtpConfig, setIsSettingsOpen } = useAppStore();
  const [isApplying, setIsApplying] = useState(false);

  if (parsedRows.length === 0) return null;

  const validRows = parsedRows.filter(r => r.companyName && r.jobTitle && r.contactEmail);
  const validCount = validRows.length;
  const hasErrors = parsedRows.some(r => !r.companyName || !r.jobTitle || !r.contactEmail);

  const handleStartCampaign = async () => {
    // Read SMTP config from store or localStorage
    const currentSmtp = smtpConfig || getStoredSMTPConfig();

    if (!currentSmtp?.smtpHost || !currentSmtp?.smtpUser || !currentSmtp?.smtpPassword) {
      alert('SMTP settings are incomplete. Please configure your SMTP server credentials in Settings.');
      setIsSettingsOpen(true);
      return;
    }

    if (validCount === 0) {
      alert('No valid application rows to submit.');
      return;
    }

    setIsApplying(true);
    try {
      // Get stored Base64 resume if available
      const storedResume = getStoredResumeConfig();

      const response = await api.startApplications(validRows, currentSmtp, storedResume);

      addActivityLog({
        companyName: 'Campaign',
        jobTitle: 'Batch Submission',
        status: 'Sending',
        type: 'info',
        message: `Campaign initiated for ${validCount} job applications.`
      });

      // Refresh applications list
      const apps = await api.getApplications();
      setApplications(apps);

      // Clear preview table on success
      clearParsedRows();
    } catch (err: any) {
      alert(err.message || 'Failed to start campaign application batch.');
      addActivityLog({
        companyName: 'Campaign',
        jobTitle: 'Batch Submission',
        status: 'Failed',
        type: 'error',
        message: `Campaign start error: ${err.message}`
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900/80 rounded-3xl p-6 sm:p-8 space-y-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Applications Preview</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400">
              {parsedRows.length} Rows Parsed
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Review applicant targets before sending AI cold emails.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={clearParsedRows}
            disabled={isApplying}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/40 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
          >
            Clear All
          </button>

          <button
            onClick={handleStartCampaign}
            disabled={isApplying || hasErrors || parsedRows.length === 0}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 ${
              isApplying || hasErrors || parsedRows.length === 0
                ? 'bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-white hover:opacity-90'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isApplying ? 'Starting Queue...' : `Start Applying (${validCount})`}</span>
          </button>
        </div>
      </div>

      {hasErrors && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>Some rows contain validation errors. Please fix or delete invalid rows before starting.</span>
        </div>
      )}

      {/* Rows Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 dark:bg-slate-900/60 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">COMPANY</th>
              <th className="px-4 py-3">JOB TITLE</th>
              <th className="px-4 py-3">CONTACT EMAIL</th>
              <th className="px-4 py-3">SKILLS</th>
              <th className="px-4 py-3">JOB DESCRIPTION</th>
              <th className="px-4 py-3 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
            {parsedRows.map((row) => (
              <tr key={row.id} className="bg-white dark:bg-slate-900/60 hover:bg-slate-50/80 dark:hover:bg-slate-900 transition-colors">
                <td className="px-4 py-3.5 font-mono text-slate-400 text-[11px]">#{row.id}</td>
                <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                  {row.companyName}
                </td>
                <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                    <span>{row.jobTitle}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                    <span>{row.contactEmail}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 max-w-[180px] truncate text-slate-400">
                  {row.skills || 'N/A'}
                </td>
                <td className="px-4 py-3.5 max-w-[220px] truncate text-slate-400">
                  {row.jobDescription || 'N/A'}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <button
                    onClick={() => removeParsedRow(row.id)}
                    className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Remove row"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
