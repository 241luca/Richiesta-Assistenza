import React from 'react';
import { CertificationBadges } from '../components/certifications/CertificationBadges';

/**
 * 🧪 Pagina di test per le certificazioni
 * Mostra come usare il componente CertificationBadges
 */
const TestCertificationsPage: React.FC = () => {
  // 🔧 ID di un professionista di esempio
  // Cambia questo con un ID reale dal tuo database
  const professionalId = 'esempio-professional-id';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          🧪 Test Sistema Certificazioni
        </h1>
        <p className="mt-2 text-gray-600">
          Prova il componente dei badge certificazioni
        </p>
      </div>

      {/* Test con professionista reale */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Certificazioni Professionista
        </h2>
        <CertificationBadges 
          professionalId={professionalId}
          showAll={false}
          maxVisible={3}
        />
      </div>

      {/* Test con tutte le certificazioni */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Tutte le Certificazioni (showAll=true)
        </h2>
        <CertificationBadges 
          professionalId={professionalId}
          showAll={true}
        />
      </div>

      {/* Istruzioni */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          📋 Come testare:
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>Cambia <code className="bg-blue-100 px-2 py-1 rounded">professionalId</code> con un ID reale</li>
          <li>Assicurati che il professionista abbia delle certificazioni nel database</li>
          <li>Se non ci sono certificazioni, creane alcune tramite l'API</li>
          <li>Ricarica la pagina per vedere il risultato</li>
        </ol>
      </div>

      {/* API Test */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          🔧 Comandi API per test:
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Crea certificazione di test:</p>
            <code className="block bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-x-auto">
              {`POST /api/professionals/${professionalId}/certifications
{
  "name": "Certificazione Tecnico Idraulico",
  "issuer": "Camera di Commercio Milano",
  "validUntil": "2025-12-31",
  "isVerified": true
}`}
            </code>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Ottieni certificazioni:</p>
            <code className="block bg-gray-800 text-gray-100 p-3 rounded text-xs">
              {`GET /api/professionals/${professionalId}/certifications`}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCertificationsPage;