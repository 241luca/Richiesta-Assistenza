import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { 
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  HeartIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  GlobeAltIcon
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

  // Recupera tutte le impostazioni con fallback ai valori di default
  const siteName = settings.site_name || 'Richiesta Assistenza';
  const siteVersion = settings.site_version || 'v5.1';
  const siteLogo = settings.site_logo;
  const siteClaim = settings.site_claim || 'Il tuo partner per l\'assistenza tecnica';
  
  const companyName = settings.company_name || 'LM Tecnologie';
  const companyDescription = settings.company_description || 
    'Sistema professionale per la gestione delle richieste di assistenza tecnica, sviluppato per ottimizzare il flusso di lavoro tra clienti e professionisti.';
  const companyVat = settings.company_vat || 'IT12345678901';
  
  const contactPhone = settings.contact_phone || '+39 02 1234567';
  const contactMobile = settings.contact_mobile || '+39 333 1234567';
  const contactEmail = settings.contact_email || 'info@assistenza.it';
  const contactPec = settings.contact_pec || 'assistenza@pec.it';
  const contactAddress = settings.contact_address || 'Via Example 123';
  const contactCity = settings.contact_city || 'Milano';
  const contactCap = settings.contact_cap || '20121';
  const contactCountry = settings.contact_country || 'Italia';
  const contactHours = settings.contact_hours || 'Lun-Ven: 9:00-18:00';
  
  const socialFacebook = settings.social_facebook;
  const socialInstagram = settings.social_instagram;
  const socialLinkedin = settings.social_linkedin;
  const socialTwitter = settings.social_twitter;

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
            {/* Header con logo e branding */}
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  {siteLogo && (
                    <img 
                      src={siteLogo} 
                      alt={siteName} 
                      className="h-8 w-auto mr-3 filter brightness-0 invert"
                    />
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {siteName}
                    </h2>
                    <p className="text-sm text-white/80">
                      {siteClaim}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-lg bg-white/20 p-1.5 text-white/80 hover:text-white hover:bg-white/30 transition-all"
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
                  {/* System Info */}
                  <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <BuildingOfficeIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="font-medium text-gray-900">Sistema</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed mb-2">
                      {companyDescription}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Versione: {siteVersion}</span>
                      <span>© 2025 {companyName}</span>
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <QuestionMarkCircleIcon className="h-4 w-4 mr-1" />
                      Link Rapidi
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Link 
                        to="/contact" 
                        onClick={onClose}
                        className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors group bg-gray-50 rounded-lg p-2"
                      >
                        <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2 text-gray-400 group-hover:text-blue-500" />
                        Contattaci
                      </Link>
                      <Link 
                        to="/legal" 
                        onClick={onClose}
                        className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors group bg-gray-50 rounded-lg p-2"
                      >
                        <ShieldCheckIcon className="h-4 w-4 mr-2 text-gray-400 group-hover:text-blue-500" />
                        Documenti
                      </Link>
                      <a 
                        href="#" 
                        className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors group bg-gray-50 rounded-lg p-2"
                      >
                        <BookOpenIcon className="h-4 w-4 mr-2 text-gray-400 group-hover:text-blue-500" />
                        Guida
                      </a>
                      <Link 
                        to="/admin/health" 
                        onClick={onClose}
                        className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors group bg-gray-50 rounded-lg p-2"
                      >
                        <HeartIcon className="h-4 w-4 mr-2 text-gray-400 group-hover:text-blue-500" />
                        Stato
                      </Link>
                    </div>
                  </div>

                  {/* Company Info */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                      Informazioni Aziendali
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div>
                        <span className="text-xs text-gray-500">Ragione Sociale:</span>
                        <p className="text-sm font-medium text-gray-900">{companyName}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">P.IVA:</span>
                        <p className="text-sm text-gray-700">{companyVat}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Sede Legale:</span>
                        <p className="text-sm text-gray-700">
                          {contactAddress}<br />
                          {contactCap} {contactCity}, {contactCountry}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-1" />
                      Contatti
                    </h3>
                    <div className="space-y-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                      {contactPhone && (
                        <div className="flex items-start">
                          <PhoneIcon className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-xs text-gray-500">Telefono:</span>
                            <p className="text-sm font-medium text-gray-900">{contactPhone}</p>
                          </div>
                        </div>
                      )}
                      {contactMobile && (
                        <div className="flex items-start">
                          <PhoneIcon className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-xs text-gray-500">Mobile:</span>
                            <p className="text-sm font-medium text-gray-900">{contactMobile}</p>
                          </div>
                        </div>
                      )}
                      {contactEmail && (
                        <div className="flex items-start">
                          <EnvelopeIcon className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-xs text-gray-500">Email:</span>
                            <p>
                              <a href={`mailto:${contactEmail}`} className="text-sm text-blue-600 hover:underline">
                                {contactEmail}
                              </a>
                            </p>
                          </div>
                        </div>
                      )}
                      {contactPec && (
                        <div className="flex items-start">
                          <EnvelopeIcon className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-xs text-gray-500">PEC:</span>
                            <p>
                              <a href={`mailto:${contactPec}`} className="text-sm text-blue-600 hover:underline">
                                {contactPec}
                              </a>
                            </p>
                          </div>
                        </div>
                      )}
                      {contactHours && (
                        <div className="flex items-start">
                          <ClockIcon className="h-4 w-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-xs text-gray-500">Orari:</span>
                            <p className="text-sm font-medium text-gray-900">{contactHours}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Social Links */}
                  {(socialFacebook || socialInstagram || socialLinkedin || socialTwitter) && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <GlobeAltIcon className="h-4 w-4 mr-1" />
                        Seguici sui Social
                      </h3>
                      <div className="flex space-x-3">
                        {socialFacebook && (
                          <a 
                            href={socialFacebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            title="Facebook"
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          </a>
                        )}
                        {socialInstagram && (
                          <a 
                            href={socialInstagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200 transition-colors"
                            title="Instagram"
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                            </svg>
                          </a>
                        )}
                        {socialLinkedin && (
                          <a 
                            href={socialLinkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            title="LinkedIn"
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                          </a>
                        )}
                        {socialTwitter && (
                          <a 
                            href={socialTwitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            title="X (Twitter)"
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Legal Links */}
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Documenti Legali</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <Link 
                        to="/legal/privacy" 
                        onClick={onClose}
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        Privacy Policy
                      </Link>
                      <Link 
                        to="/legal/terms" 
                        onClick={onClose}
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        Termini di Servizio
                      </Link>
                      <Link 
                        to="/legal/cookies" 
                        onClick={onClose}
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        Cookie Policy
                      </Link>
                      <Link 
                        to="/legal" 
                        onClick={onClose}
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        Tutti i Documenti
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t bg-gray-50 px-6 py-4">
              <div className="flex justify-between items-center">
                <Link
                  to="/contact"
                  onClick={onClose}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                  Contattaci
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}