/**
 * QUICK TEST - Sistema Bozze
 * Pagina di test per verificare che tutto funzioni
 */

import React, { useState } from 'react';
import { useFormDraft } from '../hooks/useFormDraft';
import { DraftBanner, DraftIndicator } from '../components/drafts';

export default function TestDraftSystem() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  
  const [showBanner, setShowBanner] = useState(false);
  const [draft, setDraft] = useState(null);

  // Test del hook useFormDraft
  const { loadDraft, clearDraft, hasDraft, getDraftInfo } = useFormDraft(
    formData,
    'test_form',
    {
      enabled: true,
      debounceMs: 2000,
      maxAge: 1
    }
  );

  // Check per bozza esistente
  React.useEffect(() => {
    if (hasDraft()) {
      const draftData = loadDraft();
      setDraft(draftData);
      setShowBanner(true);
    }
  }, [hasDraft, loadDraft]);

  const handleRestore = () => {
    if (draft) {
      setFormData(draft.data);
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    clearDraft();
    setShowBanner(false);
    setDraft(null);
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">🧪 Test Sistema Bozze</h1>
      
      {/* Draft Banner */}
      {showBanner && draft && getDraftInfo() && (
        <div className="mb-6">
          <DraftBanner
            draftInfo={getDraftInfo()}
            onRestore={handleRestore}
            onDismiss={handleDismiss}
          />
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={handleChange('name')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Il tuo nome..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="tua@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Messaggio
          </label>
          <textarea
            value={formData.message}
            onChange={handleChange('message')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Scrivi il tuo messaggio..."
          />
        </div>
      </div>

      {/* Draft Indicator */}
      <div className="mt-6">
        <DraftIndicator 
          isActive={true}
          lastSaved={getDraftInfo()?.timeAgo}
        />
      </div>

      {/* Test Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">📊 Test Info</h3>
        <p className="text-sm text-gray-600 mb-2">
          <strong>Has Draft:</strong> {hasDraft() ? '✅ Sì' : '❌ No'}
        </p>
        {getDraftInfo() && (
          <p className="text-sm text-gray-600">
            <strong>Draft Info:</strong> {getDraftInfo().fieldsCount} campi, salvato {getDraftInfo().timeAgo}
          </p>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">🧪 Come Testare:</h3>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Scrivi qualcosa nei campi sopra</li>
          <li>2. Aspetta 2 secondi (auto-save)</li>
          <li>3. Ricarica la pagina (F5)</li>
          <li>4. Dovrebbe apparire il banner di ripristino!</li>
        </ol>
      </div>
      
      <div className="mt-4 space-x-2">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          🔄 Ricarica Pagina
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          🗑️ Cancella Bozza
        </button>
      </div>
    </div>
  );
}
