// src/components/admin/audit/AuditStatistics.tsx
import React from 'react';
import { 
  ChartBarIcon, 
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Props {
  data: any;
  loading: boolean;
  filters: any;
  onFiltersChange: (filters: any) => void;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AuditStatistics({ data, loading }: Props) {
  if (loading || !data) {
    return (
      <div className="bg-white shadow rounded-lg p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Prepara i dati per i grafici
  const actionData = data.topActions?.map((item: any) => ({
    name: item.action.replace(/_/g, ' '),
    value: item.count
  })) || [];

  return (
    <div className="space-y-6">
      {/* Statistiche Generali */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ChartBarIcon className="h-10 w-10 text-blue-600" />
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">
                {data.totalLogs}
              </p>
              <p className="text-sm text-gray-500">Operazioni Totali</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <UserGroupIcon className="h-10 w-10 text-green-600" />
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">
                {data.uniqueUsers}
              </p>
              <p className="text-sm text-gray-500">Utenti Unici</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-10 w-10 text-purple-600" />
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">
                {data.successRate}%
              </p>
              <p className="text-sm text-gray-500">Tasso di Successo</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ClockIcon className="h-10 w-10 text-orange-600" />
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">
                {data.failedOperations}
              </p>
              <p className="text-sm text-gray-500">Operazioni Fallite</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grafici */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Azioni Più Frequenti
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={actionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuzione per Categoria */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Distribuzione per Categoria
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={actionData.slice(0, 5)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {actionData.slice(0, 5).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
