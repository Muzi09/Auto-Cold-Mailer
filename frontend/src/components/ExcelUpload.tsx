import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2, FileUp } from 'lucide-react';
import { parseExcelFile, REQUIRED_COLUMNS } from '../utils/excel';
import { useAppStore } from '../store/useAppStore';

export const ExcelUpload: React.FC = () => {
  const { setParsedRows, addActivityLog } = useAppStore();
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setFileName(file.name);
    setIsParsing(true);
    setErrorMsg(null);

    try {
      const { rows, errors } = await parseExcelFile(file);

      if (errors.length > 0) {
        setErrorMsg(errors.join(' | '));
        addActivityLog({
          companyName: 'System',
          jobTitle: 'Excel Upload',
          status: 'Failed',
          type: 'error',
          message: `Excel upload failed: ${errors.join(', ')}`
        });
      } else {
        setParsedRows(rows);
        addActivityLog({
          companyName: 'System',
          jobTitle: 'Excel Upload',
          status: 'Completed',
          type: 'success',
          message: `Parsed ${rows.length} applications from ${file.name}`
        });
      }
    } catch (err: any) {
      setErrorMsg(`Failed to parse file: ${err.message || 'Unknown error'}`);
    } finally {
      setIsParsing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`relative group overflow-hidden rounded-3xl p-8 sm:p-12 text-center border-2 border-dashed transition-all cursor-pointer bg-white dark:bg-slate-900/60 shadow-2xs ${
          isDragActive
            ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20 scale-[1.005]'
            : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-900/80'
        }`}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto">
          
          {/* Icon Box */}
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
            {isParsing ? (
              <FileUp className="w-7 h-7 text-cyan-500 animate-bounce" />
            ) : (
              <UploadCloud className="w-7 h-7 text-cyan-500" />
            )}
          </div>

          {/* Text Instructions */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {isDragActive ? 'Drop your Excel file here...' : 'Upload Job Applications Excel'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              Drag & drop your <span className="text-cyan-600 dark:text-cyan-400 font-bold">.xlsx</span> or <span className="text-indigo-600 dark:text-indigo-400 font-bold">.xls</span> file here, or click to browse.
            </p>
          </div>

          {/* Required Columns Pills - Dark Charcoal Pills as seen in Reference Screenshot */}
          <div className="pt-2">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
              REQUIRED SHEET COLUMNS
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
              {REQUIRED_COLUMNS.map((col) => (
                <span
                  key={col}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1E293B] text-white border border-slate-800 shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span>{col}</span>
                </span>
              ))}
            </div>
          </div>

          {fileName && !errorMsg && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 text-xs font-semibold">
              <FileSpreadsheet className="w-4 h-4" />
              Selected: {fileName}
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-500/30 text-xs font-medium max-w-md">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
