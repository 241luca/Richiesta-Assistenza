import React from 'react';
import { Link } from 'react-router-dom';
import {
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">
              Richiesta Assistenza
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Il sistema professionale per la gestione delle richieste di assistenza tecnica.
            </p>
            <div className="flex space-x-4">
              {/* Social Icons - Placeholder */}
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Link Rapidi</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="text-sm hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/requests" className="text-sm hover:text-white transition-colors">
                  Richieste
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-sm hover:text-white transition-colors">
                  Profilo
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Supporto</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/garanzie" className="text-sm hover:text-white transition-colors">
                  🛡️ Le Nostre Garanzie
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-white transition-colors">
                  Centro Assistenza
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-white transition-colors">
                  Documentazione
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-white transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-white transition-colors">
                  Stato Sistema
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contatti</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <PhoneIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                <span className="text-sm">+39 02 1234567</span>
              </li>
              <li className="flex items-start">
                <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                <span className="text-sm">info@assistenza.it</span>
              </li>
              <li className="flex items-start">
                <MapPinIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                <span className="text-sm">
                  Via Example 123<br />
                  20121 Milano, Italia
                </span>
              </li>
              <li className="flex items-start">
                <ClockIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                <span className="text-sm">
                  Lun-Ven: 9:00-18:00
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-800 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © {currentYear} Richiesta Assistenza. Tutti i diritti riservati.
            </p>
            <div className="flex space-x-6 mt-2 sm:mt-0">
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                Termini di Servizio
              </a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
