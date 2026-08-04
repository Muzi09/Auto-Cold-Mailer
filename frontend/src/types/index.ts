export type ApplicationStatus = 
  | 'Pending'
  | 'Generating Subject'
  | 'Generating Email'
  | 'Sending'
  | 'Sent'
  | 'Failed'
  | 'Retrying'
  | 'Completed';

export interface Application {
  id?: string;
  applicationId: number;
  companyName: string;
  jobTitle: string;
  skills: string;
  contactEmail: string;
  jobDescription: string;
  subject: string;
  emailBody: string;
  status: ApplicationStatus;
  error?: string;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UploadRow {
  id: number;
  companyName: string;
  jobTitle: string;
  skills: string;
  contactEmail: string;
  jobDescription: string;
  isValid?: boolean;
  errors?: string[];
}

export interface LiveProgressMessage {
  current: number;
  total: number;
  companyName: string;
  jobTitle: string;
  status: ApplicationStatus;
  applicationId?: number;
  subject?: string;
  emailBody?: string;
  error?: string;
  sentAt?: string;
  timestamp?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  companyName: string;
  jobTitle: string;
  status: ApplicationStatus;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface SMTPConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpFromEmail?: string;
  smtpFromName?: string;
  useTls?: boolean;
}

export interface ResumeData {
  fileName: string;
  fileData: string;
}

export interface Settings {
  hasOpenaiKey?: boolean;
  openaiModel?: string;
  hasGeminiKey?: boolean;
  geminiModel?: string;
}


