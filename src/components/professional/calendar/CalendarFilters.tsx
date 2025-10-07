import React from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface CalendarFiltersProps {
  filters: {
    status: string;
    category: string;
    search: string;
  };
  onFiltersChange: (filters: any) => void;
}

export default function CalendarFilters({ filters, onFiltersChange }: CalendarFiltersProps) {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="mt-4 flex items-center space-x-4">
      {/* Ricerca */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Cerca per cliente, indirizzo..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Filtro stato */}
      <div>
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tutti gli stati</option>
          <option value="pending">In attesa</option>
          <option value="confirmed">Confermati</option>
          <option value="inProgress">In corso</option>
          <option value="completed">Completati</option>
          <option value="cancelled">Cancellati</option>
        </select>
      </div>

      {/* Filtro categoria */}
      <div>
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tutte le categorie</option>
          <option value="urgent">Urgenti</option>
          <option value="maintenance">Manutenzione</option>
          <option value="consultation">Consulenza</option>
          <option value="installation">Installazione</option>
          <option value="repair">Riparazione</option>
        </select>
      </div>

      {/* Reset filtri */}
      <button
        onClick={() => onFiltersChange({ status: 'all', category: 'all', search: '' })}
        className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <FunnelIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
