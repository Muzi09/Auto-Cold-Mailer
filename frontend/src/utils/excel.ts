import * as XLSX from 'xlsx';
import { UploadRow } from '../types';

export const REQUIRED_COLUMNS = [
  'ID',
  'Company Name',
  'Job Title',
  'Skills',
  'Contact Email',
  'Job Description'
];

export const parseExcelFile = async (file: File): Promise<{ rows: UploadRow[]; errors: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (json.length === 0) {
          return resolve({ rows: [], errors: ['The uploaded Excel file is empty.'] });
        }

        // Validate column headers
        const firstRowKeys = Object.keys(json[0]).map(k => k.trim());
        const missingColumns = REQUIRED_COLUMNS.filter(
          col => !firstRowKeys.some(key => key.toLowerCase() === col.toLowerCase())
        );

        if (missingColumns.length > 0) {
          return resolve({
            rows: [],
            errors: [`Missing required columns: ${missingColumns.join(', ')}`]
          });
        }

        // Map and validate rows
        const parsedRows: UploadRow[] = json.map((row: any, index: number) => {
          const findVal = (colName: string) => {
            const key = Object.keys(row).find(k => k.trim().toLowerCase() === colName.toLowerCase());
            return key ? String(row[key]).trim() : '';
          };

          const rawId = findVal('ID');
          const id = parseInt(rawId, 10) || index + 1;
          const companyName = findVal('Company Name');
          const jobTitle = findVal('Job Title');
          const skills = findVal('Skills');
          const contactEmail = findVal('Contact Email');
          const jobDescription = findVal('Job Description');

          const rowErrors: string[] = [];
          if (!companyName) rowErrors.push('Company Name is required');
          if (!jobTitle) rowErrors.push('Job Title is required');
          if (!contactEmail) {
            rowErrors.push('Contact Email is required');
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
            rowErrors.push('Invalid Email Format');
          }

          return {
            id,
            companyName,
            jobTitle,
            skills,
            contactEmail,
            jobDescription,
            isValid: rowErrors.length === 0,
            errors: rowErrors
          };
        });

        resolve({ rows: parsedRows, errors: [] });
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
