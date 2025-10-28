import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ChartBarIcon, UserGroupIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function OnboardingAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30');

  const { data: statsResponse, isLoading } = useQuery({
    queryKey: ['onboarding-analytics', timeRange],
    queryFn: () => api.get(`/audit?type=onboarding&days=${timeRange}`),
    staleTime: 5 * 60 * 1000,
  });

  const analyticsData = React.useMemo(() => {
    if (!statsResponse) return null;
    const stats = statsResponse.data || statsResponse;
    return {
      total_users: stats?.total_users || 0,
      completed_onboarding: stats?.completed_onboarding || 0,
      in_progress: stats?.in_progress || 0,
      abandoned: stats?.abandoned || 0,
      avg_completion_time: stats?.avg_completion_time || 0,
      tutorials_by_type: stats?.tutorials_by_type || {},
      daily_completions: stats?.daily_completions || []
    };
  }, [statsResponse]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Statistiche Onboarding</h1>
          <p className="text-gray-600 mt-2">Analisi completamento tutorial</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="7">7 giorni</option>
          <option value="30">30 giorni</option>
          <option value="90">90 giorni</option>
          <option value="365">12 mesi</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded shadow p-6">
          <p className="text-gray-600 text-sm">Utenti Totali</p>
          <p className="text-3xl font-bold mt-2">{analyticsData?.total_users || 0}</p>
          <UserGroupIcon className="h-12 w-12 text-blue-500 opacity-50 mt-4" />
        </div>

        <div className="bg-white rounded shadow p-6">
          <p className="text-gray-600 text-sm">Completati</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{analyticsData?.completed_onboarding || 0}</p>
          <CheckCircleIcon className="h-12 w-12 text-green-500 opacity-50 mt-4" />
        </div>

        <div className="bg-white rounded shadow p-6">
          <p className="text-gray-600 text-sm">In Corso</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{analyticsData?.in_progress || 0}</p>
          <ClockIcon className="h-12 w-12 text-yellow-500 opacity-50 mt-4" />
        </div>

        <div className="bg-white rounded shadow p-6">
          <p className="text-gray-600 text-sm">Tempo Medio</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{Math.round(analyticsData?.avg_completion_time || 0)}m</p>
          <ChartBarIcon className="h-12 w-12 text-purple-500 opacity-50 mt-4" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Stato Completamento</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Completati', value: analyticsData?.completed_onboarding || 0, fill: '#10b981' },
                  { name: 'In Corso', value: analyticsData?.in_progress || 0, fill: '#f59e0b' },
                  { name: 'Abbandonati', value: analyticsData?.abandoned || 0, fill: '#ef4444' }
                ]}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
              />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Trend Giornaliero</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData?.daily_completions || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="completions" stroke="#8b5cf6" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {!analyticsData && (
        <div className="bg-blue-50 border border-blue-200 rounded p-6 text-center">
          <p className="text-blue-800">Nessun dato disponibile</p>
        </div>
      )}
    </div>
  );
}