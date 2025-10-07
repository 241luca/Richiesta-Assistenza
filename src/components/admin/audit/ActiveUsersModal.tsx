// src/components/admin/audit/ActiveUsersModal.tsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  XMarkIcon,
  UserIcon,
  ClockIcon,
  ArrowPathIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { api } from '../../../services/api';

interface ActiveUser {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  lastLogin: string;
  loginCount: number;
  ipAddress: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser?: (userId: string) => void;
}

export default function ActiveUsersModal({ isOpen, onClose, onSelectUser }: Props) {
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(7);
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      fetchActiveUsers();
    }
  }, [isOpen, days]);

  const fetchActiveUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/audit/active-users', {
        params: { days }
      });
      setUsers(response.data?.data?.users || []);
    } catch (error) {
      console.error('Error fetching active users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'SUPER_ADMIN': 'Super Admin',
      'ADMIN': 'Amministratore', 
      'PROFESSIONAL': 'Professionista',
      'CLIENT': 'Cliente'
    };
    return labels[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'PROFESSIONAL':
        return 'bg-blue-100 text-blue-800';
      case 'CLIENT':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = roleFilter === 'all' 
    ? users 
    : users.filter(u => u.role === roleFilter);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block w-full max-w-4xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <UserIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                Utenti Attivi nel Sistema
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mr-2">
                  Periodo:
                </label>
                <select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value={1}>Ultime 24 ore</option>
                  <option value={7}>Ultimi 7 giorni</option>
                  <option value={30}>Ultimi 30 giorni</option>
                  <option value={90}>Ultimi 3 mesi</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mr-2">
                  Ruolo:
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">Tutti</option>
                  <option value="CLIENT">Clienti</option>
                  <option value="PROFESSIONAL">Professionisti</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
            </div>

            <button
              onClick={fetchActiveUsers}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Aggiorna
            </button>
          </div>

          {/* Users List */}
          <div className="mt-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nessun utente attivo nel periodo selezionato
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      if (onSelectUser) {
                        onSelectUser(user.userId);
                        onClose();
                      }
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-500" />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.fullName || 'Nome non disponibile'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </div>

                      <div className="text-sm text-gray-500">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {format(new Date(user.lastLogin), 'dd/MM HH:mm', { locale: it })}
                        </div>
                        <div className="text-xs">
                          {user.loginCount} login
                        </div>
                      </div>

                      <div className="text-xs text-gray-400">
                        IP: {user.ipAddress}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {!loading && filteredUsers.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{filteredUsers.length}</strong> utenti attivi negli ultimi <strong>{days}</strong> giorni
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
