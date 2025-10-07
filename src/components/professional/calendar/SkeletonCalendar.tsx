import React from 'react';

/**
 * Skeleton loader per il calendario
 * Mostra un placeholder animato durante il primo caricamento
 */
export default function SkeletonCalendar() {
  return (
    <div className="h-full flex flex-col animate-pulse">
      {/* Header giorni */}
      <div className="grid grid-cols-7 border-b">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="p-4 border-r">
            <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
          </div>
        ))}
      </div>

      {/* Griglia settimana */}
      <div className="flex-1 grid grid-cols-7">
        {[...Array(7)].map((_, dayIndex) => (
          <div key={dayIndex} className="border-r flex flex-col p-2 space-y-2">
            {/* Simula 3-4 eventi casuali per giorno */}
            {[...Array(Math.floor(Math.random() * 3) + 1)].map((_, eventIndex) => (
              <div
                key={eventIndex}
                className="bg-gray-200 rounded p-2"
                style={{
                  height: `${60 + Math.random() * 40}px`,
                  marginTop: `${Math.random() * 20}px`
                }}
              >
                <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Indicatore caricamento */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
          <p className="text-sm text-gray-600">Caricamento calendario...</p>
        </div>
      </div>
    </div>
  );
}
