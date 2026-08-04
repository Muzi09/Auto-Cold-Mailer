import React from 'react';
import { Mail, Download, Settings, Moon, Sun, Check, CheckCircle2, KeyRound } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { downloadSampleExcel } from '../utils/sampleExcel';

export const Navbar: React.FC = () => {
  const { wsConnected, theme, toggleTheme, setIsSettingsOpen, smtpConfig } = useAppStore();

  const isSmtpReady = !!(smtpConfig?.smtpHost && smtpConfig?.smtpUser && smtpConfig?.smtpPassword);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-3.5 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-950 shadow-md">
            <Mail className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Auto Cold Mailer
            </h1>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 font-semibold tracking-tight">
              AI-Powered Job Application Engine
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          
          {/* WebSocket Status Indicator */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            wsConnected 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{wsConnected ? 'WebSocket Live' : 'Connecting...'}</span>
          </div>

          {/* SMTP Config Status Badge */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              isSmtpReady
                ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 hover:bg-cyan-800'
                : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 hover:bg-red-200 animate-pulse'
            }`}
          >
            {isSmtpReady ? (
              <>
                <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>SMTP Ready</span>
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                <span>Configure SMTP</span>
              </>
            )}
          </button>

          {/* Download Sample Excel */}
          <button
            onClick={downloadSampleExcel}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/60 transition-all shadow-2xs active:scale-95"
            title="Download sample Excel template"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Sample Excel</span>
          </button>

          {/* Settings Modal Toggle */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/60 transition-all active:scale-95"
            title="SMTP Credentials & Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/60 transition-all active:scale-95"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>

      </div>
    </header>
  );
};
