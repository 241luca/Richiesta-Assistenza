import React from 'react';
import { useSystemSettingsMap } from '@/hooks/useSystemSettings';

export default function MinimalFooter() {
  const { settings } = useSystemSettingsMap();
  const currentYear = new Date().getFullYear();
  
  // Usa le impostazioni o i valori di default
  const siteName = settings.site_name || 'Richiesta Assistenza';
  const privacyUrl = settings.privacy_policy_url || '#';
  const termsUrl = settings.terms_service_url || '#';
  const cookieUrl = settings.cookie_policy_url || '#';

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-gray-500">
            © {currentYear} {siteName}. Tutti i diritti riservati.
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <a href={privacyUrl} className="hover:text-gray-700 transition-colors">
              Privacy Policy
            </a>
            <span>•</span>
            <a href={termsUrl} className="hover:text-gray-700 transition-colors">
              Termini di Servizio
            </a>
            <span>•</span>
            <a href={cookieUrl} className="hover:text-gray-700 transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
