/**
 * Esempio di utilizzo del sistema Quick Actions
 * Pagina di esempio che mostra come integrare le Quick Actions in diverse situazioni
 * 
 * Data: 04 Ottobre 2025
 * Autore: Claude AI Assistant
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { QuickActions } from '../actions/QuickActions';
import { NotificationWithActions } from '../actions/NotificationWithActions';

// Esempio di dati mock per la demo
const mockQuote = {
  id: 'quote-123',
  status: 'PENDING',
  amount: 15000, // €150.00
  description: 'Riparazione impianto idraulico',
  professional: {
    name: 'Mario Bianchi',
    phone: '+39 333 123 4567'
  }
};

const mockRequest = {
  id: 'request-456',
  status: 'IN_PROGRESS',
  title: 'Riparazione perdita water',
  description: 'Perdita sotto il lavandino della cucina'
};

const mockAppointment = {
  id: 'appointment-789',
  status: 'CONFIRMED',
  datetime: '2025-10-15T10:00:00Z',
  title: 'Intervento riparazione'
};

const mockNotification = {
  id: 'notif-123',
  type: 'quote_received',
  title: 'Nuovo Preventivo Ricevuto',
  message: 'Mario Bianchi ti ha inviato un preventivo di €150.00',
  isRead: false,
  createdAt: new Date().toISOString(),
  data: {
    quoteId: 'quote-123',
    requestId: 'request-456'
  }
};

/**
 * Componente di esempio per l'utilizzo delle Quick Actions
 */
export const QuickActionsExamplePage: React.FC = () => {
  // Handler per completamento azioni
  const handleActionComplete = (action: string, context: string) => {
    console.log(`Action ${action} completed in ${context}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">⚡ Quick Actions System</h1>
        <p className="text-blue-100">
          Esempi di utilizzo del sistema Quick Actions per azioni rapide su preventivi, richieste e appuntamenti.
        </p>
      </div>

      {/* Sezione Preventivo */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          💰 Quick Actions per Preventivo
        </h2>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-gray-900">{mockQuote.description}</h3>
          <p className="text-sm text-gray-600 mt-1">
            Professionista: {mockQuote.professional.name}
          </p>
          <p className="text-lg font-bold text-green-600 mt-2">
            €{(mockQuote.amount / 100).toFixed(2)}
          </p>
          <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
            mockQuote.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
            mockQuote.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {mockQuote.status}
          </span>
        </div>

        <QuickActions
          type="quote"
          itemId={mockQuote.id}
          status={mockQuote.status}
          onActionComplete={(action) => handleActionComplete(action, 'quote')}
        />
      </div>

      {/* Sezione Richiesta */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          📋 Quick Actions per Richiesta
        </h2>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-gray-900">{mockRequest.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{mockRequest.description}</p>
          <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
            mockRequest.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
            mockRequest.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
            mockRequest.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {mockRequest.status}
          </span>
        </div>

        <QuickActions
          type="request"
          itemId={mockRequest.id}
          status={mockRequest.status}
          onActionComplete={(action) => handleActionComplete(action, 'request')}
        />
      </div>

      {/* Sezione Appuntamento */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          📅 Quick Actions per Appuntamento
        </h2>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-gray-900">{mockAppointment.title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            Data: {new Date(mockAppointment.datetime).toLocaleDateString('it-IT', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
            mockAppointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
            mockAppointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
            mockAppointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {mockAppointment.status}
          </span>
        </div>

        <QuickActions
          type="appointment"
          itemId={mockAppointment.id}
          status={mockAppointment.status}
          onActionComplete={(action) => handleActionComplete(action, 'appointment')}
        />
      </div>

      {/* Sezione Notifica con Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          🔔 Notifica con Quick Actions
        </h2>
        
        <p className="text-gray-600 mb-4">
          Esempio di come appaiono le Quick Actions nelle notifiche del centro notifiche:
        </p>

        <NotificationWithActions
          notification={mockNotification}
          onMarkAsRead={(id) => console.log(`Mark as read: ${id}`)}
          onActionComplete={(action) => handleActionComplete(action, 'notification')}
          showActions={true}
        />
      </div>

      {/* Sezione Configurazione */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          ⚙️ Configurazione e Personalizzazione
        </h2>
        
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">📋 Tipi di Quick Actions Supportati</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>Quote:</strong> Accetta, Rifiuta, Negozia, Visualizza</li>
              <li><strong>Request:</strong> Chat, Chiama, Modifica, Annulla</li>
              <li><strong>Appointment:</strong> Conferma, Cambia Data, Posticipa, Cancella</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">🎨 Personalizzazione</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Colori automatici basati sul tipo di azione</li>
              <li>• Conferme per azioni distruttive</li>
              <li>• Loading state durante esecuzione</li>
              <li>• Toast feedback immediato</li>
              <li>• Disabilitazione automatica basata sullo stato</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">⚡ Integrazione</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• React Query per gestione stato</li>
              <li>• Heroicons per icone coerenti</li>
              <li>• Tailwind CSS per styling</li>
              <li>• WebSocket per aggiornamenti real-time</li>
              <li>• Cache invalidation automatica</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sezione Codice di Esempio */}
      <div className="bg-gray-900 text-green-400 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">
          💻 Esempio di Utilizzo nel Codice
        </h2>
        
        <pre className="text-sm overflow-x-auto">
{`import { QuickActions } from '@/components/actions/QuickActions';

// Utilizzo base
<QuickActions
  type="quote"
  itemId="quote-123"
  status="PENDING"
  onActionComplete={(action) => {
    console.log(\`Action \${action} completed!\`);
    // Refresh dei dati, notifiche, ecc.
  }}
/>

// Con styling custom
<QuickActions
  type="request"
  itemId="request-456"
  className="justify-center mt-4"
  onActionComplete={handleActionComplete}
/>`}
        </pre>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 text-sm">
        <p>
          Sistema Quick Actions v2.0 - Integrato con React Query, Heroicons e Tailwind CSS
        </p>
        <p className="mt-1">
          Per maggiori informazioni, consultare la documentazione del progetto.
        </p>
      </div>
    </div>
  );
};

export default QuickActionsExamplePage;