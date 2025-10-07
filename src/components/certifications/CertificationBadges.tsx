import React from 'react';
import { 
  AcademicCapIcon,
  CheckBadgeIcon,
  ClockIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { ProfessionalCertification } from '../../services/certifications';
import { useCertifications } from '../../hooks/useCertifications';

interface CertificationBadgesProps {
  professionalId: string;
  showAll?: boolean;
  maxVisible?: number;
}

export const CertificationBadges: React.FC<CertificationBadgesProps> = ({
  professionalId,
  showAll = false,
  maxVisible = 3
}) => {
  const { data: certifications = [], isLoading, error } = useCertifications(professionalId);

  // 🔄 Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <AcademicCapIcon className="h-5 w-5 mr-2 text-blue-600" />
          📜 Certificazioni e Qualifiche
        </h3>
        <div className="animate-pulse space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  // ❌ Error state
  if (error) {
    return (
      <div className="text-center py-4">
        <ExclamationTriangleIcon className="h-8 w-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-600">Errore nel caricamento delle certificazioni</p>
      </div>
    );
  }
  const visibleCertifications = showAll ? certifications : certifications.slice(0, maxVisible);
  const hiddenCount = certifications.length - maxVisible;

  const isExpired = (validUntil?: string | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  const isExpiringSoon = (validUntil?: string | null) => {
    if (!validUntil) return false;
    const expiry = new Date(validUntil);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  if (certifications.length === 0) {
    return (
      <div className="text-center py-4">
        <AcademicCapIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Nessuna certificazione disponibile</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 flex items-center">
        <AcademicCapIcon className="h-5 w-5 mr-2 text-blue-600" />
        📜 Certificazioni e Qualifiche
        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
          {certifications.length}
        </span>
      </h3>
      
      <div className="grid gap-3">
        {visibleCertifications.map(cert => {
          const expired = isExpired(cert.validUntil);
          const expiringSoon = isExpiringSoon(cert.validUntil);
          
          return (
            <div
              key={cert.id}
              className={`
                relative p-4 border rounded-lg transition-all
                ${cert.isVerified && !expired
                  ? 'border-green-200 bg-green-50 hover:bg-green-100'
                  : expired
                  ? 'border-red-200 bg-red-50'
                  : expiringSoon
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-gray-200 bg-gray-50'
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <AcademicCapIcon className={`
                      h-5 w-5 mr-2
                      ${cert.isVerified && !expired
                        ? 'text-green-600'
                        : expired
                        ? 'text-red-600'
                        : expiringSoon
                        ? 'text-yellow-600'
                        : 'text-gray-600'
                      }
                    `} />
                    <h4 className="font-medium text-gray-900 text-sm">
                      {cert.name}
                    </h4>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-1">
                    <span className="font-medium">Rilasciato da:</span> {cert.issuer}
                  </p>
                  
                  {cert.validUntil && (
                    <p className={`
                      text-xs font-medium
                      ${expired
                        ? 'text-red-700'
                        : expiringSoon
                        ? 'text-yellow-700'
                        : 'text-gray-600'
                      }
                    `}>
                      <ClockIcon className="h-3 w-3 inline mr-1" />
                      {expired
                        ? `Scaduta il ${new Date(cert.validUntil).toLocaleDateString('it-IT')}`
                        : `Valida fino al ${new Date(cert.validUntil).toLocaleDateString('it-IT')}`
                      }
                    </p>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Ottenuta il {new Date(cert.createdAt).toLocaleDateString('it-IT')}
                  </p>
                </div>

                <div className="flex flex-col items-end space-y-1">
                  {/* Badge Stato */}
                  {cert.isVerified && !expired ? (
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckBadgeIcon className="h-3 w-3 mr-1" />
                      Verificata
                    </div>
                  ) : expired ? (
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                      Scaduta
                    </div>
                  ) : expiringSoon ? (
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      In scadenza
                    </div>
                  ) : !cert.isVerified ? (
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      In verifica
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mostra contatore certificazioni nascoste */}
      {!showAll && hiddenCount > 0 && (
        <div className="text-center">
          <p className="text-xs text-gray-500">
            + altre {hiddenCount} certificazioni
          </p>
        </div>
      )}

      {/* Riepilogo rapido */}
      {certifications.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <span className="flex items-center text-green-700">
                <CheckBadgeIcon className="h-4 w-4 mr-1" />
                {certifications.filter(c => c.isVerified && !isExpired(c.validUntil)).length} Verificate
              </span>
              
              {certifications.filter(c => isExpiringSoon(c.validUntil)).length > 0 && (
                <span className="flex items-center text-yellow-700">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {certifications.filter(c => isExpiringSoon(c.validUntil)).length} In scadenza
                </span>
              )}
              
              {certifications.filter(c => isExpired(c.validUntil)).length > 0 && (
                <span className="flex items-center text-red-700">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  {certifications.filter(c => isExpired(c.validUntil)).length} Scadute
                </span>
              )}
            </div>
            
            <span className="text-gray-600 font-medium">
              Totale: {certifications.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificationBadges;