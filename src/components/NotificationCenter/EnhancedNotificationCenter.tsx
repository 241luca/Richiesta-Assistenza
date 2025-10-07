import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { 
  BellIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  InformationCircleIcon,
  ArchiveBoxIcon,
  TrashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  metadata?: any;
  recipientId: string;
  senderId?: string;
  entityType?: string;
  entityId?: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  today: number;
  thisWeek: number;
  byCategory: Record<string, number>;
  bySeverity: {
    info: number;
    success: number;
    warning: number;
    error: number;
  };
}

type FilterType = 'all' | 'unread' | 'today' | 'archived';

const EnhancedNotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const queryClient = useQueryClient();

  // Fetch notifiche con filtri
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', filter, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter === 'unread') params.append('unread', 'true');
      if (filter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        params.append('after', today.toISOString());
      }
      if (categoryFilter !== 'all') params.append('type', categoryFilter);
      
      const response = await api.get(`/notifications?${params.toString()}`);
      // Il backend restituisce { success: true, data: [...array di notifiche...] }
      return response.data.data || [];
    },
    refetchInterval: 30000,
  });

  // Fetch statistiche
  const { data: stats } = useQuery<NotificationStats>({
    queryKey: ['notification-stats'],
    queryFn: async () => {
      const response = await api.get('/notifications/stats');
      return response.data.data;
    },
    refetchInterval: 60000,
  });

  // Mutation per marcare come letta
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
  });

  // Mutation per archiviare
  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
  });

  // Mutation per eliminare
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
  });

  // Mutation per marcare tutte come lette
  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
  });

  // Trasforma le notifiche aggiungendo i campi severity e category dal metadata
  const notifications = useMemo(() => {
    // Gestisce sia array che oggetti dal backend
    const rawNotifications = Array.isArray(notificationsData) 
      ? notificationsData 
      : (notificationsData as any)?.notifications || [];
    
    if (!rawNotifications || rawNotifications.length === 0) return [];
    
    return rawNotifications.map((n: Notification) => ({
      ...n,
      severity: (n.metadata as any)?.severity || 'info',
      category: n.type,
      read: n.isRead,
      message: n.content,
      title: n.title,
      createdAt: n.createdAt
    }));
  }, [notificationsData]);

  // Estrai stats da notificationsData se è un oggetto
  const actualStats = stats || (notificationsData as any)?.stats;

  // Ottieni icona per severity
  const getNotificationIcon = (severity: string) => {
    switch (severity) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  // Ottieni colore categoria
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'PAYMENT': 'bg-green-100 text-green-800',
      'REQUEST': 'bg-blue-100 text-blue-800',
      'QUOTE': 'bg-purple-100 text-purple-800',
      'SYSTEM': 'bg-gray-100 text-gray-800',
      'SECURITY': 'bg-red-100 text-red-800',
      'USER': 'bg-indigo-100 text-indigo-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // Formatta tempo relativo
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Adesso';
    if (diffMins < 60) return `${diffMins} min fa`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ore fa`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} giorni fa`;
  };

  const unreadCount = actualStats?.unread || stats?.unread || 0;

  return (
    <div className="relative">
      {/* Icona campanella */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center"
        title="Notifiche"
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="h-6 w-6 text-blue-600" />
        ) : (
          <BellIcon className="h-6 w-6 text-gray-600" />
        )}
        
        {/* Badge contatore */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Pannello notifiche */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Pannello */}
          <div className="absolute right-0 top-8 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Notifiche
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {/* Statistiche */}
              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <span>{unreadCount} non lette</span>
                <span>•</span>
                <span>{stats?.today || 0} oggi</span>
                <span>•</span>
                <span>{stats?.thisWeek || 0} questa settimana</span>
              </div>
            </div>

            {/* Filtri */}
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                {(['all', 'unread', 'today'] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 text-xs rounded-full ${
                      filter === f
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {f === 'all' ? 'Tutte' : f === 'unread' ? 'Non lette' : 'Oggi'}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista notifiche */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  Caricamento...
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification: any) => (
                    <div 
                      key={notification.id}
                      className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.severity)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </p>
                            
                            {/* Menu azioni */}
                            <div className="flex items-center space-x-1 ml-2">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsReadMutation.mutate(notification.id)}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                  title="Segna come letta"
                                >
                                  <CheckIcon className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => archiveMutation.mutate(notification.id)}
                                className="p-1 text-gray-400 hover:text-yellow-600"
                                title="Archivia"
                              >
                                <ArchiveBoxIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteMutation.mutate(notification.id)}
                                className="p-1 text-gray-400 hover:text-red-600"
                                title="Elimina"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center mt-2 space-x-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(notification.category)}`}>
                              {notification.category}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                  📭 Nessuna notifica
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsReadMutation.mutate()}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    Segna tutte come lette
                  </button>
                )}
                <button
                  onClick={() => window.location.href = '/notifications'}
                  className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 ml-auto"
                >
                  Vedi tutte →
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EnhancedNotificationCenter;
