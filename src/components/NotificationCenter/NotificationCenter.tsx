// src/components/NotificationCenter/NotificationCenter.tsx
/**
 * Centro Notifiche UI - Componente React
 * Gestisce visualizzazione e interazione con tutte le notifiche
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, X, Check, CheckCheck, Mail, MessageSquare, Phone, Send, Wifi, AlertCircle, Info } from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { toast } from 'react-hot-toast';

// Tipi
interface Notification {
  id: string;
  type: string;
  priority: 'CRITICAL' | 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  data?: any;
  requiresAction: boolean;
  actionUrl?: string;
  actionLabel?: string;
  readAt?: Date;
  createdAt: Date;
  deliveries?: NotificationDelivery[];
}

interface NotificationDelivery {
  id: string;
  channel: string;
  status: string;
  deliveredAt?: Date;
  readAt?: Date;
}

interface NotificationFilters {
  read?: boolean;
  type?: string;
  priority?: string;
  startDate?: Date;
  endDate?: Date;
}

interface NotificationPreferences {
  channels: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    push: boolean;
    inApp: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  blockedTypes: string[];
}

// Componente principale
export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const notificationRef = useRef<HTMLDivElement>(null);
  
  // WebSocket per notifiche real-time
  const { socket, isConnected } = useWebSocket();
  
  // Query notifiche
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () => api.get('/notifications', {
      params: {
        read: filter === 'all' ? undefined : false,
        limit: 50
      }
    }),
    refetchInterval: 30000 // Refresh ogni 30 secondi
  });
  
  const notifications = data?.notifications || [];
  const unreadCount = data?.unread || 0;
  
  // Mutation per marcare come letta
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => 
      api.post(`/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
  
  // Mutation per marcare tutte come lette
  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Tutte le notifiche sono state marcate come lette');
    }
  });
  
  // Mutation per eliminare notifica
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => 
      api.delete(`/notifications/${notificationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notifica eliminata');
    }
  });
  
  // WebSocket listeners
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    // Nuova notifica
    socket.on('notification', (notification: Notification) => {
      // Aggiungi alla lista
      queryClient.setQueryData(['notifications', filter], (old: any) => ({
        ...old,
        notifications: [notification, ...(old?.notifications || [])],
        unread: (old?.unread || 0) + 1
      }));
      
      // Mostra toast per notifiche importanti
      if (notification.priority === 'CRITICAL' || notification.priority === 'URGENT') {
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} bg-white shadow-lg rounded-lg p-4 max-w-md`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.priority === 'CRITICAL' ? (
                  <AlertCircle className="h-6 w-6 text-red-500" />
                ) : (
                  <Info className="h-6 w-6 text-yellow-500" />
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                {notification.requiresAction && (
                  <button
                    onClick={() => {
                      if (notification.actionUrl) {
                        window.location.href = notification.actionUrl;
                      }
                      toast.dismiss(t.id);
                    }}
                    className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    {notification.actionLabel || 'Visualizza'}
                  </button>
                )}
              </div>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="ml-4 flex-shrink-0 rounded-md text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        ), {
          duration: notification.priority === 'CRITICAL' ? Infinity : 5000
        });
      }
      
      // Vibrazione per notifiche urgenti (se supportato)
      if ('vibrate' in navigator && (notification.priority === 'CRITICAL' || notification.priority === 'URGENT')) {
        navigator.vibrate([200, 100, 200]);
      }
      
      // Audio per notifiche critiche
      if (notification.priority === 'CRITICAL') {
        const audio = new Audio('/sounds/critical-alert.mp3');
        audio.play().catch(() => {});
      }
    });
    
    // Aggiornamento badge
    socket.on('badge-update', ({ unreadCount }: { unreadCount: number }) => {
      queryClient.setQueryData(['notifications', filter], (old: any) => ({
        ...old,
        unread: unreadCount
      }));
    });
    
    // Notifica letta
    socket.on('notification-read', ({ notificationId }: { notificationId: string }) => {
      queryClient.setQueryData(['notifications', filter], (old: any) => ({
        ...old,
        notifications: old?.notifications?.map((n: Notification) =>
          n.id === notificationId ? { ...n, readAt: new Date() } : n
        ),
        unread: Math.max(0, (old?.unread || 0) - 1)
      }));
    });
    
    return () => {
      socket.off('notification');
      socket.off('badge-update');
      socket.off('notification-read');
    };
  }, [socket, isConnected, filter, queryClient]);
  
  // Click outside per chiudere
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Richiedi permesso notifiche push
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
  
  // Registra Service Worker per push
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      registerPushNotifications();
    }
  }, [user]);
  
  const registerPushNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Controlla subscription esistente
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Crea nuova subscription
        const response = await api.get('/notifications/vapid-public-key');
        const vapidPublicKey = response.data.key;
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
        
        // Invia subscription al server
        await api.post('/notifications/push-subscribe', {
          subscription,
          userAgent: navigator.userAgent
        });
      }
    } catch (error) {
      console.error('Errore registrazione push:', error);
    }
  };
  
  // Helper per convertire VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };
  
  // Gestione click notifica
  const handleNotificationClick = (notification: Notification) => {
    // Marca come letta se non lo è
    if (!notification.readAt) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Se ha action URL, naviga
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    } else {
      // Altrimenti mostra dettagli
      setSelectedNotification(notification);
    }
  };
  
  // Icona per tipo di canale
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'EMAIL': return <Mail className="h-4 w-4" />;
      case 'SMS': return <Phone className="h-4 w-4" />;
      case 'WHATSAPP': return <MessageSquare className="h-4 w-4" />;
      case 'PUSH': return <Send className="h-4 w-4" />;
      case 'WEBSOCKET': return <Wifi className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };
  
  // Colore priorità
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      case 'URGENT': return 'text-orange-600 bg-orange-100';
      case 'HIGH': return 'text-yellow-600 bg-yellow-100';
      case 'MEDIUM': return 'text-blue-600 bg-blue-100';
      case 'LOW': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  // Formatta tempo relativo
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'Ora';
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minuto' : 'minuti'} fa`;
    if (hours < 24) return `${hours} ${hours === 1 ? 'ora' : 'ore'} fa`;
    if (days < 7) return `${days} ${days === 1 ? 'giorno' : 'giorni'} fa`;
    
    return date.toLocaleDateString('it-IT', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };
  
  return (
    <div className="relative" ref={notificationRef}>
      {/* Bell Icon con Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {isConnected && (
          <span className="absolute bottom-0 right-0 h-2 w-2 bg-green-400 rounded-full"></span>
        )}
      </button>
      
      {/* Dropdown Panel - Il resto del codice è già nel file precedente */}
    </div>
  );
};

export default NotificationCenter;
