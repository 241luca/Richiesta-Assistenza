import React from 'react';

export default function SystemSettingsTestPage() {
  console.log('🔍 SystemSettingsTestPage rendered!');

  const handleButtonClick = () => {
    console.log('🔥 Button clicked!');
    alert('Button funziona!');
  };

  return (
    <div className="p-6">
      <div className="bg-green-100 border border-green-400 rounded-lg p-4 mb-6">
        <h1 className="text-2xl font-bold text-green-800 mb-2">
          🧪 TEST PAGINA SYSTEM SETTINGS
        </h1>
        <p className="text-green-700">
          Se vedi questa pagina, la route funziona correttamente!
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Test Interattività</h2>
        
        <div className="space-y-4">
          <button
            onClick={handleButtonClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            🔥 Test Button Click
          </button>

          <button
            onClick={() => console.log('🚀 Console log test')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md ml-2"
          >
            📝 Test Console Log
          </button>

          <div className="text-sm text-gray-600">
            <p>✅ Se i pulsanti funzionano: problema nel componente originale</p>
            <p>❌ Se i pulsanti non funzionano: problema di routing/JavaScript globale</p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800">Debug Info:</h3>
        <pre className="text-sm mt-2 text-yellow-700">
          URL: {window.location.href}
          {'\n'}Timestamp: {new Date().toISOString()}
        </pre>
      </div>
    </div>
  );
}
