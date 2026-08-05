export type ApplicationStatus = 
  | 'Pending'
  | 'Validating Email'
  | 'Generating Subject'
  | 'Generating Email'
  | 'Sending'
  | 'Sent'
  | 'Failed'
  | 'Invalid Email'
  | 'Retrying'
  | 'Completed';

export interface EmailValidationInfo {
  isValid: boolean;
  reason: string;
  validatedAt?: string;
}

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
  emailValidation?: EmailValidationInfo;
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
  contactEmail?: string;
  status: ApplicationStatus;
  applicationId?: number;
  subject?: string;
  emailBody?: string;
  error?: string;
  reason?: string;
  emailValidation?: EmailValidationInfo;
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
  reason?: string;
}

export interface LLMConfig {
  provider: string;
  apiKey: string;
  model: string;
  models?: string[];
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


