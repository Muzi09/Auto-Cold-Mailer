import React, { useState, useEffect } from 'react';
import { X, Save, Mail, Paperclip, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { getStoredSMTPConfig, fileToBase64 } from '../utils/storage';
import { SMTPConfig } from '../types';

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setIsSettingsOpen, addActivityLog, setSmtpConfig, resumeConfig, setResumeConfig } = useAppStore();

  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpFromEmail, setSmtpFromEmail] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('Applicant');
  const [useTls, setUseTls] = useState(true);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isSettingsOpen) {
      // Load stored SMTP config from localStorage
      const stored = getStoredSMTPConfig();
      if (stored) {
        setSmtpHost(stored.smtpHost || 'smtp.gmail.com');
        setSmtpPort(stored.smtpPort || 587);
        setSmtpUser(stored.smtpUser || '');
        setSmtpPassword(stored.smtpPassword || '');
        setSmtpFromEmail(stored.smtpFromEmail || '');
        setSmtpFromName(stored.smtpFromName || 'Applicant');
        setUseTls(stored.useTls !== undefined ? stored.useTls : true);
      }
      if (resumeConfig) {
        setUploadStatus(`${resumeConfig.fileName}`);
      }
    }
  }, [isSettingsOpen, resumeConfig]);

  if (!isSettingsOpen) return null;

  const handleSave = async () => {
    if (!smtpHost || !smtpUser || !smtpPassword) {
      alert('SMTP Host, SMTP User, and SMTP Password are required.');
      return;
    }

    setSaving(true);
    try {
      const config: SMTPConfig = {
        smtpHost,
        smtpPort: Number(smtpPort) || 587,
        smtpUser,
        smtpPassword,
        smtpFromEmail: smtpFromEmail || smtpUser,
        smtpFromName: smtpFromName || 'Applicant',
        useTls
      };

      // Save to localStorage & Zustand store
      setSmtpConfig(config);

      // Convert & save resume file to local storage if selected
      if (resumeFile) {
        const base64Data = await fileToBase64(resumeFile);
        setResumeConfig({
          fileName: resumeFile.name,
          fileData: base64Data
        });
        await api.uploadResume(resumeFile);
        setUploadStatus(resumeFile.name);
      }

      addActivityLog({
        companyName: 'Settings',
        jobTitle: 'SMTP & Resume Config',
        status: 'Completed',
        type: 'success',
        message: 'SMTP settings and resume stored in local storage.'
      });

      setIsSettingsOpen(false);
    } catch (e: any) {
      alert(e.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
      
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button - Matches Screenshot 1 */}
        <button
          onClick={() => setIsSettingsOpen(false)}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header - Matches Screenshot 1 */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-cyan-100/70 dark:bg-cyan-950/60 flex items-center justify-center flex-shrink-0 border border-cyan-200/50 dark:border-cyan-900/50">
            <Mail className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">SMTP Credentials & Attachments</h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 font-normal mt-0.5">Configure mail server credentials and upload your resume.</p>
          </div>
        </div>

        {/* Mandatory Section Title */}
        <div className="pt-1">
          <h4 className="text-[11px] font-bold text-cyan-500 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-cyan-500" />
            <span>MANDATORY SMTP MAIL SERVER CREDENTIALS</span>
          </h4>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">
                SMTP Host <span className="text-red-400 font-bold">*</span>
              </label>
              <input
                type="text"
                placeholder="smtp.gmail.com"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:border-cyan-500 font-mono transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">
                Port <span className="text-red-400 font-bold">*</span>
              </label>
              <input
                type="number"
                placeholder="587"
                value={smtpPort}
                onChange={(e) => setSmtpPort(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:border-cyan-500 font-mono transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">
                SMTP User / Email <span className="text-red-400 font-bold">*</span>
              </label>
              <input
                type="email"
                placeholder="your.email@gmail.com"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:border-cyan-500 font-mono transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">
                SMTP App Password <span className="text-red-400 font-bold">*</span>
              </label>
              <input
                type="password"
                placeholder="App Password"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:border-cyan-500 font-mono transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">
                Sender Display Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={smtpFromName}
                onChange={(e) => setSmtpFromName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:border-cyan-500 font-mono transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">
                Sender From Email (Optional)
              </label>
              <input
                type="email"
                placeholder="Defaults to SMTP User"
                value={smtpFromEmail}
                onChange={(e) => setSmtpFromEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:border-cyan-500 font-mono transition-all"
              />
            </div>
          </div>
        </div>

        {/* Resume PDF Upload Section - Matches Screenshot 1 */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-xs font-semibold text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5 text-cyan-500" />
            <span>Upload Resume PDF Attachment</span>
          </label>
          
          <div>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#1E293B] file:text-white hover:file:bg-slate-800 cursor-pointer"
            />
          </div>
          
          {uploadStatus && (
            <p className="text-xs text-emerald-500 dark:text-emerald-400 flex items-center gap-1.5 font-semibold pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span>{uploadStatus}</span>
            </p>
          )}
        </div>

        {/* Action Buttons - Matches Screenshot 1 */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-white shadow-md hover:opacity-90 transition-all active:scale-95 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Settings & Resume'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
