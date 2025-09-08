/**
 * Notification Badge Component
 * Badge semplice per mostrare il numero di notifiche non lette
 */

import React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';

interface NotificationBadgeProps {
  count: number;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  onClick,
  size = 'md',
  animated = true
}) => {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const badgeSizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-2.5 py-1'
  };

  return (
    <button
      onClick={onClick}
      className="relative inline-flex items-center p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors"
      aria-label={`${count} notifiche non lette`}
    >
      {count > 0 ? (
        <BellAlertIcon className={`${sizeClasses[size]} text-blue-600 ${animated ? 'animate-pulse' : ''}`} />
      ) : (
        <BellIcon className={`${sizeClasses[size]}`} />
      )}
      
      {count > 0 && (
        <span className={`absolute top-0 right-0 inline-flex items-center justify-center ${badgeSizeClasses[size]} font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full`}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
};

export default NotificationBadge;
