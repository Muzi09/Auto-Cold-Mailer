import { Application, UploadRow, Settings, SMTPConfig, ResumeData, LLMConfig } from '../types';

const API_BASE = '/api';

export const api = {
  connectLLM: async (
    provider: string,
    apiKey: string
  ): Promise<{ success: boolean; provider?: string; defaultModel?: string; models?: string[]; error?: string }> => {
    const res = await fetch(`${API_BASE}/llm/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unable to connect' }));
      return { success: false, error: err.error || err.detail || 'Unable to connect' };
    }
    return res.json();
  },

  startApplications: async (
    rows: UploadRow[],
    smtpConfig: SMTPConfig,
    llmConfig?: LLMConfig | null,
    resumeConfig?: ResumeData | null
  ): Promise<{ message: string; count: number }> => {
    const formattedApps = rows.map(r => ({
      applicationId: r.id,
      companyName: r.companyName,
      jobTitle: r.jobTitle,
      skills: r.skills,
      contactEmail: r.contactEmail,
      jobDescription: r.jobDescription
    }));

    const res = await fetch(`${API_BASE}/applications/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applications: formattedApps,
        smtpConfig,
        llm: llmConfig ? {
          provider: llmConfig.provider,
          apiKey: llmConfig.apiKey,
          model: llmConfig.model
        } : null,
        resume: resumeConfig || null
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to start job campaign' }));
      throw new Error(err.detail || 'Failed to start job campaign');
    }

    return res.json();
  },


  getApplications: async (status?: string, search?: string): Promise<Application[]> => {
    const params = new URLSearchParams();
    if (status && status !== 'All') params.append('status', status);
    if (search) params.append('search', search);

    const url = `${API_BASE}/applications${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch applications');
    return res.json();
  },

  getApplicationById: async (id: number): Promise<Application> => {
    const res = await fetch(`${API_BASE}/applications/${id}`);
    if (!res.ok) throw new Error(`Application ${id} not found`);
    return res.json();
  },

  clearApplications: async (): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/applications`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear application history');
    return res.json();
  },

  deleteApplication: async (id: number): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/applications/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete application');
    return res.json();
  },

  getSettings: async (): Promise<Settings> => {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  updateSettings: async (settingsData: Partial<Settings>): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsData)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  uploadResume: async (file: File): Promise<{ message: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/applications/upload-resume`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) throw new Error('Failed to upload resume PDF');
    return res.json();
  }
};
