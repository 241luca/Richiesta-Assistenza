import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Componente Footer con link ai documenti legali
 */
export default function FooterLegal() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600">
              © 2025 Richiesta Assistenza. Tutti i diritti riservati.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <Link 
              to="/legal/privacy-policy" 
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-400">•</span>
            <Link 
              to="/legal/terms-service" 
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Termini di Servizio
            </Link>
            <span className="text-gray-400">•</span>
            <Link 
              to="/legal/cookie-policy" 
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Cookie Policy
            </Link>
            <span className="text-gray-400">•</span>
            <Link 
              to="/legal" 
              className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
            >
              Centro Legale
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
