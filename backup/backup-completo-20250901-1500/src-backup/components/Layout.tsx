import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  BellIcon,
  UserCircleIcon,
  TagIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  BuildingOfficeIcon,
  KeyIcon,
  BeakerIcon,
  SwatchIcon,
  AdjustmentsHorizontalIcon,
  TruckIcon,
  MapPinIcon,
  AcademicCapIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
// CAMBIATO: Ora usa il hook invece del context
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { NotificationCenter } from "./notifications";
interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logout effettuato con successo');
    } catch (error) {
      toast.error('Errore durante il logout');
    }
  };

  // Navigation items basati sul ruolo utente
  const getNavigationItems = () => {
    if (!user) return [];

    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    ];

    switch (user.role) {
      case 'SUPER_ADMIN':
        return [
          ...baseItems,
          { name: 'Dashboard Admin', href: '/admin', icon: ChartBarIcon },
          { name: 'Test Sistema', href: '/admin/test', icon: BeakerIcon },
          { name: 'Utenti', href: '/admin/users', icon: UserGroupIcon },
          { name: 'Richieste', href: '/requests', icon: DocumentTextIcon },
          { name: 'Preventivi', href: '/quotes', icon: CurrencyDollarIcon },
          { name: 'Categorie', href: '/admin/categories', icon: BuildingOfficeIcon },
          { name: 'Sottocategorie', href: '/admin/subcategories', icon: TagIcon },
          { name: 'Sistema AI', href: '/admin/ai', icon: SparklesIcon },
          { name: 'Competenze Professionisti', href: '/professional/skills', icon: AcademicCapIcon },
          
          // NUOVO: Sistema Notifiche Professionale (solo SUPER_ADMIN)
          { 
            name: '🔔 Sistema Notifiche', 
            href: '/admin/notifications', 
            icon: BellIconSolid,
            isNew: true // Badge "NEW" opzionale
          },
          
          { name: 'API Keys', href: '/admin/api-keys', icon: KeyIcon },
          // Sistema di configurazione avanzata
          { name: 'Gestione Enum', href: '/admin/system-enums', icon: SwatchIcon },
          { name: 'Impostazioni Sistema', href: '/admin/system-settings', icon: AdjustmentsHorizontalIcon },
          { name: '🔧 SIMPLE Settings', href: '/admin/system-settings-simple', icon: Cog6ToothIcon },
          { name: '🧪 TEST Settings', href: '/admin/system-settings-test', icon: BeakerIcon },
          { name: 'Impostazioni', href: '/admin/settings', icon: Cog6ToothIcon },
          { name: 'Profilo', href: '/profile', icon: UserCircleIcon },
        ];
      case 'ADMIN':
        return [
          ...baseItems,
          { name: 'Dashboard Admin', href: '/admin', icon: ChartBarIcon },
          { name: 'Test Sistema', href: '/admin/test', icon: BeakerIcon },
          { name: 'Utenti', href: '/admin/users', icon: UserGroupIcon },
          { name: 'Richieste', href: '/requests', icon: DocumentTextIcon },
          { name: 'Preventivi', href: '/quotes', icon: CurrencyDollarIcon },
          { name: 'Categorie', href: '/admin/categories', icon: BuildingOfficeIcon },
          { name: 'Sottocategorie', href: '/admin/subcategories', icon: TagIcon },
          { name: 'Sistema AI', href: '/admin/ai', icon: SparklesIcon },
          { name: 'Competenze Professionisti', href: '/professional/skills', icon: AcademicCapIcon },
          { name: 'Impostazioni', href: '/admin/settings', icon: Cog6ToothIcon },
          { name: 'Profilo', href: '/profile', icon: UserCircleIcon },
          // NOTA: Sistema Notifiche NON disponibile per ADMIN normale
        ];
      case 'PROFESSIONAL':
        return [
          ...baseItems,
          { name: 'Le mie Richieste', href: '/requests', icon: DocumentTextIcon },
          { name: 'I miei Preventivi', href: '/quotes', icon: CurrencyDollarIcon },
          { name: 'Competenze e Sottocategorie', href: '/professional/skills', icon: TagIcon },
          { name: 'Calendario', href: '/professional/calendar', icon: ClipboardDocumentListIcon },
          { name: 'Profilo e Indirizzi', href: '/profile', icon: UserCircleIcon },
        ];
      case 'CLIENT':
        return [
          ...baseItems,
          { name: 'Le mie Richieste', href: '/requests', icon: DocumentTextIcon },
          { name: 'Preventivi Ricevuti', href: '/quotes', icon: CurrencyDollarIcon },
          { name: 'Nuova Richiesta', href: '/requests/new', icon: ClipboardDocumentListIcon },
          { name: 'Profilo', href: '/profile', icon: UserCircleIcon },
        ];
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
            <h1 className="text-xl font-bold text-white">Richiesta Assistenza</h1>
          </div>

          {/* User Info */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation - Added overflow-y-auto for scrollable sidebar */}
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors relative
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-purple-700 border-l-4 border-purple-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon 
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} 
                    style={{ width: '20px', height: '20px' }}
                  />
                  <span className="flex-1">{item.name}</span>
                  {/* Badge NEW per Sistema Notifiche */}
                  {item.isNew && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full animate-pulse">
                      NEW
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <ArrowLeftOnRectangleIcon 
                className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-red-500" 
                style={{ width: '20px', height: '20px' }}
              />
              Esci
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {navigationItems.find(item => item.href === location.pathname)?.name || 'Dashboard'}
            </h2>
            
            <div className="flex items-center space-x-4">
              {/* Notifications - Con indicatore per SUPER_ADMIN */}
              <NotificationCenter />
              
              {/* Profile */}
              <Link 
                to="/profile"
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <UserCircleIcon className="h-6 w-6" style={{ width: '24px', height: '24px' }} />
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="px-6 py-4">
            <p className="text-center text-xs text-gray-500">
              © 2025 Sistema Richiesta Assistenza v2.0 | Enterprise Edition
              {user?.role === 'SUPER_ADMIN' && ' | 🔔 Sistema Notifiche Attivo'}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}