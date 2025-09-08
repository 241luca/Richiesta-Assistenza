/**
 * Report Generator Component
 * Genera e gestisce i report PDF del sistema Health Check
 */

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  DocumentArrowDownIcon,
  CalendarIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Report {
  id: string;
  filename: string;
  createdAt: string;
  size: number;
  type: 'weekly' | 'custom';
  period: {
    start: string;
    end: string;
  };
}

export default function ReportGenerator() {
  const [dateRange, setDateRange] = useState({
    start: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [generatingReport, setGeneratingReport] = useState(false);

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (params: { startDate?: string; endDate?: string }) => {
      setGeneratingReport(true);
      const response = await api.post('/admin/health-check/report', params);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Report generato con successo');
      setGeneratingReport(false);
      // Qui potresti aggiungere logica per scaricare il file
      if (data.data?.filepath) {
        downloadReport(data.data.filepath);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Errore nella generazione del report');
      setGeneratingReport(false);
    }
  });

  // Download report function
  const downloadReport = (filepath: string) => {
    // In produzione, questo dovrebbe essere un endpoint che serve il file
    const filename = filepath.split('/').pop();
    const downloadUrl = `/admin/health-check/download/${filename}`;
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'health-report.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateWeeklyReport = () => {
    const startDate = format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    const endDate = format(new Date(), 'yyyy-MM-dd');
    generateReportMutation.mutate({ startDate, endDate });
  };

  const handleGenerateCustomReport = () => {
    generateReportMutation.mutate({
      startDate: dateRange.start,
      endDate: dateRange.end
    });
  };

  // Mock data per i report precedenti (in produzione verrebbero dal backend)
  const previousReports: Report[] = [
    {
      id: '1',
      filename: 'health-report-2025-01-01.pdf',
      createdAt: '2025-01-01T09:00:00Z',
      size: 245678,
      type: 'weekly',
      period: {
        start: '2024-12-25',
        end: '2025-01-01'
      }
    },
    {
      id: '2',
      filename: 'health-report-2024-12-25.pdf',
      createdAt: '2024-12-25T09:00:00Z',
      size: 234567,
      type: 'weekly',
      period: {
        start: '2024-12-18',
        end: '2024-12-25'
      }
    }
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          Generazione Report
        </h3>
        <p className="text-gray-600 mt-1">
          Genera report PDF con statistiche e analisi del sistema
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weekly Report */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="font-medium text-gray-900">Report Settimanale</h4>
              <p className="text-sm text-gray-500 mt-1">
                Genera il report degli ultimi 7 giorni
              </p>
            </div>
            <CalendarIcon className="h-8 w-8 text-blue-500" />
          </div>
          
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <p>• Health score medio</p>
              <p>• Trend dei moduli</p>
              <p>• Incidenti critici</p>
              <p>• Raccomandazioni</p>
            </div>
            
            <button
              onClick={handleGenerateWeeklyReport}
              disabled={generatingReport}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {generatingReport ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 inline mr-2 animate-spin" />
                  Generazione in corso...
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-5 w-5 inline mr-2" />
                  Genera Report Settimanale
                </>
              )}
            </button>
          </div>
        </div>

        {/* Custom Report */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="font-medium text-gray-900">Report Personalizzato</h4>
              <p className="text-sm text-gray-500 mt-1">
                Scegli un periodo specifico
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-purple-500" />
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Inizio
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fine
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={handleGenerateCustomReport}
              disabled={generatingReport}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {generatingReport ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 inline mr-2 animate-spin" />
                  Generazione in corso...
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-5 w-5 inline mr-2" />
                  Genera Report Custom
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report Schedule Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <CalendarIcon className="h-5 w-5 text-blue-500 mr-2" />
          <div>
            <p className="font-medium text-blue-900">Report Automatici</p>
            <p className="text-sm text-blue-700">
              I report settimanali vengono generati automaticamente ogni lunedì alle 9:00 
              e inviati via email agli amministratori.
            </p>
          </div>
        </div>
      </div>

      {/* Previous Reports */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Report Precedenti</h4>
        </div>
        <div className="divide-y divide-gray-200">
          {previousReports.map((report) => (
            <div key={report.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center">
                <DocumentArrowDownIcon className="h-10 w-10 text-gray-400 mr-4" />
                <div>
                  <p className="font-medium text-gray-900">{report.filename}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(report.createdAt), 'dd MMMM yyyy HH:mm', { locale: it })} 
                    {' • '}
                    {formatFileSize(report.size)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Periodo: {format(new Date(report.period.start), 'dd/MM/yyyy')} - {format(new Date(report.period.end), 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => downloadReport(report.filename)}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Opzioni Export</h4>
        <div className="grid grid-cols-2 gap-4">
          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Export CSV
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Export JSON
          </button>
        </div>
      </div>
    </div>
  );
}