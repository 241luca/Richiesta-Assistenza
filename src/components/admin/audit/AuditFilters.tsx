// src/components/admin/audit/AuditFilters.tsx
import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import ActiveUsersModal from './ActiveUsersModal';

interface Props {
  filters: any;
  onFiltersChange: (filters: any) => void;
}

export default function AuditFilters({ filters, onFiltersChange }: Props) {
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState<string>('');

  const handleChange = (field: string, value: any) => {
    onFiltersChange({
      ...filters,
      [field]: value,
      offset: 0 // Reset pagination quando cambiano i filtri
    });
  };

  const handleReset = () => {
    onFiltersChange({
      limit: 50,
      offset: 0
    });
    setSelectedUserName('');
  };

  const handleSelectUser = (userId: string) => {
    handleChange('userId', userId);
    // Per ora mostriamo solo l'ID, idealmente dovremmo recuperare il nome
    setSelectedUserName(`Utente selezionato`);
  };

  const handleClearUser = () => {
    handleChange('userId', undefined);
    setSelectedUserName('');
  };

  return (
    <>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2 text-gray-500" />
            Filtri di Ricerca
          </h3>
          <button
            onClick={handleReset}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Resetta Filtri
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Azione */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Azione
            </label>
            <select
              value={filters.action || ''}
              onChange={(e) => handleChange('action', e.target.value || undefined)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Tutte</option>
              <option value="LOGIN_SUCCESS">Login</option>
              <option value="LOGIN_FAILED">Login Fallito</option>
              <option value="LOGOUT">Logout</option>
              <option value="CREATE">Creazione</option>
              <option value="UPDATE">Modifica</option>
              <option value="DELETE">Eliminazione</option>
              <option value="READ">Lettura</option>
              <option value="REQUEST_CREATED">Richiesta Creata</option>
              <option value="QUOTE_SENT">Preventivo Inviato</option>
              <option value="PAYMENT_PROCESSED">Pagamento</option>
            </select>
          </div>

          {/* Tipo Entità */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo Entità
            </label>
            <select
              value={filters.entityType || ''}
              onChange={(e) => handleChange('entityType', e.target.value || undefined)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Tutte</option>
              <option value="User">Utente</option>
              <option value="AssistanceRequest">Richiesta</option>
              <option value="Quote">Preventivo</option>
              <option value="Payment">Pagamento</option>
              <option value="InterventionReport">Rapporto</option>
              <option value="Authentication">Autenticazione</option>
              <option value="Notification">Notifica</option>
              <option value="Category">Categoria</option>
              <option value="System">Sistema</option>
              <option value="Script">Script</option>
              <option value="Backup">Backup</option>
            </select>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <select
              value={filters.category || ''}
              onChange={(e) => handleChange('category', e.target.value || undefined)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Tutte</option>
              <option value="SECURITY">Sicurezza</option>
              <option value="BUSINESS">Business</option>
              <option value="SYSTEM">Sistema</option>
              <option value="COMPLIANCE">Compliance</option>
              <option value="API">API</option>
              <option value="USER_ACTIVITY">Attività Utente</option>
            </select>
          </div>

          {/* Severità */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severità
            </label>
            <select
              value={filters.severity || ''}
              onChange={(e) => handleChange('severity', e.target.value || undefined)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Tutte</option>
              <option value="DEBUG">Debug</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          {/* Risultato */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Risultato
            </label>
            <select
              value={filters.success === undefined ? '' : filters.success.toString()}
              onChange={(e) => handleChange('success', e.target.value ? e.target.value === 'true' : undefined)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Tutti</option>
              <option value="true">Successo</option>
              <option value="false">Fallito</option>
            </select>
          </div>

          {/* Utente - Nuovo con Modal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Utente Specifico
            </label>
            {filters.userId ? (
              <div className="flex items-center">
                <div className="flex-1 px-3 py-2 bg-blue-50 rounded-l-md text-sm text-blue-700">
                  {selectedUserName || `ID: ${filters.userId.substring(0, 8)}...`}
                </div>
                <button
                  onClick={handleClearUser}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 rounded-r-md"
                  title="Rimuovi filtro utente"
                >
                  <XMarkIcon className="h-5 w-5 text-red-600" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowUserModal(true)}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Seleziona Utente
              </button>
            )}
          </div>

          {/* Data Da */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Da
            </label>
            <input
              type="datetime-local"
              value={filters.fromDate || ''}
              onChange={(e) => handleChange('fromDate', e.target.value || undefined)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          {/* Data A */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data A
            </label>
            <input
              type="datetime-local"
              value={filters.toDate || ''}
              onChange={(e) => handleChange('toDate', e.target.value || undefined)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Filtri attivi */}
        {Object.keys(filters).filter(k => filters[k] && k !== 'limit' && k !== 'offset').length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Filtri attivi:</strong> {Object.keys(filters).filter(k => filters[k] && k !== 'limit' && k !== 'offset').length}
            </p>
          </div>
        )}
      </div>

      {/* Modal Selezione Utente */}
      <ActiveUsersModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        onSelectUser={handleSelectUser}
      />
    </>
  );
}
