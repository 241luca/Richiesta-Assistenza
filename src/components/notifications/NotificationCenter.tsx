/**
 * Notification Center Component
 * Centro notifiche con dropdown e gestione real-time + Quick Actions
 * 
 * AGGIORNATO v2.0 - Integrazione Quick Actions System
 * Data: 04 Ottobre 2025
 */

import React, { useState, useEffect, useRef } from 'react';
import { BellIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';
import { useSocket } from '../../contexts/SocketContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { NotificationWithActions } from '../actions/NotificationWithActions';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  data?: {
    quoteId?: string;
    requestId?: string;
    appointmentId?: string;
    [key: string]: any;
  };
  createdAt: string;
  readAt?: string;
}

export const NotificationCenter: React.FC = () => {
  const { socket, on, off, emit } = useSocket();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Query per recuperare le notifiche
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      const response = await api.get('/notifications/unread');
      return response.data?.data || [];
    },
    refetchInterval: 60000 // Refresh ogni minuto
  });

  // Mutation per segnare come letta
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.post(`/notifications/${notificationId}/read`);
      emit('notification:markAsRead', notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Mutation per segnare tutte come lette
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.post('/notifications/read-all');
      emit('notification:markAllAsRead');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setUnreadCount(0);
      toast.success('Tutte le notifiche sono state segnate come lette');
    }
  });

  // Mutation per eliminare una notifica
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.delete(`/notifications/${notificationId}`);
      emit('notification:delete', notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notifica eliminata');
    }
  });

  // Effetto per gestire il click fuori dal dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Effetto per gestire gli eventi WebSocket
  useEffect(() => {
    if (!socket) return;

    // Handler per nuove notifiche
    const handleNewNotification = (notification: Notification) => {
      console.log('📬 New notification:', notification);
      
      // Aggiorna la cache di React Query
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      // Mostra toast basato sulla priorità
      const toastOptions: any = { duration: 5000 };
      const message = `${notification.title}: ${notification.message}`;
      
      switch (notification.priority) {
        case 'urgent':
          toast.error(message, { ...toastOptions, icon: '🚨' });
          playNotificationSound();
          break;
        case 'high':
          toast.success(message, { ...toastOptions, icon: '⚠️' });
          playNotificationSound();
          break;
        case 'normal':
          toast.success(message, toastOptions);
          break;
        default:
          toast(message, toastOptions);
      }

      // Incrementa il contatore
      setUnreadCount(prev => prev + 1);
    };

    // Handler per aggiornamento contatore
    const handleUnreadCount = (data: { count: number }) => {
      setUnreadCount(data.count);
    };

    // Handler per notifica segnata come letta
    const handleNotificationMarked = (data: { id: string; isRead: boolean }) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (data.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    };

    // Registra gli event listener
    on('notification:new', handleNewNotification);
    on('notification:unreadCount', handleUnreadCount);
    on('notification:marked', handleNotificationMarked);

    // Richiedi il contatore iniziale
    emit('notification:getUnread');

    // Cleanup
    return () => {
      off('notification:new', handleNewNotification);
      off('notification:unreadCount', handleUnreadCount);
      off('notification:marked', handleNotificationMarked);
    };
  }, [socket, on, off, emit, queryClient]);

  // Aggiorna il contatore quando cambiano le notifiche
  useEffect(() => {
    const unread = (notifications || []).filter((n: Notification) => !n.isRead).length;
    setUnreadCount(unread);
  }, [notifications]);

  // Funzione per riprodurre il suono di notifica
  const playNotificationSound = () => {
    try {
      // Crea un suono semplice usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  // Handler per azioni completate nelle Quick Actions
  const handleActionComplete = (action: string) => {
    console.log(`Quick action completed: ${action}`);
    
    // Messaggi di feedback specifici
    const actionMessages = {
      accept: 'Preventivo accettato! ✅',
      reject: 'Preventivo rifiutato',
      negotiate: 'Chat aperta per negoziazione 💬',
      chat: 'Chat aperta 💬',
      call: 'Chiamata avviata 📞',
      edit: 'Modifica in corso ✏️',
      cancel: 'Operazione annullata',
      confirm: 'Appuntamento confermato! ✅',
      reschedule: 'Riprogrammazione in corso 📅',
      postpone: 'Appuntamento posticipato'
    };

    const message = actionMessages[action as keyof typeof actionMessages] || 
                   `Azione "${action}" completata!`;
    
    toast.success(message);
    
    // Aggiorna le notifiche dopo un'azione
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  // Handler per segnare notifica come letta
  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  // Determina se una notifica può avere Quick Actions
  const hasQuickActions = (notification: Notification) => {
    const actionTypes = ['quote_received', 'request_update', 'appointment_reminder'];
    return actionTypes.includes(notification.type) && 
           (notification.data?.quoteId || notification.data?.requestId || notification.data?.appointmentId);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors"
        aria-label="Notifiche"
      >
        {unreadCount > 0 ? (
          <BellAlertIcon className="h-6 w-6 text-blue-600 animate-pulse" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        
        {/* Badge contatore */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[450px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[700px] overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifiche {unreadCount > 0 && `(${unreadCount})`}
            </h3>
            
            <div className="flex items-center gap-2">
              {/* Toggle Quick Actions */}
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  showQuickActions 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}
                title="Attiva/Disattiva Quick Actions"
              >
                ⚡ Quick Actions
              </button>
              
              {/* Mark all as read */}
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsReadMutation.mutate()}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  disabled={markAllAsReadMutation.isPending}
                >
                  <CheckIcon className="h-4 w-4" />
                  Segna tutte
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[580px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Caricamento...</p>
              </div>
            ) : (notifications || []).length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Nessuna notifica</p>
                <p className="text-xs text-gray-400 mt-1">
                  Le nuove notifiche appariranno qui
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {(notifications || []).map((notification: Notification) => (
                  hasQuickActions(notification) && showQuickActions ? (
                    // Notifica con Quick Actions
                    <NotificationWithActions
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onActionComplete={handleActionComplete}
                      showActions={showQuickActions}
                    />
                  ) : (
                    // Notifica semplice (senza Quick Actions)
                    <div
                      key={notification.id}
                      className={`bg-white rounded-lg shadow-sm p-3 border transition-all hover:shadow-md ${
                        !notification.isRead 
                          ? 'border-blue-200 bg-blue-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                          notification.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                          notification.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                          notification.priority === 'normal' ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {notification.type === 'quote_received' && '💰'}
                          {notification.type === 'request_update' && '📋'}
                          {notification.type === 'appointment_reminder' && '📅'}
                          {notification.type === 'system' && '⚙️'}
                          {!['quote_received', 'request_update', 'appointment_reminder', 'system'].includes(notification.type) && '📬'}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'} text-gray-900 mb-1`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDistanceToNow(new Date(notification.createdAt), { 
                                  addSuffix: true,
                                  locale: it 
                                })}
                              </p>
                            </div>

                            {/* Delete button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotificationMutation.mutate(notification.id);
                              }}
                              className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                              aria-label="Elimina notifica"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                          
                          {/* Mark as read button for unread */}
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                            >
                              Segna come letta
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {(notifications || []).length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <a
                href="/notifications"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Vedi tutte le notifiche →
              </a>
              
              {showQuickActions && (
                <span className="text-xs text-gray-500">
                  ⚡ Quick Actions attive
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;