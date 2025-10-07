import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  KeyIcon, 
  MapIcon, 
  EnvelopeIcon, 
  CpuChipIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ShieldCheckIcon,
  CalendarIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ApiKeysLayoutProps {
  children: React.ReactNode;
}

export default function ApiKeysLayout({ children }: ApiKeysLayoutProps) {
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname.includes('stripe')) return 'stripe';
    if (location.pathname.includes('google-maps')) return 'google-maps';
    if (location.pathname.includes('google-calendar')) return 'google-calendar';
    if (location.pathname.includes('brevo')) return 'brevo';
    if (location.pathname.includes('openai')) return 'openai';
    if (location.pathname.includes('tinymce')) return 'tinymce';
    if (location.pathname.includes('whatsapp')) return 'whatsapp';
    return 'overview';
  });

  // Verifica che sia SUPER_ADMIN
  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <ShieldCheckIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accesso Negato</h2>
          <p className="text-gray-600 mb-6">
            Questa sezione è riservata solo ai Super Amministratori.
          </p>
          <Link
            to="/admin"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-2" />
            Torna alla Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'overview',
      name: 'Panoramica',
      icon: KeyIcon,
      href: '/admin/api-keys',
      color: 'bg-gray-500'
    },
    {
      id: 'stripe',
      name: 'Stripe',
      icon: CreditCardIcon,
      href: '/admin/api-keys/stripe',
      color: 'bg-indigo-600'
    },
    {
      id: 'tinymce',
      name: 'TinyMCE',
      icon: CpuChipIcon,
      href: '/admin/api-keys/tinymce',
      color: 'bg-purple-600'
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      icon: CalendarIcon,
      href: '/admin/api-keys/google-calendar',
      color: 'bg-blue-600'
    },
    {
      id: 'google-maps',
      name: 'Google Maps',
      icon: MapIcon,
      href: '/admin/api-keys/google-maps',
      color: 'bg-green-500'
    },
    {
      id: 'brevo',
      name: 'Brevo (Email)',
      icon: EnvelopeIcon,
      href: '/admin/api-keys/brevo',
      color: 'bg-blue-500'
    },
    {
      id: 'openai',
      name: 'OpenAI (ChatGPT)',
      icon: CpuChipIcon,
      href: '/admin/api-keys/openai',
      color: 'bg-purple-500'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: ChatBubbleLeftRightIcon,
      href: '/admin/api-keys/whatsapp',
      color: 'bg-green-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link
                  to="/admin"
                  className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
                >
                  <ChevronLeftIcon className="h-5 w-5 mr-1" />
                  Admin
                </Link>
                <div className="flex items-center">
                  <KeyIcon className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Gestione API Keys
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                      Configurazione servizi esterni e integrazioni
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheckIcon className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-gray-700">
                  Super Admin Only
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname === tab.href || 
                            (tab.id !== 'overview' && location.pathname.includes(tab.id));
              
              return (
                <Link
                  key={tab.id}
                  to={tab.href}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    transition-colors duration-200 whitespace-nowrap
                    ${isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <div className={`${tab.color} p-1 rounded mr-2`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Security Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <ShieldCheckIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Informazioni di Sicurezza
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Le API keys sono criptate nel database</li>
                  <li>Non condividere mai le chiavi in chiaro</li>
                  <li>Usa chiavi separate per development e production</li>
                  <li>Ruota regolarmente le chiavi per maggiore sicurezza</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {children}
      </div>
    </div>
  );
}