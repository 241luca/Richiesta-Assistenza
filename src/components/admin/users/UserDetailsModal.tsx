import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { api } from '../../../services/api';
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ChartBarIcon,
  BellIcon
} from '@heroicons/react/24/outline';

interface UserDetailsModalProps {
  user: any;
  onClose: () => void;
}

export default function UserDetailsModal({ user, onClose }: UserDetailsModalProps) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    fetchUserDetails();
  }, [user.id]);

  const fetchUserDetails = async () => {
    try {
      const response = await api.get(`/admin/users/${user.id}`);
      setDetails(response.data.data);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const roleLabels: Record<string, string> = {
    CLIENT: 'Cliente',
    PROFESSIONAL: 'Professionista',
    ADMIN: 'Amministratore',
    SUPER_ADMIN: 'Super Admin'
  };

  const roleColors: Record<string, string> = {
    CLIENT: 'bg-blue-100 text-blue-800',
    PROFESSIONAL: 'bg-green-100 text-green-800',
    ADMIN: 'bg-purple-100 text-purple-800',
    SUPER_ADMIN: 'bg-red-100 text-red-800'
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-5 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto">
      <div className="relative my-8 mx-auto p-6 w-full max-w-4xl bg-white rounded-lg shadow-xl">
        {/* Header - Fixed */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
              <UserCircleIcon className="h-10 w-10 text-gray-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{details?.user.fullName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[details?.user.role]}`}>
                  {roleLabels[details?.user.role]}
                </span>
                {details?.user.emailVerified && (
                  <span className="text-xs text-green-600">✓ Email verificata</span>
                )}
                {details?.user.blocked && (
                  <span className="text-xs text-red-600">⚠ Bloccato</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-2"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b mb-4">
          <nav className="flex space-x-8">
            {['info', 'activity', 'history', 'notifications'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'info' && 'Informazioni'}
                {tab === 'activity' && 'Attività'}
                {tab === 'history' && 'Cronologia'}
                {tab === 'notifications' && 'Notifiche'}
              </button>
            ))}
          </nav>
        </div>

        {/* Content - Scrollable */}
        <div className="max-h-[60vh] overflow-y-auto">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Informazioni personali */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Informazioni Personali</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm">{details?.user.email}</span>
                  </div>
                  {details?.user.phone && (
                    <div className="flex items-center">
                      <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-sm">{details?.user.phone}</span>
                    </div>
                  )}
                  {details?.user.address && (
                    <div className="flex items-center">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-sm">
                        {details?.user.address}, {details?.user.city} ({details?.user.province}) {details?.user.postalCode}
                      </span>
                    </div>
                  )}
                  {details?.user.codiceFiscale && (
                    <div className="text-sm">
                      <span className="font-medium">CF:</span> {details?.user.codiceFiscale}
                    </div>
                  )}
                  {details?.user.partitaIva && (
                    <div className="text-sm">
                      <span className="font-medium">P.IVA:</span> {details?.user.partitaIva}
                    </div>
                  )}
                </div>
              </div>

              {/* Statistiche */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Statistiche</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">
                      {details?.stats?.totalRequests || 0}
                    </div>
                    <div className="text-xs text-gray-600">Richieste Totali</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">
                      {details?.stats?.totalQuotes || 0}
                    </div>
                    <div className="text-xs text-gray-600">Preventivi</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600">
                      {details?.stats?.totalPayments || 0}
                    </div>
                    <div className="text-xs text-gray-600">Pagamenti</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-orange-600">
                      {details?.stats?.accountAge || 0}
                    </div>
                    <div className="text-xs text-gray-600">Giorni Registrato</div>
                  </div>
                </div>
              </div>

              {/* Date importanti */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Date Importanti</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Registrazione:</span>
                    <span>{new Date(details?.user.createdAt).toLocaleString('it-IT')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ultimo aggiornamento:</span>
                    <span>{new Date(details?.user.updatedAt).toLocaleString('it-IT')}</span>
                  </div>
                  {details?.user.lastLoginAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Ultimo accesso:</span>
                      <span>{new Date(details?.user.lastLoginAt).toLocaleString('it-IT')}</span>
                    </div>
                  )}
                  {details?.user.emailVerifiedAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Email verificata:</span>
                      <span>{new Date(details?.user.emailVerifiedAt).toLocaleString('it-IT')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-500">Attività Recente</h4>
              {details?.stats?.lastActivity ? (
                <div className="text-sm text-gray-600">
                  Ultima attività: {new Date(details.stats.lastActivity).toLocaleString('it-IT')}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Nessuna attività registrata</div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-500">Cronologia Accessi</h4>
              {details?.loginHistory && details.loginHistory.length > 0 ? (
                <div className="space-y-2">
                  {details.loginHistory.map((login: any, index: number) => (
                    <div key={index} className="bg-gray-50 rounded p-3 text-sm">
                      <div className="flex justify-between">
                        <span className={login.success ? 'text-green-600' : 'text-red-600'}>
                          {login.success ? '✓ Accesso riuscito' : '✗ Accesso fallito'}
                        </span>
                        <span className="text-gray-500">
                          {new Date(login.createdAt).toLocaleString('it-IT')}
                        </span>
                      </div>
                      {login.ipAddress && (
                        <div className="text-xs text-gray-500 mt-1">
                          IP: {login.ipAddress}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Nessun accesso registrato</div>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-500">
                Notifiche Recenti 
                {details?.stats?.unreadNotifications > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {details.stats.unreadNotifications} non lette
                  </span>
                )}
              </h4>
              {details?.recentNotifications && details.recentNotifications.length > 0 ? (
                <div className="space-y-2">
                  {details.recentNotifications.map((notif: any, index: number) => (
                    <div key={index} className={`rounded p-3 text-sm ${notif.isRead ? 'bg-gray-50' : 'bg-blue-50'}`}>
                      <div className="flex justify-between">
                        <span className="font-medium">{notif.title}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(notif.createdAt).toLocaleString('it-IT')}
                        </span>
                      </div>
                      <div className="text-gray-600 mt-1">{notif.content}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Nessuna notifica</div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="mt-6 pt-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}