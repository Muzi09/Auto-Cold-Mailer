import React, { useState, useMemo } from 'react';
import { Search, Filter, Trash2, RefreshCw, Eye, ArrowUpDown, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Application, ApplicationStatus } from '../types';
import { api } from '../services/api';

export const ApplicationTable: React.FC = () => {
  const { applications, setApplications, setSelectedApplication, addActivityLog } = useAppStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<'applicationId' | 'companyName' | 'status'>('applicationId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleRefresh = async () => {
    try {
      const fetched = await api.getApplications();
      setApplications(fetched);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all application history?')) return;
    try {
      await api.clearApplications();
      setApplications([]);
      addActivityLog({
        companyName: 'System',
        jobTitle: 'Database',
        status: 'Completed',
        type: 'info',
        message: 'Application history cleared.'
      });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteOne = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await api.deleteApplication(id);
      setApplications(applications.filter(a => a.applicationId !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Status Badge Helper - Matches Screenshot 3 Pill Badges
  const getStatusStyle = (status: ApplicationStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
      case 'Generating Subject':
      case 'Generating Email':
      case 'Sending':
      case 'Retrying':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 animate-pulse';
      case 'Sent':
      case 'Completed':
        return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400';
      case 'Failed':
        return 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  // Filtered and Sorted Data
  const filteredApps = useMemo(() => {
    return applications
      .filter((app) => {
        const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
        const s = search.toLowerCase();
        const matchesSearch =
          !search ||
          app.companyName.toLowerCase().includes(s) ||
          app.jobTitle.toLowerCase().includes(s) ||
          app.contactEmail.toLowerCase().includes(s) ||
          app.skills.toLowerCase().includes(s);
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [applications, statusFilter, search, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredApps.length / pageSize) || 1;
  const paginatedApps = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredApps.slice(start, start + pageSize);
  }, [filteredApps, currentPage, pageSize]);

  const toggleSort = (field: 'applicationId' | 'companyName' | 'status') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900/80 rounded-3xl p-6 sm:p-8 space-y-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Application Records</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Manage and review all sent, pending, and failed emails.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search company, job, email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-cyan-500 w-48 sm:w-60 transition-all font-medium"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="pl-8 pr-4 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-cyan-500 appearance-none transition-all cursor-pointer font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Generating Subject">Generating Subject</option>
              <option value="Generating Email">Generating Email</option>
              <option value="Sending">Sending</option>
              <option value="Sent">Sent</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            className="p-1.5 text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200/80 dark:border-slate-700 transition-all"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Clear history */}
          <button
            onClick={handleClearHistory}
            className="p-1.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-slate-200/80 dark:border-slate-700 transition-all"
            title="Clear all history"
          >
            <Trash2 className="w-4 h-4" />
          </button>

        </div>
      </div>

      {/* Applications Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 dark:bg-slate-900/60 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th
                onClick={() => toggleSort('applicationId')}
                className="px-4 py-3 cursor-pointer hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>ID</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('companyName')}
                className="px-4 py-3 cursor-pointer hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>COMPANY</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-3">JOB TITLE</th>
              <th className="px-4 py-3">CONTACT EMAIL</th>
              <th
                onClick={() => toggleSort('status')}
                className="px-4 py-3 cursor-pointer hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>STATUS</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-3">SENT TIME</th>
              <th className="px-4 py-3">ERROR LOG</th>
              <th className="px-4 py-3 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
            {paginatedApps.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400 italic">
                  No application records found matching criteria.
                </td>
              </tr>
            ) : (
              paginatedApps.map((app) => (
                <tr
                  key={app.applicationId}
                  onClick={() => setSelectedApplication(app)}
                  className="bg-white dark:bg-slate-900/60 hover:bg-slate-50/80 dark:hover:bg-slate-900 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3.5 font-mono text-slate-400 text-[11px]">#{app.applicationId}</td>
                  <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100">{app.companyName}</td>
                  <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 font-medium">{app.jobTitle}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-500 dark:text-slate-400 text-[11px]">{app.contactEmail}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${getStatusStyle(app.status)}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-400 dark:text-slate-500 text-[11px]">
                    {app.sentAt ? new Date(app.sentAt).toLocaleTimeString() : '-'}
                  </td>
                  <td className="px-4 py-3.5 max-w-[180px] truncate text-red-400 font-mono text-[11px]">
                    {app.error || '-'}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedApplication(app)}
                        className="p-1 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 rounded-lg transition-colors"
                        title="View Email Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteOne(e, app.applicationId)}
                        className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                        title="Delete application"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar - Matches Screenshot 4 */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-slate-400 font-medium">
          Showing {paginatedApps.length} of {filteredApps.length} entries
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 px-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
