import React from 'react';
import { 
  BellIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { QuickActions } from './QuickActions';

interface NotificationWithActionsProps {
  notification: {
    id: string;
    title: string;
    message: string;
    type: 'quote_received' | 'request_update' | 'appointment_reminder' | 'system' | 'info';
    createdAt: string;
    isRead: boolean;
    data?: {
      quoteId?: string;
      requestId?: string;
      appointmentId?: string;
      [key: string]: any;
    };
  };
  onMarkAsRead: (id: string) => void;
  onActionComplete?: (action: string) => void;
  showActions?: boolean;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'quote_received':
      return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
    case 'request_update':
      return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
    case 'appointment_reminder':
      return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
    case 'system':
      return <BellIcon className="h-6 w-6 text-purple-500" />;
    default:
      return <InformationCircleIcon className="h-6 w-6 text-gray-500" />;
  }
};

const getQuickActionType = (notificationType: string) => {
  switch (notificationType) {
    case 'quote_received':
      return 'quote';
    case 'request_update':
      return 'request';
    case 'appointment_reminder':
      return 'appointment';
    default:
      return null;
  }
};

export const NotificationWithActions: React.FC<NotificationWithActionsProps> = ({
  notification,
  onMarkAsRead,
  onActionComplete,
  showActions = true
}) => {
  const quickActionType = getQuickActionType(notification.type);
  const itemId = notification.data?.quoteId || 
                notification.data?.requestId || 
                notification.data?.appointmentId;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ora';
    if (diffInMinutes < 60) return `${diffInMinutes} min fa`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} h fa`;
    return date.toLocaleDateString('it-IT', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleActionComplete = (action: string) => {
    // Marca automaticamente la notifica come letta quando si fa un'azione
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    onActionComplete?.(action);
  };

  return (
    <div className={`
      bg-white rounded-lg shadow-md p-4 mb-3 border-l-4 transition-all hover:shadow-lg
      ${notification.isRead 
        ? 'border-gray-300 bg-gray-50' 
        : 'border-blue-500 bg-white'
      }
    `}>
      {/* Header della notifica */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h4 className={`font-semibold ${
              notification.isRead ? 'text-gray-700' : 'text-gray-900'
            }`}>
              {notification.title}
            </h4>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {formatTime(notification.createdAt)}
              </span>
              
              {!notification.isRead && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Segna come letta"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
          <p className={`text-sm mt-1 ${
            notification.isRead ? 'text-gray-600' : 'text-gray-700'
          }`}>
            {notification.message}
          </p>
          
          {/* Badge tipo notifica */}
          <div className="mt-2">
            <span className={`
              inline-block px-2 py-1 text-xs rounded-full font-medium
              ${notification.type === 'quote_received' ? 'bg-green-100 text-green-800' : ''}
              ${notification.type === 'request_update' ? 'bg-blue-100 text-blue-800' : ''}
              ${notification.type === 'appointment_reminder' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${notification.type === 'system' ? 'bg-purple-100 text-purple-800' : ''}
              ${notification.type === 'info' ? 'bg-gray-100 text-gray-800' : ''}
            `}>
              {notification.type === 'quote_received' && 'Preventivo'}
              {notification.type === 'request_update' && 'Richiesta'}
              {notification.type === 'appointment_reminder' && 'Appuntamento'}
              {notification.type === 'system' && 'Sistema'}
              {notification.type === 'info' && 'Info'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      {showActions && quickActionType && itemId && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <QuickActions
            type={quickActionType as 'quote' | 'request' | 'appointment'}
            itemId={itemId}
            onActionComplete={handleActionComplete}
            className="justify-start"
          />
        </div>
      )}
    </div>
  );
};

export default NotificationWithActions;