import React from 'react';
import { CheckCircleIcon, ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function PendingApprovalPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Icona animata */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <ClockIcon className="h-20 w-20 text-blue-600 animate-pulse" />
              <CheckCircleIcon className="h-8 w-8 text-green-500 absolute -bottom-1 -right-1" />
            </div>
          </div>

          {/* Titolo */}
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
            Registrazione Completata!
          </h1>

          {/* Messaggio */}
          <div className="space-y-4 text-center">
            <p className="text-gray-600">
              La tua richiesta di registrazione è stata ricevuta con successo.
            </p>

            <div className="bg-blue-50 rounded-lg p-4">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-800 font-medium">
                Il tuo profilo è in attesa di approvazione
              </p>
            </div>

            <p className="text-sm text-gray-500">
              Un amministratore verificherà i tuoi dati e documenti entro <strong>24-48 ore</strong>.
            </p>

            <p className="text-sm text-gray-500">
              Riceverai una email di conferma all'indirizzo che hai fornito quando il tuo account sarà attivato.
            </p>
          </div>

          {/* Cosa succede dopo */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">
              Cosa succede ora?
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Verifica documenti e dati forniti</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Controllo requisiti professionali</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Attivazione account e invio credenziali</span>
              </li>
            </ul>
          </div>

          {/* Azioni */}
          <div className="mt-8 space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Vai al Login
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Torna alla Home
            </button>
          </div>

          {/* Footer */}
          <p className="mt-6 text-xs text-center text-gray-500">
            Hai domande? Contatta il supporto a{' '}
            <a href="mailto:support@assistenza.it" className="text-blue-600 hover:underline">
              support@assistenza.it
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
