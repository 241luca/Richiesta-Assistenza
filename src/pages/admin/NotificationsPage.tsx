import React from 'react';
import NotificationDashboard from '../../components/notifications/NotificationDashboard';

// Wrapper per la dashboard notifiche nell'admin
export default function AdminNotificationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Sistema Notifiche</h1>
        <p className="mt-2 text-gray-600">
          Gestisci template, eventi, log e monitoraggio delle notifiche del sistema
        </p>
      </div>
      
      {/* Usa il componente NotificationDashboard esistente */}
      <NotificationDashboard />
    </div>
  );
}
