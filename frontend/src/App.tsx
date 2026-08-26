import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/Navbar';
import { ExcelUpload } from './components/ExcelUpload';
import { PreviewTable } from './components/PreviewTable';
import { StatsCards } from './components/StatsCards';
import { ProgressBar } from './components/ProgressBar';
import { CurrentJobCard } from './components/CurrentJobCard';
import { ActivityFeed } from './components/ActivityFeed';
import { ApplicationTable } from './components/ApplicationTable';
import { ApplicationDetailsModal } from './components/ApplicationDetailsModal';
import { SettingsModal } from './components/SettingsModal';
import { QueueStoppedBanner } from './components/QueueStoppedBanner';
import { useAppStore } from './store/useAppStore';
import { wsClient } from './services/ws';
import { api } from './services/api';

const queryClient = new QueryClient();

const MainDashboard: React.FC = () => {
  const {
    parsedRows,
    setApplications,
    setLiveProgress,
    setWsConnected,
    updateApplicationState,
    addActivityLog,
    setIsApplying,
    theme,
    setTheme
  } = useAppStore();

  useEffect(() => {
    // Apply persisted theme to document root
    setTheme(theme);

    // Initial fetch of applications from database
    api.getApplications().then((apps) => {
      setApplications(apps);
    }).catch(console.error);

    // Subscribe to WebSocket live updates stream
    wsClient.connect(
      (msg) => {
        setLiveProgress(msg);

        if (msg.status === 'Stopped' || msg.isQueueStopped) {
          setIsApplying(false);
          // Refresh applications to reflect skipped remaining items
          api.getApplications().then(setApplications).catch(console.error);
        }

        if (msg.applicationId && msg.status) {
          updateApplicationState(msg.applicationId, msg.status, {
            subject: msg.subject,
            emailBody: msg.emailBody,
            error: msg.error,
            sentAt: msg.sentAt
          });
        }

        // Add to live activity feed
        if (msg.status && msg.companyName) {
          const typeMap: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
            'Validating Email': 'info',
            'Generating Subject': 'info',
            'Generating Email': 'info',
            'Sending': 'warning',
            'Sending Email': 'warning',
            'Sent': 'success',
            'Failed': 'error',
            'Invalid Email': 'error',
            'Stopped': 'error',
            'Completed': 'success'
          };

          let logMsg = `${msg.status}: ${msg.companyName}`;
          if (msg.status === 'Stopped' || msg.isQueueStopped) {
            logMsg = `Queue Stopped (${msg.stopReason || 'Limit Exceeded'}): ${msg.error || 'Remaining items were skipped.'}`;
          } else if (msg.status === 'Invalid Email' && (msg.reason || msg.error)) {
            logMsg = `Invalid Email: ${msg.companyName} - ${msg.reason || msg.error}`;
          } else if (msg.status === 'Validating Email' && msg.contactEmail) {
            logMsg = `Validating Email: ${msg.companyName} (${msg.contactEmail})`;
          }

          addActivityLog({
            companyName: msg.companyName,
            jobTitle: msg.jobTitle,
            status: msg.status,
            type: typeMap[msg.status] || 'info',
            message: logMsg,
            reason: msg.reason || msg.error
          });
        }
      },
      (connected) => {
        setWsConnected(connected);
      }
    );

    return () => {
      wsClient.disconnect();
    };
  }, []);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200'
        : 'bg-slate-50 text-slate-900 selection:bg-cyan-500/20 selection:text-cyan-800'
    }`}>

      
      {/* Header Bar */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Queue Stopped Alert Banner */}
        <QueueStoppedBanner />

        {/* Top Metric Cards */}
        <StatsCards />

        {/* Campaign Setup & Upload Section */}
        {parsedRows.length > 0 ? (
          <PreviewTable />
        ) : (
          <ExcelUpload />
        )}

        {/* Real-time Progress & Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <div className="lg:col-span-2 space-y-6">
            <ProgressBar />
            <CurrentJobCard />
          </div>

          <div className="lg:col-span-1">
            <ActivityFeed />
          </div>

        </div>

        {/* Application Management Database Table */}
        <ApplicationTable />

      </main>

      {/* Modals */}
      <ApplicationDetailsModal />
      <SettingsModal />

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/60 dark:border-slate-800/60 py-6 text-center text-[11px] text-slate-400 dark:text-slate-500 font-medium tracking-tight">
        Auto Cold Mailer • Designed with Apple Human Interface Principles • Async FastAPI & React 19 Stack
      </footer>

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MainDashboard />
    </QueryClientProvider>
  );
};

export default App;
