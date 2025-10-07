import React, { useState } from 'react';
import { PriceRangeDisplay } from '../components/quotes/PriceRangeDisplay';
import { usePriceEstimate, usePricingStats } from '../hooks/usePricing';

/**
 * Esempio di utilizzo del Sistema Range Prezzi Indicativi
 * 
 * Questa pagina mostra come integrare il componente PriceRangeDisplay
 * in un form di creazione richiesta o in qualsiasi altra parte dell'app.
 */
const PricingSystemExample: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');

  // Hook per statistiche generali
  const { data: stats, isLoading: statsLoading } = usePricingStats();

  // Esempi di ID categoria/sottocategoria (sostituire con ID reali dal database)
  const exampleCategories = [
    { id: 'cat_idraulica', name: 'Idraulica' },
    { id: 'cat_elettricita', name: 'Elettricità' },
    { id: 'cat_climatizzazione', name: 'Climatizzazione' }
  ];

  const exampleSubcategories = [
    { id: 'sub_riparazione_perdite', name: 'Riparazione perdite', categoryId: 'cat_idraulica' },
    { id: 'sub_installazione_caldaia', name: 'Installazione caldaia', categoryId: 'cat_idraulica' },
    { id: 'sub_impianto_elettrico', name: 'Impianto elettrico', categoryId: 'cat_elettricita' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sistema Range Prezzi Indicativi
        </h1>
        <p className="text-lg text-gray-600">
          Esempio di integrazione del componente PriceRangeDisplay
        </p>
      </div>

      {/* Statistiche Generali */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Statistiche Generali</h2>
        {statsLoading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ) : stats?.data ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Preventivi Totali</p>
              <p className="text-2xl font-bold text-blue-600">{stats.data.totalQuotes}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Prezzo Medio</p>
              <p className="text-2xl font-bold text-green-600">
                €{Math.round(stats.data.averageAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Prezzo Minimo</p>
              <p className="text-lg font-semibold text-gray-700">
                €{Math.round(stats.data.minAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Prezzo Massimo</p>
              <p className="text-lg font-semibold text-gray-700">
                €{Math.round(stats.data.maxAmount)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Nessun dato disponibile</p>
        )}
      </div>

      {/* Selettore Categoria/Sottocategoria */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Test Selettore</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubcategory(''); // Reset sottocategoria
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleziona categoria...</option>
              {exampleCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sottocategoria (opzionale)
            </label>
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              disabled={!selectedCategory}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Seleziona sottocategoria...</option>
              {exampleSubcategories
                .filter(sub => sub.categoryId === selectedCategory)
                .map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))
              }
            </select>
          </div>
        </div>

        {/* Componente Range Prezzi */}
        {selectedCategory && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Range Prezzi Indicativo</h3>
            <PriceRangeDisplay
              categoryId={selectedCategory}
              subcategoryId={selectedSubcategory || undefined}
              className="max-w-2xl"
            />
          </div>
        )}
      </div>

      {/* Esempio di Integrazione in Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Esempio Integrazione in Form</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titolo Richiesta
            </label>
            <input
              type="text"
              placeholder="Es: Riparazione perdita rubinetto cucina"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrizione
            </label>
            <textarea
              rows={3}
              placeholder="Descrivi il problema in dettaglio..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Qui va il componente di range prezzi */}
          {selectedCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stima Costi
              </label>
              <PriceRangeDisplay
                categoryId={selectedCategory}
                subcategoryId={selectedSubcategory || undefined}
              />
            </div>
          )}

          <button
            type="button"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Crea Richiesta
          </button>
        </div>
      </div>

      {/* Codice di Esempio */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Codice di Esempio</h2>
        <pre className="bg-gray-800 text-green-400 p-4 rounded-md overflow-x-auto text-sm">
{`// 1. Importa il componente
import { PriceRangeDisplay } from '../components/quotes/PriceRangeDisplay';

// 2. Usa nel form di creazione richiesta
{selectedCategory && (
  <PriceRangeDisplay 
    categoryId={selectedCategory}
    subcategoryId={selectedSubcategory}
  />
)}

// 3. Con hook personalizzato
import { usePriceEstimate } from '../hooks/usePricing';

const { data, isLoading } = usePriceEstimate(categoryId, subcategoryId);`}
        </pre>
      </div>
    </div>
  );
};

export default PricingSystemExample;
