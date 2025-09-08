/**
 * useNotifications Hook
 * Hook personalizzato per gestire le notifiche
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../contexts/SocketContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  data?: any;
  createdAt: string;
  readAt?: string;
}

interface UseNotificationsOptions {
  autoRefetch?: boolean;
  refetchInterval?: number;
  playSound?: boolean;
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const {
    autoRefetch = true,
    refetchInterval = 60000,
    playSound = true
  } = options;

  const { socket, on, off, emit, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  // Query per recuperare le notifiche
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/api/notifications');
      return response.data;
    },
    refetchInterval: autoRefetch ? refetchInterval : false
  });

  // Query per recuperare solo le non lette
  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const response = await api.get('/api/notifications/unread');
      return response.data;
    },
    refetchInterval: autoRefetch ? refetchInterval : false
  });

  // Mutation per segnare come letta
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.post(`/api/notifications/${notificationId}/read`);
      if (isConnected) {
        emit('notification:markAsRead', notificationId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.error('Error marking notification as read:', error);
      toast.error('Errore nel segnare la notifica come letta');
    }
  });

  // Mutation per segnare tutte come lette
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      await api.post('/api/notifications/read-all');
      if (isConnected) {
        emit('notification:markAllAsRead');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setUnreadCount(0);
      toast.success('Tutte le notifiche sono state segnate come lette');
    },
    onError: (error) => {
      console.error('Error marking all notifications as read:', error);
      toast.error('Errore nel segnare tutte le notifiche come lette');
    }
  });

  // Mutation per eliminare una notifica
  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.delete(`/api/notifications/${notificationId}`);
      if (isConnected) {
        emit('notification:delete', notificationId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notifica eliminata');
    },
    onError: (error) => {
      console.error('Error deleting notification:', error);
      toast.error('Errore nell\'eliminare la notifica');
    }
  });

  // Mutation per aggiornare le preferenze
  const updatePreferences = useMutation({
    mutationFn: async (preferences: any) => {
      const response = await api.put('/api/notifications/preferences', preferences);
      if (isConnected) {
        emit('notification:updatePreferences', preferences);
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('Preferenze notifiche aggiornate');
    },
    onError: (error) => {
      console.error('Error updating preferences:', error);
      toast.error('Errore nell\'aggiornare le preferenze');
    }
  });

  // Funzione per riprodurre il suono
  const playNotificationSound = useCallback(() => {
    if (!playSound) return;
    
    try {
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
  }, [playSound]);

  // Effetto per gestire gli eventi WebSocket
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewNotification = (notification: Notification) => {
      console.log('📬 New notification received:', notification);
      
      // Invalida le query per forzare il refresh
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      // Mostra toast basato sulla priorità
      const message = `${notification.title}: ${notification.message}`;
      const toastOptions = { duration: 5000 };
      
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
          if (playSound) playNotificationSound();
          break;
        default:
          toast(message, toastOptions);
      }
      
      setUnreadCount(prev => prev + 1);
    };

    const handleUnreadCount = (data: { count: number }) => {
      setUnreadCount(data.count);
    };

    const handleNotificationMarked = (data: { id: string; isRead: boolean }) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (data.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    };

    const handleNotificationDeleted = (data: { id: string }) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    // Registra gli event listener
    on('notification:new', handleNewNotification);
    on('notification:unreadCount', handleUnreadCount);
    on('notification:marked', handleNotificationMarked);
    on('notification:deleted', handleNotificationDeleted);

    // Richiedi il contatore iniziale
    emit('notification:getUnread');

    // Cleanup
    return () => {
      off('notification:new');
      off('notification:unreadCount');
      off('notification:marked');
      off('notification:deleted');
    };
  }, [socket, isConnected, on, off, emit, queryClient, playNotificationSound, playSound]);

  // Aggiorna il contatore quando cambiano le notifiche
  useEffect(() => {
    const count = unreadNotifications.length;
    setUnreadCount(count);
  }, [unreadNotifications]);

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    isLoading,
    error,
    refetch,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteNotification: deleteNotification.mutate,
    updatePreferences: updatePreferences.mutate,
    isMarkingAsRead: markAsRead.isPending,
    isMarkingAllAsRead: markAllAsRead.isPending,
    isDeleting: deleteNotification.isPending,
    isUpdatingPreferences: updatePreferences.isPending
  };
};

export default useNotifications;
