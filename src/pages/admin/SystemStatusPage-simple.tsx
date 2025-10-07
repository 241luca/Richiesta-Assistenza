import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const SystemStatusPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    console.log('SystemStatusPage montato!');
    console.log('User:', user);
    
    // Previeni qualsiasi redirect
    return () => {
      console.log('SystemStatusPage smontato!');
    };
  }, [user]);
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-green-600">
          ✅ SYSTEM STATUS PAGE CARICATA!
        </h1>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h2 className="font-bold text-lg mb-2">Stato:</h2>
            <p className="text-green-600 font-semibold">✓ Pagina funzionante!</p>
            <p className="text-sm text-gray-600 mt-2">Se vedi questo, il routing funziona correttamente</p>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded p-4">
            <h2 className="font-bold text-lg mb-2">User Info:</h2>
            <pre className="text-xs bg-white p-3 rounded border overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
          
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              ← Torna all'Admin
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              🔄 Ricarica
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusPage;
