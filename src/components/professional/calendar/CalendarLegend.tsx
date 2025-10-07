import React from 'react';

const statusColors = [
  { status: 'pending', label: 'In attesa', color: '#FFA500' },
  { status: 'confirmed', label: 'Confermato', color: '#4CAF50' },
  { status: 'inProgress', label: 'In corso', color: '#2196F3' },
  { status: 'completed', label: 'Completato', color: '#808080' },
  { status: 'cancelled', label: 'Cancellato', color: '#FF0000' }
];

const categoryColors = [
  { category: 'urgent', label: 'Urgente', color: '#FF1744' },
  { category: 'maintenance', label: 'Manutenzione', color: '#9C27B0' },
  { category: 'consultation', label: 'Consulenza', color: '#00BCD4' },
  { category: 'installation', label: 'Installazione', color: '#FF9800' },
  { category: 'repair', label: 'Riparazione', color: '#4CAF50' }
];

export default function CalendarLegend() {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Legenda</h3>
      
      <div className="space-y-3">
        {/* Stati */}
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-2">Stati Intervento</h4>
          <div className="space-y-1">
            {statusColors.map(({ status, label, color }) => (
              <div key={status} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Categorie */}
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-2">Tipi Intervento</h4>
          <div className="space-y-1">
            {categoryColors.map(({ category, label, color }) => (
              <div key={category} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Indicatori speciali */}
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-2">Indicatori</h4>
          <div className="space-y-1">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2 bg-red-500 animate-pulse" />
              <span className="text-xs text-gray-700">Richiede attenzione</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 border-l-4 border-green-500 mr-2" />
              <span className="text-xs text-gray-700">Cliente confermato</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 border-l-4 border-blue-500 mr-2" />
              <span className="text-xs text-gray-700">Sincronizzato Google</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
