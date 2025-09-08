import React from 'react';
import {
  ChartBarIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  BellIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

interface NotificationStatsProps {
  stats: any;
  loading: boolean;
}

const NotificationStats: React.FC<NotificationStatsProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Nessuna statistica disponibile</h3>
        <p className="mt-1 text-sm text-gray-500">
          Le statistiche appariranno quando inizierai a inviare notifiche.
        </p>
      </div>
    );
  }

  // Calcola percentuali e trend
  const deliveryRate = stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(1) : 0;
  const failureRate = stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : 0;
  const pendingCount = stats.total - stats.sent - stats.failed;

  // Icona per canale
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <EnvelopeIcon className="h-5 w-5" />;
      case 'sms':
        return <DevicePhoneMobileIcon className="h-5 w-5" />;
      case 'websocket':
        return <BellIcon className="h-5 w-5" />;
      case 'whatsapp':
        return <ChatBubbleLeftIcon className="h-5 w-5" />;
      default:
        return <BellIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistiche Principali */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Totale Notifiche */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Totale Notifiche</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="ml-4">
              <div className="p-3 bg-indigo-100 rounded-full">
                <BellIcon className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Inviate con Successo */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Inviate</p>
              <p className="mt-2 text-3xl font-bold text-green-600">{stats.sent}</p>
              <p className="mt-1 flex items-center text-sm text-gray-500">
                <span className="text-green-600 font-medium">{deliveryRate}%</span>
                <ArrowTrendingUpIcon className="ml-1 h-4 w-4 text-green-600" />
              </p>
            </div>
            <div className="ml-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Fallite */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Fallite</p>
              <p className="mt-2 text-3xl font-bold text-red-600">{stats.failed}</p>
              <p className="mt-1 flex items-center text-sm text-gray-500">
                <span className="text-red-600 font-medium">{failureRate}%</span>
                {stats.failed > 0 && (
                  <ArrowTrendingDownIcon className="ml-1 h-4 w-4 text-red-600" />
                )}
              </p>
            </div>
            <div className="ml-4">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* In Coda */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">In Coda</p>
              <p className="mt-2 text-3xl font-bold text-yellow-600">{pendingCount}</p>
              <p className="mt-1 text-sm text-gray-500">
                Da processare
              </p>
            </div>
            <div className="ml-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiche per Canale */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Distribuzione per Canale</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {stats.byChannel?.map((item: any) => {
              const percentage = stats.total > 0 ? ((item.count / stats.total) * 100).toFixed(1) : 0;
              return (
                <div key={item.channel} className="flex items-center">
                  <div className="flex items-center w-32">
                    {getChannelIcon(item.channel)}
                    <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                      {item.channel}
                    </span>
                  </div>
                  <div className="flex-1 ml-4">
                    <div className="relative">
                      <div className="overflow-hidden h-8 text-xs flex rounded bg-gray-200">
                        <div
                          style={{ width: `${percentage}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600"
                        >
                          <span className="font-medium">{percentage}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 w-20 text-right">
                    <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Template */}
      {stats.byTemplate && stats.byTemplate.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Template Più Utilizzati</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {stats.byTemplate.slice(0, 5).map((item: any, index: number) => (
                <div key={item.templateId} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-semibold text-sm">
                      {index + 1}
                    </span>
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      Template #{item.templateId.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">
                      {item._count} invii
                    </span>
                    <div className="w-32">
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                        <div
                          style={{ 
                            width: `${(item._count / stats.total) * 100}%` 
                          }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grafico Temporale (placeholder) */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Andamento Temporale</h3>
        </div>
        <div className="p-6">
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <ChartBarIcon className="mx-auto h-12 w-12" />
              <p className="mt-2 text-sm">Grafico in arrivo...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationStats;
