/**
 * GeocodingToolPage - Tool Admin per testing Geocoding API
 * Permette agli admin di testare la geocodifica indirizzi
 * ✅ Conforme alle regole del progetto
 */

import React, { useState } from 'react';
import { 
  MapPinIcon, 
  CheckCircleIcon, 
  TrashIcon,
  ArrowPathIcon,
  ChartBarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import AddressGeocoding from '../../components/address/AddressGeocoding';
import toast from 'react-hot-toast';

interface AddressData {
  address: string;
  city: string;
  province: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
}

export default function GeocodingToolPage() {
  const [addressData, setAddressData] = useState<AddressData>({
    address: '',
    city: '',
    province: '',
    postalCode: '',
  });

  const [results, setResults] = useState<AddressData[]>([]);

  const handleAddressChange = (newData: AddressData) => {
    setAddressData(newData);
    
    // Se ha coordinate, aggiungi ai risultati
    if (newData.latitude && newData.longitude) {
      setResults(prev => [...prev, newData]);
    }
  };

  const handleReset = () => {
    setAddressData({
      address: '',
      city: '',
      province: '',
      postalCode: '',
    });
  };

  const handleClearResults = () => {
    setResults([]);
    toast.success('Cronologia cancellata');
  };

  return (
    <>
      {/* Custom scrollbar style */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header con stile migliorato */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="bg-blue-100 rounded-lg p-3">
                    <GlobeAltIcon className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Tool Geocoding
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Strumento amministrativo per testare e verificare la geocodifica degli indirizzi
                  </p>
                </div>
              </div>
              {results.length > 0 && (
                <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                  <ChartBarIcon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {results.length} {results.length === 1 ? 'risultato' : 'risultati'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form di Input - Design migliorato */}
          <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MapPinIcon className="h-6 w-6 text-white" />
                  <h2 className="text-lg font-semibold text-white">
                    Inserisci Indirizzo
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-1.5" />
                  Reset
                </button>
              </div>
            </div>

            <div className="p-6">
              <AddressGeocoding
                value={addressData}
                onChange={handleAddressChange}
              />

              {/* Info Box - Stile migliorato */}
              <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="bg-blue-100 rounded-lg p-2">
                      <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">
                      Come funziona
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1.5">
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">1.</span>
                        <span>Inserisci l'indirizzo completo nei campi</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">2.</span>
                        <span>Il sistema cerca automaticamente suggerimenti</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">3.</span>
                        <span>Clicca "Verifica e Geolocalizza" per le coordinate</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">4.</span>
                        <span>La mappa mostrerà la posizione esatta</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Risultati e Cronologia - Design migliorato */}
          <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                  <h2 className="text-lg font-semibold text-white">
                    Cronologia Geocoding
                  </h2>
                </div>
                {results.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearResults}
                    className="inline-flex items-center px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <TrashIcon className="h-4 w-4 mr-1.5" />
                    Cancella tutto
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">

              {results.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <MapPinIcon className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900">
                    Nessun risultato
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">
                    Geocodifica un indirizzo per vedere i risultati qui
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className="group relative bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-green-300 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="bg-green-100 rounded-lg p-1.5">
                              <CheckCircleIcon className="h-4 w-4 text-green-600" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900">
                              Geocoding #{results.length - index}
                            </h3>
                            <span className="ml-auto text-xs text-gray-400">
                              {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-white rounded-lg p-2 border border-gray-100">
                              <span className="text-xs text-gray-500 block mb-0.5">Via</span>
                              <span className="font-medium text-gray-900 text-xs">{result.address}</span>
                            </div>
                            <div className="bg-white rounded-lg p-2 border border-gray-100">
                              <span className="text-xs text-gray-500 block mb-0.5">Città</span>
                              <span className="font-medium text-gray-900 text-xs">{result.city}</span>
                            </div>
                            <div className="bg-white rounded-lg p-2 border border-gray-100">
                              <span className="text-xs text-gray-500 block mb-0.5">Provincia</span>
                              <span className="font-medium text-gray-900 text-xs">{result.province}</span>
                            </div>
                            <div className="bg-white rounded-lg p-2 border border-gray-100">
                              <span className="text-xs text-gray-500 block mb-0.5">CAP</span>
                              <span className="font-medium text-gray-900 text-xs">{result.postalCode}</span>
                            </div>
                          </div>

                          {result.latitude && result.longitude && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="bg-blue-50 rounded-lg p-2 mb-2">
                                <p className="text-xs text-blue-800 font-mono flex items-center">
                                  <MapPinIcon className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                                  {result.latitude.toFixed(6)}, {result.longitude.toFixed(6)}
                                </p>
                              </div>
                              <a
                                href={`https://www.google.com/maps?q=${result.latitude},${result.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                              >
                                <GlobeAltIcon className="h-3.5 w-3.5 mr-1" />
                                Apri in Google Maps →
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Box - Design migliorato */}
        {results.length > 0 && (
          <div className="mt-6 bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
              <div className="flex items-center space-x-3">
                <ChartBarIcon className="h-6 w-6 text-white" />
                <h2 className="text-lg font-semibold text-white">
                  Statistiche Sessione
                </h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-blue-700 font-semibold">Totale Geocodifiche</p>
                    <div className="bg-blue-200 rounded-lg p-2">
                      <MapPinIcon className="h-5 w-5 text-blue-700" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-blue-900">{results.length}</p>
                  <p className="text-xs text-blue-600 mt-1">Richieste totali</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-green-700 font-semibold">Con Successo</p>
                    <div className="bg-green-200 rounded-lg p-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-700" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-green-900">
                    {results.filter(r => r.latitude && r.longitude).length}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {((results.filter(r => r.latitude && r.longitude).length / results.length) * 100).toFixed(0)}% successo
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-purple-700 font-semibold">Ultimo Indirizzo</p>
                    <div className="bg-purple-200 rounded-lg p-2">
                      <GlobeAltIcon className="h-5 w-5 text-purple-700" />
                    </div>
                  </div>
                  <p className="text-lg font-bold text-purple-900 truncate">
                    {results[results.length - 1]?.city || 'N/A'}
                  </p>
                  <p className="text-xs text-purple-600 mt-1 truncate">
                    {results[results.length - 1]?.address || 'Nessun indirizzo'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
