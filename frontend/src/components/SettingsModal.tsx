import React, { useState, useEffect } from 'react';
import { X, Save, Mail, Paperclip, CheckCircle2, Cpu, Eye, EyeOff, Loader2, Check, AlertCircle, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { getStoredSMTPConfig, getStoredLLMConfig, saveStoredLLMConfig, fileToBase64 } from '../utils/storage';
import { SMTPConfig, LLMConfig } from '../types';

const PROVIDER_OPTIONS = [
  'OpenAI',
  'Gemini',
  'Groq',
  'OpenRouter',
  'Together AI',
  'Cerebras'
];

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setIsSettingsOpen, addActivityLog, setSmtpConfig, llmConfig, setLlmConfig, resumeConfig, setResumeConfig } = useAppStore();

  // LLM Config State
  const [provider, setProvider] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [isValidatingLlm, setIsValidatingLlm] = useState(false);
  const [llmValidationSuccess, setLlmValidationSuccess] = useState<string | null>(null);
  const [llmValidationError, setLlmValidationError] = useState<string | null>(null);
  const [llmSavedSuccess, setLlmSavedSuccess] = useState(false);

  // SMTP Config State
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpFromEmail, setSmtpFromEmail] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('Applicant');
  const [useTls, setUseTls] = useState(true);

  // Resume State
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isSettingsOpen) {
      // Load stored LLM config
      const storedLlm = getStoredLLMConfig() || llmConfig;
      if (storedLlm) {
        setProvider(storedLlm.provider || '');
        setApiKey(storedLlm.apiKey || '');
        setSelectedModel(storedLlm.model || '');
        if (storedLlm.model) {
          setAvailableModels((prev) => prev.includes(storedLlm.model) ? prev : [storedLlm.model, ...prev]);
          setLlmValidationSuccess('Configured from Local Storage');
        }
      }

      // Load stored SMTP config
      const storedSmtp = getStoredSMTPConfig();
      if (storedSmtp) {
        setSmtpHost(storedSmtp.smtpHost || 'smtp.gmail.com');
        setSmtpPort(storedSmtp.smtpPort || 587);
        setSmtpUser(storedSmtp.smtpUser || '');
        setSmtpPassword(storedSmtp.smtpPassword || '');
        setSmtpFromEmail(storedSmtp.smtpFromEmail || '');
        setSmtpFromName(storedSmtp.smtpFromName || 'Applicant');
        setUseTls(storedSmtp.useTls !== undefined ? storedSmtp.useTls : true);
      }
      if (resumeConfig) {
        setUploadStatus(`${resumeConfig.fileName}`);
      }
    }
  }, [isSettingsOpen]);

  if (!isSettingsOpen) return null;

  const handleValidateLLM = async () => {
    if (!provider || !apiKey.trim()) return;

    setIsValidatingLlm(true);
    setLlmValidationSuccess(null);
    setLlmValidationError(null);
    setLlmSavedSuccess(false);

    try {
      const res = await api.connectLLM(provider, apiKey.trim(), selectedModel || undefined);
      if (res.success) {
        const fetchedModels = res.models || [];
        setAvailableModels(fetchedModels);
        if (fetchedModels.length > 0) {
          if (!selectedModel || !fetchedModels.includes(selectedModel)) {
            setSelectedModel(fetchedModels[0]);
          }
          setLlmValidationSuccess(`✓ Connected Successfully (${fetchedModels.length} models available)`);
        } else {
          setLlmValidationSuccess('✓ Connected Successfully');
        }
      } else {
        setLlmValidationError(res.error || 'Authentication Failed');
      }
    } catch (e: any) {
      setLlmValidationError('Unable to connect');
    } finally {
      setIsValidatingLlm(false);
    }
  };

  const handleModelChange = (newModel: string) => {
    setSelectedModel(newModel);
  };

  const handleSaveLLMConfig = () => {
    if (!provider || !apiKey.trim() || !selectedModel.trim()) {
      alert('Please select a provider, enter API key, and select a model.');
      return;
    }

    const newConfig: LLMConfig = {
      provider,
      apiKey: apiKey.trim(),
      model: selectedModel.trim()
    };

    saveStoredLLMConfig(newConfig);
    setLlmConfig(newConfig);
    setLlmSavedSuccess(true);
    setTimeout(() => setLlmSavedSuccess(false), 3000);

    addActivityLog({
      companyName: 'Settings',
      jobTitle: 'LLM Config',
      status: 'Completed',
      type: 'success',
      message: `LLM Provider set to ${provider} (${selectedModel}).`
    });
  };

  const handleSaveAll = async () => {
    if (!smtpHost || !smtpUser || !smtpPassword) {
      alert('SMTP Host, SMTP User, and SMTP Password are required.');
      return;
    }

    setSaving(true);
    try {
      // Save LLM Config if set
      if (provider && apiKey.trim() && selectedModel.trim()) {
        handleSaveLLMConfig();
      }

      // Save SMTP Config
      const smtpObj: SMTPConfig = {
        smtpHost,
        smtpPort: Number(smtpPort) || 587,
        smtpUser,
        smtpPassword,
        smtpFromEmail: smtpFromEmail || smtpUser,
        smtpFromName: smtpFromName || 'Applicant',
        useTls
      };
      setSmtpConfig(smtpObj);

      // Save Resume File
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
        jobTitle: 'Configuration Saved',
        status: 'Completed',
        type: 'success',
        message: 'Application settings saved successfully.'
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
      
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={() => setIsSettingsOpen(false)}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-cyan-100/70 dark:bg-cyan-950/60 flex items-center justify-center flex-shrink-0 border border-cyan-200/50 dark:border-cyan-900/50">
            <Sparkles className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Settings & Preferences</h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 font-normal mt-0.5">Configure your AI LLM provider, SMTP mail server, and resume.</p>
          </div>
        </div>

        {/* SECTION 1: LLM CONFIGURATION */}
        <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">LLM Configuration</h4>
            </div>
            {llmSavedSuccess && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 animate-pulse flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Configuration Saved</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 font-normal">
            Configure your preferred AI provider used to generate personalized email subjects and email bodies.
          </p>

          <div className="space-y-3.5 pt-1">
            
            {/* Provider Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Provider</label>
              <select
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value);
                  setLlmValidationSuccess(null);
                  setLlmValidationError(null);
                  setAvailableModels([]);
                  setSelectedModel('');
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-cyan-500 cursor-pointer transition-all font-medium"
              >
                <option value="">Select Provider</option>
                {PROVIDER_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* API Key Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="Enter your API key"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setLlmValidationSuccess(null);
                    setLlmValidationError(null);
                  }}
                  onCopy={(e) => e.preventDefault()}
                  autoComplete="off"
                  className="w-full pl-3 pr-10 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-cyan-500 font-mono transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title={showApiKey ? "Hide API key" : "Show API key"}
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Validate / Connect Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleValidateLLM}
                disabled={!provider || !apiKey.trim() || isValidatingLlm}
                className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold shadow-xs transition-all ${
                  !provider || !apiKey.trim() || isValidatingLlm
                    ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                    : 'bg-cyan-500 hover:bg-cyan-600 text-white cursor-pointer active:scale-95'
                }`}
              >
                {isValidatingLlm ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Validating & Fetching Models...</span>
                  </>
                ) : (
                  <span>Validate LLM Configuration</span>
                )}
              </button>
            </div>

            {/* Validation Feedback */}
            {llmValidationSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>{llmValidationSuccess}</span>
              </div>
            )}

            {llmValidationError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>{llmValidationError}</span>
              </div>
            )}

            {/* Model Dropdown / Input */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Model {availableModels.length > 0 && `(${availableModels.length} available)`}
                </label>
                {availableModels.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCustomModel(!isCustomModel)}
                    className="text-[10px] text-cyan-500 hover:text-cyan-600 dark:text-cyan-400 cursor-pointer font-medium"
                  >
                    {isCustomModel ? 'Select from list' : 'Enter custom'}
                  </button>
                )}
              </div>

              {isCustomModel ? (
                <input
                  type="text"
                  placeholder="Enter custom model name"
                  value={selectedModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-cyan-500 font-mono transition-all"
                />
              ) : availableModels.length > 0 ? (
                <select
                  value={selectedModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-cyan-500 font-mono cursor-pointer transition-all"
                >
                  <option value="">Select a model</option>
                  {availableModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder={provider && apiKey ? "Click 'Validate LLM Configuration' above to load models or enter manually" : "Select provider and enter API key above"}
                  value={selectedModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-cyan-500 font-mono transition-all"
                />
              )}
            </div>

            {/* Save LLM Button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSaveLLMConfig}
                disabled={!provider || !apiKey.trim() || !selectedModel.trim()}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  !provider || !apiKey.trim() || !selectedModel.trim()
                    ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                    : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 cursor-pointer active:scale-95'
                }`}
              >
                Save Configuration
              </button>
            </div>

          </div>
        </div>

        {/* SECTION 2: SMTP CONFIGURATION */}
        <div className="space-y-4 pt-2">
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
        </div>

        {/* SECTION 3: RESUME UPLOAD */}
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

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSaveAll}
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
