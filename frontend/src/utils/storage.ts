import { SMTPConfig, ResumeData, LLMConfig } from '../types';

const LLM_STORAGE_KEY = 'llmConfiguration';
const SMTP_STORAGE_KEY = 'auto_cold_mailer_smtp_config';
const RESUME_STORAGE_KEY = 'auto_cold_mailer_resume_config';

export const getStoredLLMConfig = (): LLMConfig | null => {
  try {
    const raw = localStorage.getItem(LLM_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.provider && parsed.apiKey && parsed.model) {
      return parsed;
    }
    return null;
  } catch (e) {
    console.error('Failed to parse stored LLM config:', e);
    return null;
  }
};

export const saveStoredLLMConfig = (config: LLMConfig): void => {
  try {
    localStorage.setItem(LLM_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save LLM config to localStorage:', e);
  }
};

export const removeStoredLLMConfig = (): void => {
  try {
    localStorage.removeItem(LLM_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to remove LLM config from localStorage:', e);
  }
};

export const getStoredSMTPConfig = (): SMTPConfig | null => {
  try {
    const raw = localStorage.getItem(SMTP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.smtpHost && parsed.smtpUser && parsed.smtpPassword) {
      return parsed;
    }
    return null;
  } catch (e) {
    console.error('Failed to parse stored SMTP config:', e);
    return null;
  }
};

export const saveStoredSMTPConfig = (config: SMTPConfig): void => {
  try {
    localStorage.setItem(SMTP_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save SMTP config to localStorage:', e);
  }
};

export const removeStoredSMTPConfig = (): void => {
  try {
    localStorage.removeItem(SMTP_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to remove SMTP config from localStorage:', e);
  }
};

export const getStoredResumeConfig = (): ResumeData | null => {
  try {
    const raw = localStorage.getItem(RESUME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.fileName && parsed.fileData) {
      return parsed;
    }
    return null;
  } catch (e) {
    console.error('Failed to parse stored resume config:', e);
    return null;
  }
};

export const saveStoredResumeConfig = (resume: ResumeData): void => {
  try {
    localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(resume));
  } catch (e) {
    console.error('Failed to save resume config to localStorage:', e);
  }
};

export const removeStoredResumeConfig = (): void => {
  try {
    localStorage.removeItem(RESUME_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to remove resume config from localStorage:', e);
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const THEME_STORAGE_KEY = 'auto_cold_mailer_theme';

export const getStoredTheme = (): 'dark' | 'light' => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  } catch (e) {
    return 'dark';
  }
};

export const saveStoredTheme = (theme: 'dark' | 'light'): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    console.error('Failed to save theme to localStorage:', e);
  }
};


