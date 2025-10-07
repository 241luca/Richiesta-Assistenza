import React from 'react';
import { useSystemSettingsMap } from '@/hooks/useSystemSettings';
import { Link } from 'react-router-dom';
import { 
  HomeIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  CookieIcon
} from '@heroicons/react/24/outline';

export default function MinimalFooter() {
  const { settings } = useSystemSettingsMap();
  const currentYear = new Date().getFullYear();
  
  // Usa le impostazioni o i valori di default
  const siteName = settings.site_name || 'Richiesta Assistenza';
  const companyName = settings.company_name || 'LM Tecnologie';
  const companyVat = settings.company_vat || 'IT12345678901';
  const contactAddress = settings.contact_address || 'Via Roma 123';
  const contactCity = settings.contact_city || 'Roma';
  const contactCap = settings.contact_cap || '00100';
  const contactPhone = settings.contact_phone || '+39 06 123456';
  const contactMobile = settings.contact_mobile || '+39 333 1234567';
  const contactEmail = settings.contact_email || 'info@lmtecnologie.it';
  const contactPec = settings.contact_pec || 'lmtecnologie@pec.it';
  const contactHours = settings.contact_hours || 'Lun-Ven: 9:00-18:00';
  const privacyUrl = settings.privacy_policy_url || '/legal/privacy';
  const termsUrl = settings.terms_service_url || '/legal/terms';
  const cookieUrl = settings.cookie_policy_url || '/legal/cookies';
  const siteClaim = settings.site_claim || 'Il tuo problema, la nostra soluzione!';
  const socialFacebook = settings.social_facebook;
  const socialInstagram = settings.social_instagram;
  const socialLinkedin = settings.social_linkedin;
  const socialTwitter = settings.social_twitter;

  return (
    <footer className="bg-gradient-to-br from-gray-50 to-gray-100 border-t-2 border-gray-200 mt-auto">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <HomeIcon className="h-5 w-5 text-blue-600" />
              {companyName}
            </h3>
            <p className="text-sm text-gray-600 italic">"{siteClaim}"</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 flex items-start gap-2">
                <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span>
                  {contactAddress}<br />
                  {contactCap} {contactCity}
                </span>
              </p>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 text-gray-400" />
                <a href={`tel:${contactPhone}`} className="hover:text-blue-600 transition-colors">
                  {contactPhone}
                </a>
              </p>
              {contactMobile && (
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${contactMobile}`} className="hover:text-blue-600 transition-colors">
                    {contactMobile} <span className="text-xs">(Mobile)</span>
                  </a>
                </p>
              )}
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                <a href={`mailto:${contactEmail}`} className="hover:text-blue-600 transition-colors">
                  {contactEmail}
                </a>
              </p>
              {contactPec && (
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${contactPec}`} className="hover:text-blue-600 transition-colors text-xs">
                    PEC: {contactPec}
                  </a>
                </p>
              )}
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Supporto</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Orari di apertura:</strong><br />
                {contactHours}
              </p>
              <p className="text-sm text-gray-600">
                <strong>P.IVA:</strong><br />
                {companyVat}
              </p>
              <Link 
                to="/contact" 
                className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-2"
              >
                Contattaci
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Link Rapidi</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/requests/new" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Nuova Richiesta
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Il Mio Profilo
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Contattaci
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-blue-600" />
              Documenti Legali
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to={privacyUrl} className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to={termsUrl} className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  Termini di Servizio
                </Link>
              </li>
              <li>
                <Link to={cookieUrl} className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>


          
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm">
              © {currentYear} {companyName}. Tutti i diritti riservati.
            </p>
            
            {/* Social Media Icons */}
            {(socialFacebook || socialInstagram || socialLinkedin || socialTwitter) && (
              <div className="flex items-center gap-3">
                {socialFacebook && (
                  <a 
                    href={socialFacebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/80 hover:text-white transition-colors"
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
                    className="text-white/80 hover:text-white transition-colors"
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
                    className="text-white/80 hover:text-white transition-colors"
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
                    className="text-white/80 hover:text-white transition-colors"
                    title="X (Twitter)"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
            
            <p className="text-sm">
              Sviluppato con ❤️ da {companyName}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}