import { create } from 'zustand';
import { Application, UploadRow, LiveProgressMessage, ActivityLog, ApplicationStatus, SMTPConfig, ResumeData, LLMConfig } from '../types';
import { getStoredSMTPConfig, saveStoredSMTPConfig, getStoredResumeConfig, saveStoredResumeConfig, removeStoredResumeConfig, getStoredTheme, saveStoredTheme, getStoredLLMConfig, saveStoredLLMConfig } from '../utils/storage';

interface AppState {
  parsedRows: UploadRow[];
  applications: Application[];
  liveProgress: LiveProgressMessage | null;
  activityLog: ActivityLog[];
  isApplying: boolean;
  wsConnected: boolean;
  theme: 'dark' | 'light';
  selectedApplication: Application | null;
  isSettingsOpen: boolean;
  isDetailsOpen: boolean;
  llmConfig: LLMConfig | null;
  smtpConfig: SMTPConfig | null;
  resumeConfig: ResumeData | null;

  // Actions
  setParsedRows: (rows: UploadRow[]) => void;
  removeParsedRow: (id: number) => void;
  clearParsedRows: () => void;
  
  setApplications: (apps: Application[]) => void;
  updateApplicationState: (appId: number, status: ApplicationStatus, extra?: Partial<Application>) => void;
  
  setLiveProgress: (msg: LiveProgressMessage | null) => void;
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'> & { timestamp?: string }) => void;
  clearActivityLog: () => void;
  
  setIsApplying: (isApplying: boolean) => void;
  setWsConnected: (connected: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  
  setSelectedApplication: (app: Application | null) => void;
  setIsSettingsOpen: (isOpen: boolean) => void;
  setIsDetailsOpen: (isOpen: boolean) => void;
  setLlmConfig: (config: LLMConfig | null) => void;
  setSmtpConfig: (config: SMTPConfig | null) => void;
  setResumeConfig: (config: ResumeData | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  parsedRows: [],
  applications: [],
  liveProgress: null,
  activityLog: [],
  isApplying: false,
  wsConnected: false,
  theme: getStoredTheme(),
  selectedApplication: null,
  isSettingsOpen: false,
  isDetailsOpen: false,
  llmConfig: getStoredLLMConfig(),
  smtpConfig: getStoredSMTPConfig(),
  resumeConfig: getStoredResumeConfig(),

  setParsedRows: (rows) => set({ parsedRows: rows }),
  
  removeParsedRow: (id) => set((state) => ({
    parsedRows: state.parsedRows.filter((r) => r.id !== id)
  })),

  clearParsedRows: () => set({ parsedRows: [] }),

  setApplications: (apps) => set({ applications: apps }),

  updateApplicationState: (appId, status, extra = {}) => set((state) => {
    const exists = state.applications.some((a) => a.applicationId === appId);
    if (exists) {
      return {
        applications: state.applications.map((a) =>
          a.applicationId === appId
            ? { ...a, status, ...extra, updatedAt: new Date().toISOString() }
            : a
        )
      };
    }
    return state;
  }),

  setLiveProgress: (msg) => set({ liveProgress: msg }),

  addActivityLog: (log) => set((state) => {
    const newLog: ActivityLog = {
      ...log,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: log.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    return { activityLog: [newLog, ...state.activityLog].slice(0, 100) };
  }),

  clearActivityLog: () => set({ activityLog: [] }),

  setIsApplying: (isApplying) => set({ isApplying }),
  setWsConnected: (wsConnected) => set({ wsConnected }),
  
  setTheme: (theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    saveStoredTheme(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(newTheme);
  },


  setSelectedApplication: (app) => set({ selectedApplication: app, isDetailsOpen: !!app }),
  setIsSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
  setIsDetailsOpen: (isOpen) => set({ isDetailsOpen: isOpen, selectedApplication: isOpen ? get().selectedApplication : null }),

  setLlmConfig: (config) => {
    if (config) {
      saveStoredLLMConfig(config);
    }
    set({ llmConfig: config });
  },

  setSmtpConfig: (config) => {
    if (config) {
      saveStoredSMTPConfig(config);
    }
    set({ smtpConfig: config });
  },

  setResumeConfig: (config) => {
    if (config) {
      saveStoredResumeConfig(config);
    } else {
      removeStoredResumeConfig();
    }
    set({ resumeConfig: config });
  }
}));

