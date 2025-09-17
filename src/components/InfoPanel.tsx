import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { 
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  HeartIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { useSystemSettingsMap } from '@/hooks/useSystemSettings';

interface InfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InfoPanel({ isOpen, onClose }: InfoPanelProps) {
  const { settings, isLoading } = useSystemSettingsMap();

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Recupera le impostazioni con fallback ai valori di default
  const siteName = settings.site_name || 'Richiesta Assistenza';
  const siteVersion = settings.site_version || 'v2.0';
  const companyDescription = settings.company_description || 
    'Sistema professionale per la gestione delle richieste di assistenza tecnica, sviluppato per ottimizzare il flusso di lavoro tra clienti e professionisti.';
  
  const contactPhone = settings.contact_phone || '+39 02 1234567';
  const contactEmail = settings.contact_email || 'info@assistenza.it';
  const contactAddress = settings.contact_address || 'Via Example 123';
  const contactCity = settings.contact_city || 'Milano';
  const contactCap = settings.contact_cap || '20121';
  const contactCountry = settings.contact_country || 'Italia';
  const contactHours = settings.contact_hours || 'Lun-Ven: 9:00-18:00';

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-500 bg-opacity-30 transition-opacity z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full z-50">
        <div className={`
          w-screen max-w-md transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Informazioni Sistema
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {siteName} {siteVersion}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-lg bg-white/80 p-1.5 text-gray-400 hover:text-gray-500 hover:bg-white transition-all"
                  onClick={onClose}
                >
                  <span className="sr-only">Chiudi pannello</span>
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="relative flex-1 px-6 py-6">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {/* About Section */}
                  <div className="mb-8">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Il Sistema</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {companyDescription}
                    </p>
                  </div>

                  {/* Quick Links */}
                  <div className="mb-8">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Supporto</h3>
                    <div className="space-y-2">
                      <a href="#" className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors group">
                        <QuestionMarkCircleIcon className="h-4 w-4 mr-2 text-gray-400 group-hover:text-blue-500" />
                        Centro Assistenza
                      </a>
                      <a href="#" className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors group">
                        <BookOpenIcon className="h-4 w-4 mr-2 text-gray-400 group-hover:text-blue-500" />
                        Documentazione
                      </a>
                      <a href="#" className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors group">
                        <DocumentTextIcon className="h-4 w-4 mr-2 text-gray-400 group-hover:text-blue-500" />
                        FAQ
                      </a>
                      <a href="/admin/health" className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors group">
                        <HeartIcon className="h-4 w-4 mr-2 text-gray-400 group-hover:text-blue-500" />
                        Stato Sistema
                      </a>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mb-8">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Contatti</h3>
                    <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                      {contactPhone && (
                        <div className="flex items-start">
                          <PhoneIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{contactPhone}</span>
                        </div>
                      )}
                      {contactEmail && (
                        <div className="flex items-start">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                          <a href={`mailto:${contactEmail}`} className="text-sm text-blue-600 hover:underline">
                            {contactEmail}
                          </a>
                        </div>
                      )}
                      {contactAddress && (
                        <div className="flex items-start">
                          <MapPinIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">
                            {contactAddress}<br />
                            {contactCap} {contactCity}, {contactCountry}
                          </span>
                        </div>
                      )}
                      {contactHours && (
                        <div className="flex items-start">
                          <ClockIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">
                            {contactHours}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
