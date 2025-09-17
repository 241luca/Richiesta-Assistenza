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
  SparklesIcon,
  BriefcaseIcon,
  PhoneIcon,
  ServerIcon,
  CommandLineIcon,
  ShieldCheckIcon,
  HeartIcon,
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
// CAMBIATO: Ora usa il hook invece del context
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { NotificationCenter } from "./notifications";
import InfoPanel from './InfoPanel';
import MinimalFooter from './MinimalFooter';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showInfoPanel, setShowInfoPanel] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      // Il toast di successo viene già mostrato dal hook
    } catch (error) {
      console.error('Logout error:', error);
      // Il toast di errore viene già mostrato dal hook
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
          { 
            name: 'Richiesta Manuale', 
            href: '/admin/requests/create-for-client', 
            icon: PhoneIcon,
            isNew: true // Badge "NEW"
          },
          { name: 'Richieste', href: '/requests', icon: DocumentTextIcon },
          { name: 'Preventivi', href: '/quotes', icon: CurrencyDollarIcon },
          
          // Linea di separazione
          { type: 'separator' },
          
          // Il resto in ordine alfabetico
          { name: 'API Keys', href: '/admin/api-keys', icon: KeyIcon },
          { 
            name: 'Audit Log', 
            href: '/admin/audit', 
            icon: ShieldCheckIcon,
            isNew: true // Badge "NEW"
          },
          { name: 'Categorie', href: '/admin/categories', icon: BuildingOfficeIcon },
          { name: 'Tabelle Sistema', href: '/admin/system-enums', icon: SwatchIcon },
          { name: 'Gestione Professionisti', href: '/admin/professionals', icon: UserGroupIcon },
          { name: 'Gestione Professioni-Categorie', href: '/admin/profession-categories', icon: TagIcon },
          { 
            name: 'Health Check', 
            href: '/admin/health', 
            icon: HeartIcon,
            isNew: true // Badge "NEW"
          },
          { name: 'Impostazioni', href: '/admin/settings', icon: Cog6ToothIcon },
          { name: 'Impostazioni Sistema', href: '/admin/system-settings', icon: AdjustmentsHorizontalIcon },
          { name: 'Profilo', href: '/profile', icon: UserCircleIcon },
          { 
            name: 'Script Manager', 
            href: '/admin/scripts', 
            icon: CommandLineIcon,
            isNew: true // Badge "NEW"
          },
          { name: 'Sistema AI', href: '/admin/ai', icon: SparklesIcon },
          { 
            name: 'AI Duale WhatsApp', 
            href: '/admin/ai-duale', 
            icon: CpuChipIcon,
            isNew: true // Badge "NEW"
          },
          { 
            name: 'Sistema Backup', 
            href: '/admin/backup', 
            icon: ServerIcon,
            isNew: true // Badge "NEW"
          },
          { 
            name: 'Sistema Notifiche', 
            href: '/admin/notifications', 
            icon: BellIconSolid,
          },
          { name: 'Sottocategorie', href: '/admin/subcategories', icon: TagIcon },
          { name: 'Test Sistema', href: '/admin/test', icon: BeakerIcon },
          { name: 'Utenti', href: '/admin/users', icon: UserGroupIcon },
          { 
            name: 'WhatsApp', 
            href: '/admin/whatsapp', 
            icon: ChatBubbleBottomCenterTextIcon,
            isNew: true // Badge "NEW"
          },
          { 
            name: 'WhatsApp Dashboard', 
            href: '/admin/whatsapp/dashboard', 
            icon: ChatBubbleLeftRightIcon,
            isNew: true // Badge "NEW"
          },
          { 
            name: 'WhatsApp Impostazioni', 
            href: '/admin/whatsapp/settings', 
            icon: Cog6ToothIcon,
            isNew: true // Badge "NEW"
          },
        ];
      case 'ADMIN':
        return [
          ...baseItems,
          { name: 'Dashboard Admin', href: '/admin', icon: ChartBarIcon },
          { 
            name: 'Audit Log', 
            href: '/admin/audit', 
            icon: ShieldCheckIcon,
            isNew: true // Badge "NEW"
          },
          { name: 'Test Sistema', href: '/admin/test', icon: BeakerIcon },
          { name: 'Utenti', href: '/admin/users', icon: UserGroupIcon },
          { name: 'Richieste', href: '/requests', icon: DocumentTextIcon },
          
          // NUOVO: Centralino - Crea richiesta per cliente (anche per ADMIN)
          { 
            name: 'Richiesta Manuale', 
            href: '/admin/requests/create-for-client', 
            icon: PhoneIcon,
            isNew: true // Badge "NEW"
          },
          
          // NUOVO: Script Manager (anche per ADMIN)
          { 
            name: 'Script Manager', 
            href: '/admin/scripts', 
            icon: CommandLineIcon,
            isNew: true // Badge "NEW"
          },
          
          // NUOVO: Sistema Backup Professionale (anche per ADMIN)
          { 
            name: 'Sistema Backup', 
            href: '/admin/backup', 
            icon: ServerIcon,
            isNew: true // Badge "NEW"
          },
          
          // NUOVO: WhatsApp (anche per ADMIN)
          { 
            name: 'WhatsApp', 
            href: '/admin/whatsapp', 
            icon: ChatBubbleBottomCenterTextIcon,
            isNew: true // Badge "NEW"
          },
          
          // NUOVO: WhatsApp Dashboard per vedere i messaggi
          { 
            name: 'WhatsApp Dashboard', 
            href: '/admin/whatsapp/dashboard', 
            icon: ChatBubbleLeftRightIcon,
            isNew: true // Badge "NEW"
          },
          
          // NUOVO: WhatsApp Impostazioni per configurare il sistema
          { 
            name: 'WhatsApp Impostazioni', 
            href: '/admin/whatsapp/settings', 
            icon: Cog6ToothIcon,
            isNew: true // Badge "NEW"
          },
          
          { name: 'Preventivi', href: '/quotes', icon: CurrencyDollarIcon },
          { name: 'Categorie', href: '/admin/categories', icon: BuildingOfficeIcon },
          { name: 'Sottocategorie', href: '/admin/subcategories', icon: TagIcon },
          { name: 'Sistema AI', href: '/admin/ai', icon: SparklesIcon },
          { name: 'Gestione Professionisti', href: '/admin/professionals', icon: UserGroupIcon },
          { 
            name: 'Health Check', 
            href: '/admin/health', 
            icon: HeartIcon,
            isNew: true // Badge "NEW"
          },
          { name: 'Impostazioni', href: '/admin/settings', icon: Cog6ToothIcon },
          { name: 'Profilo', href: '/profile', icon: UserCircleIcon },
          // NOTA: Sistema Notifiche NON disponibile per ADMIN normale
        ];
      case 'PROFESSIONAL':
        const professionalItems = [
          ...baseItems,
        ];
        
        // Debug: vediamo cosa contiene l'oggetto user
        console.log('Professional user data:', user);
        console.log('canSelfAssign value:', user.canSelfAssign);
        
        // Aggiungi "Richieste Disponibili" solo se il professionista ha l'auto-assegnazione attiva
        // Il campo nel database è canSelfAssign (true = può auto-assegnarsi, false = bloccato)
        // Se il campo è null o undefined, consideriamo che può auto-assegnarsi (default)
        const canViewAvailable = user.canSelfAssign !== false;
        
        console.log('canViewAvailable result:', canViewAvailable);
        
        if (canViewAvailable) {
          professionalItems.push({ name: 'Richieste Disponibili', href: '/professional/available-requests', icon: BriefcaseIcon });
        }
        
        // NUOVO: Sistema Rapporti Intervento
        professionalItems.push(
          { name: 'Rapporti Intervento', href: '/professional/reports', icon: ClipboardDocumentListIcon, isNew: true }
        );
        
        // Aggiungi il resto delle voci
        professionalItems.push(
          { name: 'Le mie Richieste', href: '/requests', icon: DocumentTextIcon },
          { name: 'I miei Preventivi', href: '/quotes', icon: CurrencyDollarIcon },
          { name: 'Competenze', href: '/professional/skills', icon: TagIcon },
          { name: 'Calendario', href: '/professional/calendar', icon: ClipboardDocumentListIcon },
          { name: 'Profilo e Indirizzi', href: '/profile', icon: UserCircleIcon }
        );
        
        return professionalItems;
      case 'CLIENT':
        return [
          ...baseItems,
          { name: 'Le mie Richieste', href: '/requests', icon: DocumentTextIcon },
          { name: 'Preventivi Ricevuti', href: '/quotes', icon: CurrencyDollarIcon },
          { name: 'Rapporti Intervento', href: '/client/reports', icon: DocumentTextIcon, isNew: true },
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
            {navigationItems.map((item, index) => {
              // Se è un separatore, renderizza una linea
              if (item.type === 'separator') {
                return (
                  <div key={`separator-${index}`} className="py-2">
                    <div className="border-t border-gray-200"></div>
                  </div>
                );
              }
              
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
                  {Icon && (
                    <Icon 
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} 
                      style={{ width: '20px', height: '20px' }}
                    />
                  )}
                  <span className={Icon ? 'flex-1' : 'flex-1 ml-8'}>{item.name}</span>
                  {/* Badge NEW per nuove funzionalità */}
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
              
              {/* Info Button */}
              <button
                onClick={() => setShowInfoPanel(true)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Informazioni Sistema"
              >
                <InformationCircleIcon className="h-6 w-6" />
              </button>
              
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

        {/* Minimal Footer */}
        <MinimalFooter />
      </div>
      
      {/* Info Panel */}
      <InfoPanel isOpen={showInfoPanel} onClose={() => setShowInfoPanel(false)} />
    </div>
  );
}