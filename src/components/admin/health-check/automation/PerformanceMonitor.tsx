/**
 * Performance Monitor Component
 * Monitora le performance del sistema in tempo reale
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChartBarIcon,
  CpuChipIcon,
  ServerIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import api from '@/services/api';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface PerformanceMetrics {
  timestamp: string;
  cpu: {
    usage: number;
    load: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  database: {
    activeConnections: number;
    queryTime: number;
    slowQueries: number;
  };
  api: {
    responseTime: number;
    requestsPerMinute: number;
    errorRate: number;
  };
  healthChecks: {
    averageExecutionTime: number;
    checksPerHour: number;
    failureRate: number;
  };
}

export default function PerformanceMonitor() {
  const [timeRange, setTimeRange] = useState(60); // minuti
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch performance metrics
  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['performance-metrics', timeRange],
    queryFn: async () => {
      const response = await api.get(`/admin/health-check/performance?minutes=${timeRange}`);
      return response.data.data;
    },
    refetchInterval: autoRefresh ? 30000 : false, // Refresh ogni 30 secondi se auto-refresh è attivo
  });

  // Fetch performance history
  const { data: history } = useQuery({
    queryKey: ['performance-history'],
    queryFn: async () => {
      const response = await api.get('/admin/health-check/performance/history');
      return response.data.data;
    },
    refetchInterval: autoRefresh ? 60000 : false,
  });

  // Format data for charts
  const chartData = history?.slice(-20).map((item: PerformanceMetrics) => ({
    time: new Date(item.timestamp).toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    cpu: item.cpu.usage,
    memory: item.memory.percentage,
    responseTime: item.api.responseTime,
    requests: item.api.requestsPerMinute,
    errorRate: item.api.errorRate
  })) || [];

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const current = metrics?.current || {};
  const aggregate = metrics?.aggregate || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Performance Monitor
          </h3>
          <p className="text-gray-600 mt-1">
            Monitoraggio in tempo reale delle performance del sistema
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={15}>Ultimi 15 minuti</option>
            <option value={30}>Ultimi 30 minuti</option>
            <option value={60}>Ultima ora</option>
            <option value={120}>Ultime 2 ore</option>
            <option value={1440}>Ultime 24 ore</option>
          </select>

          {/* Auto-refresh toggle */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Auto-refresh</span>
          </label>

          {/* Manual refresh */}
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Current Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* CPU Usage */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">CPU Usage</span>
            <CpuChipIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className={`text-2xl font-bold ${getStatusColor(
            current.cpu?.usage || 0,
            { warning: 70, critical: 85 }
          )}`}>
            {current.cpu?.usage || 0}%
          </div>
          {aggregate?.cpu && (
            <div className="text-xs text-gray-500 mt-1">
              Avg: {aggregate.cpu.avg}% | Max: {aggregate.cpu.max}%
            </div>
          )}
        </div>

        {/* Memory Usage */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Memory</span>
            <ServerIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className={`text-2xl font-bold ${getStatusColor(
            current.memory?.percentage || 0,
            { warning: 75, critical: 90 }
          )}`}>
            {current.memory?.percentage || 0}%
          </div>
          {current.memory && (
            <div className="text-xs text-gray-500 mt-1">
              {formatBytes(current.memory.used)} / {formatBytes(current.memory.total)}
            </div>
          )}
        </div>

        {/* API Response Time */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Response Time</span>
            <ClockIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className={`text-2xl font-bold ${getStatusColor(
            current.api?.responseTime || 0,
            { warning: 500, critical: 1000 }
          )}`}>
            {current.api?.responseTime || 0}ms
          </div>
          {aggregate?.api && (
            <div className="text-xs text-gray-500 mt-1">
              Avg: {aggregate.api.avgResponseTime}ms
            </div>
          )}
        </div>

        {/* Error Rate */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Error Rate</span>
            <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className={`text-2xl font-bold ${getStatusColor(
            current.api?.errorRate || 0,
            { warning: 2, critical: 5 }
          )}`}>
            {(current.api?.errorRate || 0).toFixed(1)}%
          </div>
          {aggregate?.api && (
            <div className="text-xs text-gray-500 mt-1">
              Avg: {aggregate.api.avgErrorRate}%
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <>
          {/* CPU & Memory Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-4">CPU & Memory Usage</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cpu"
                  stroke="#3B82F6"
                  name="CPU %"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="memory"
                  stroke="#10B981"
                  name="Memory %"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* API Performance Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-4">API Performance</h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="responseTime"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={0.3}
                  name="Response Time (ms)"
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.3}
                  name="Requests/min"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Additional Metrics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Health Check Metrics</h4>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Avg Execution Time</p>
            <p className="text-xl font-semibold">
              {current.healthChecks?.averageExecutionTime || 0}ms
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Checks per Hour</p>
            <p className="text-xl font-semibold">
              {current.healthChecks?.checksPerHour || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Failure Rate</p>
            <p className="text-xl font-semibold">
              {current.healthChecks?.failureRate || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Database Metrics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Database Performance</h4>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Active Connections</p>
            <p className="text-xl font-semibold">
              {current.database?.activeConnections || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Avg Query Time</p>
            <p className="text-xl font-semibold">
              {current.database?.queryTime || 0}ms
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Slow Queries</p>
            <p className="text-xl font-semibold">
              {current.database?.slowQueries || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}