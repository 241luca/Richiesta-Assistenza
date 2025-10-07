import React, { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { VerifiedBadge, DetailedVerifiedBadge } from '../badges/VerifiedBadge';
import { CertificationBadges } from '../certifications/CertificationBadges';
import { useProfessionals, useProfessionalsStats } from '../../hooks/useProfessionals';

interface ProfessionalsListProps {
  subcategoryId?: string;
  showFilters?: boolean;
  compact?: boolean;
}

export const ProfessionalsList: React.FC<ProfessionalsListProps> = ({
  subcategoryId,
  showFilters = true,
  compact = false
}) => {
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Query per i professionisti
  const { 
    data: professionalsData, 
    isLoading, 
    error,
    refetch 
  } = useProfessionals({
    verified: showOnlyVerified || undefined,
    search: searchTerm || undefined,
    city: selectedCity || undefined,
    subcategoryId,
    limit: 20
  });

  // Statistiche generali
  const { data: stats } = useProfessionalsStats();

  const professionals = professionalsData?.data || [];
  const meta = professionalsData?.meta || {};

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header con statistiche */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Professionisti Disponibili
            </h3>
            {stats && (
              <p className="mt-1 text-sm text-gray-500">
                {stats.total} totali • {stats.verified} verificati ({stats.verificationRate}%)
              </p>
            )}
          </div>
          
          {meta.total > 0 && (
            <div className="text-sm text-gray-500">
              Mostro {meta.showing} di {meta.total}
            </div>
          )}
        </div>

        {/* Filtri */}
        {showFilters && (
          <div className="mt-4 space-y-4">
            {/* Barra di ricerca */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtri rapidi */}
            <div className="flex items-center space-x-4">
              {/* Toggle Solo Verificati */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyVerified}
                  onChange={(e) => setShowOnlyVerified(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                  <span>Solo Verificati</span>
                  <VerifiedBadge isVerified={true} size="sm" />
                </span>
              </label>

              {/* Filtro città */}
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tutte le città</option>
                <option value="Milano">Milano</option>
                <option value="Roma">Roma</option>
                <option value="Napoli">Napoli</option>
                <option value="Torino">Torino</option>
              </select>

              {/* Pulsante reset filtri */}
              {(showOnlyVerified || searchTerm || selectedCity) && (
                <button
                  onClick={() => {
                    setShowOnlyVerified(false);
                    setSearchTerm('');
                    setSelectedCity('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Reset filtri
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lista professionisti */}
      <div className="divide-y divide-gray-200">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Caricamento professionisti...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-600">Errore nel caricamento</p>
            <button 
              onClick={() => refetch()}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Riprova
            </button>
          </div>
        ) : professionals.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">
              {showOnlyVerified 
                ? 'Nessun professionista verificato trovato' 
                : 'Nessun professionista trovato'
              }
            </p>
          </div>
        ) : (
          professionals.map((professional) => (
            <ProfessionalCard 
              key={professional.id} 
              professional={professional} 
              compact={compact}
            />
          ))
        )}
      </div>

      {/* Footer con paginazione */}
      {meta.hasMore && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Carica altri professionisti
          </button>
        </div>
      )}
    </div>
  );
};

interface ProfessionalCardProps {
  professional: any;
  compact?: boolean;
}

const ProfessionalCard: React.FC<ProfessionalCardProps> = ({ 
  professional, 
  compact = false 
}) => {
  return (
    <div className={`p-6 hover:bg-gray-50 transition-colors ${compact ? 'py-4' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Nome con badge verificato */}
          <div className="flex items-center space-x-2">
            <h4 className="text-lg font-medium text-gray-900">
              {professional.fullName}
            </h4>
            {professional.isVerified && (
              <DetailedVerifiedBadge
                isVerified={professional.isVerified}
                verificationDetails={professional.verificationDetails}
                showDetails={!compact}
              />
            )}
          </div>

          {/* Info base */}
          <div className="mt-1 text-sm text-gray-500 space-y-1">
            {professional.city && professional.province && (
              <p>{professional.city}, {professional.province}</p>
            )}
            {professional.hourlyRate && (
              <p>€{professional.hourlyRate}/ora</p>
            )}
          </div>

          {/* Sottocategorie */}
          {!compact && professional.subcategories?.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-2">
                {professional.subcategories.slice(0, 3).map((sub: any) => (
                  <span
                    key={sub.id}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {sub.name}
                    {sub.experienceYears && (
                      <span className="ml-1 text-blue-600">
                        ({sub.experienceYears}y)
                      </span>
                    )}
                  </span>
                ))}
                {professional.subcategories.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{professional.subcategories.length - 3} altre
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Certificazioni */}
          {!compact && (
            <div className="mt-4">
              <CertificationBadges 
                professionalId={professional.id} 
                showAll={false} 
                maxVisible={2}
              />
            </div>
          )}

          {/* Data verifica */}
          {professional.isVerified && professional.verifiedAt && !compact && (
            <div className="mt-2 text-xs text-gray-400">
              Verificato il {new Date(professional.verifiedAt).toLocaleDateString('it-IT')}
            </div>
          )}
        </div>

        {/* Azioni */}
        <div className="ml-6 flex flex-col space-y-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
            Contatta
          </button>
          <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
            Profilo
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalsList;