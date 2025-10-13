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
  CpuChipIcon,
  UsersIcon,
  BanknotesIcon,
  GlobeAltIcon,
  GiftIcon
} from '@heroicons/react/24/outline';
import { Squares2X2Icon } from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
// CAMBIATO: Ora usa il hook invece del context
import { useAuth } from '../hooks/useAuth';
import { useSystemSettings } from '../hooks/useSystemSettings';
import toast from 'react-hot-toast';
import { NotificationCenter } from "./notifications";
import EnhancedNotificationCenter from './NotificationCenter/EnhancedNotificationCenter';
import ServiceStatusIndicator from './admin/ServiceStatusIndicator';
import SecurityStatusIndicator from './admin/SecurityStatusIndicator';
import InfoPanel from './InfoPanel';
import MinimalFooter from './MinimalFooter';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  // Tipi per gli elementi di navigazione (menu)
  type NavigationItem =
    | { type: 'separator' }
    | {
        name: string;
        href: string;
        icon?: typeof HomeIcon;
        isNew?: boolean;
        tourId?: string;
      };
  // Type guard per separatori
  const isSeparator = (item: NavigationItem): item is { type: 'separator' } => 'type' in item;
  const location = useLocation();
  const { user, logout } = useAuth();
  const { siteName, siteLogo, siteClaim } = useSystemSettings();
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
  const getNavigationItems = (): NavigationItem[] => {
    if (!user) return [];

    const baseItems: NavigationItem[] = [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    ];

    switch (user.role) {
      case 'SUPER_ADMIN':
        return [
          // Dashboard
          { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
          { name: 'Dashboard Admin', href: '/admin', icon: ChartBarIcon },
          
          // Richieste e Preventivi
          { name: 'Richieste', href: '/requests', icon: DocumentTextIcon },
          { name: 'Preventivi', href: '/quotes', icon: CurrencyDollarIcon },
          { name: 'Pagamenti', href: '/payments', icon: BanknotesIcon, isNew: true },
          { name: 'Richiesta Manuale', href: '/admin/requests/create-for-client', icon: PhoneIcon, isNew: true },
          
          { type: 'separator' },
          
          // Gestione Utenti
          { name: 'Gestione Professionisti', href: '/admin/professionals', icon: UserGroupIcon },
          { name: 'Gestione Professioni-Categorie', href: '/admin/profession-categories', icon: TagIcon },
          { name: 'Categorie', href: '/admin/categories', icon: BuildingOfficeIcon },
          { name: 'Sottocategorie', href: '/admin/subcategories', icon: TagIcon },
          { name: 'Tassonomia', href: '/admin/taxonomy', icon: Squares2X2Icon, isNew: true },
          { name: 'Utenti', href: '/admin/users', icon: UserGroupIcon },
          
          { type: 'separator' },
          
          // Sistemi Core
          { name: 'Gestione Moduli', href: '/admin/modules', icon: CpuChipIcon, isNew: true },
          { name: 'API Keys', href: '/admin/api-keys', icon: KeyIcon },
          { name: 'Audit Log', href: '/admin/audit', icon: ShieldCheckIcon, isNew: true },
          { name: 'Sistema Notifiche', href: '/admin/notifications', icon: BellIconSolid },
          { name: 'Sistema Backup', href: '/admin/backup', icon: ServerIcon, isNew: true },
          { name: 'AI Duale WhatsApp', href: '/admin/ai-duale', icon: CpuChipIcon, isNew: true },
          { name: 'Sistema Referral', href: '/referrals', icon: GiftIcon, isNew: true },
          { name: 'Referral Admin', href: '/admin/referrals', icon: GiftIcon, isNew: true },
          
          { type: 'separator' },
          
          // Documenti
          { name: 'Gestione Documenti', href: '/admin/legal-documents', icon: DocumentTextIcon },
          { name: 'Editor Documenti', href: '/admin/legal-documents/editor', icon: DocumentTextIcon, isNew: true },
          { name: 'Tabelle Documenti', href: '/admin/document-management', icon: AdjustmentsHorizontalIcon, isNew: true },
          
          { type: 'separator' },
          
          // Configurazioni
          { name: 'Tabelle Sistema', href: '/admin/system-enums', icon: SwatchIcon },
          { name: 'Impostazioni', href: '/admin/settings', icon: Cog6ToothIcon },
          { name: 'Impostazioni Sistema', href: '/admin/system-settings', icon: AdjustmentsHorizontalIcon },
          { name: 'Sistema AI', href: '/admin/ai', icon: SparklesIcon },
          { name: 'WhatsApp', href: '/admin/whatsapp', icon: ChatBubbleBottomCenterTextIcon, isNew: true },
          { name: 'WhatsApp Contatti', href: '/admin/whatsapp/contacts', icon: UsersIcon, isNew: true },
          { name: 'WhatsApp Messaggi', href: '/admin/whatsapp/messages', icon: ChatBubbleLeftRightIcon, isNew: true },
          
          { type: 'separator' },
          
          // Tools e Utility
          { name: 'Script Manager', href: '/admin/scripts', icon: CommandLineIcon, isNew: true },
          { name: 'Health Check', href: '/admin/health', icon: HeartIcon, isNew: true },
          { name: 'System Status', href: '/admin/system-status', icon: ServerIcon, isNew: true },
          { name: 'Test Sistema', href: '/admin/test', icon: BeakerIcon },
          { name: 'Tool Geocoding', href: '/admin/geocoding', icon: GlobeAltIcon, isNew: true },
          
          { type: 'separator' },
          
          // Profilo
          { name: 'Profilo', href: '/profile', icon: UserCircleIcon },
        ];
      case 'ADMIN':
        return [
          ...baseItems,
          { name: 'Dashboard Admin', href: '/admin', icon: ChartBarIcon },
          { name: 'Referral Admin', href: '/admin/referrals', icon: GiftIcon, isNew: true },
          { name: 'Gestione Moduli', href: '/admin/modules', icon: CpuChipIcon, isNew: true },
          { name: 'Audit Log', href: '/admin/audit', icon: ShieldCheckIcon, isNew: true },
          { name: 'Test Sistema', href: '/admin/test', icon: BeakerIcon },
          { name: 'Utenti', href: '/admin/users', icon: UserGroupIcon },
          { name: 'Richieste', href: '/requests', icon: DocumentTextIcon },
          { name: 'Richiesta Manuale', href: '/admin/requests/create-for-client', icon: PhoneIcon, isNew: true },
          { name: 'Script Manager', href: '/admin/scripts', icon: CommandLineIcon, isNew: true },
          { name: 'Sistema Backup', href: '/admin/backup', icon: ServerIcon, isNew: true },
          { name: 'WhatsApp', href: '/admin/whatsapp', icon: ChatBubbleBottomCenterTextIcon, isNew: true },
          { name: 'WhatsApp Contatti', href: '/admin/whatsapp/contacts', icon: UsersIcon, isNew: true },
          { name: 'WhatsApp Messaggi', href: '/admin/whatsapp/messages', icon: ChatBubbleLeftRightIcon, isNew: true },
          { name: 'Preventivi', href: '/quotes', icon: CurrencyDollarIcon },
          { name: 'Categorie', href: '/admin/categories', icon: BuildingOfficeIcon },
          { name: 'Sottocategorie', href: '/admin/subcategories', icon: TagIcon },
          { name: 'Tassonomia', href: '/admin/taxonomy', icon: Squares2X2Icon, isNew: true },
          { name: 'Sistema AI', href: '/admin/ai', icon: SparklesIcon },
          { name: 'Gestione Professionisti', href: '/admin/professionals', icon: UserGroupIcon },
          { name: 'Health Check', href: '/admin/health', icon: HeartIcon, isNew: true },
          { name: 'System Status', href: '/admin/system-status', icon: ServerIcon, isNew: true },
          { name: 'Impostazioni', href: '/admin/settings', icon: Cog6ToothIcon },
          { name: 'Profilo', href: '/profile', icon: UserCircleIcon },
        ];
      case 'PROFESSIONAL':
        const professionalItems: NavigationItem[] = [
          ...baseItems,
        ];
        
        const canViewAvailable = user.canSelfAssign !== false;
        
        if (canViewAvailable) {
          professionalItems.push({ name: 'Richieste Disponibili', href: '/professional/available-requests', icon: BriefcaseIcon, tourId: 'available-requests' });
        }
        
        professionalItems.push(
          { name: 'Rapporti Intervento', href: '/professional/reports', icon: ClipboardDocumentListIcon, isNew: true }
        );
        
        professionalItems.push(
          { name: 'Le mie Richieste', href: '/requests', icon: DocumentTextIcon },
          { name: 'I miei Preventivi', href: '/quotes', icon: CurrencyDollarIcon, tourId: 'my-quotes' },
          { name: 'Documenti Legali', href: '/professional/legal-documents', icon: ShieldCheckIcon, isNew: true },
          { name: 'Competenze', href: '/professional/skills', icon: TagIcon },
          { name: 'Calendario', href: '/professional/calendar', icon: ClipboardDocumentListIcon, tourId: 'calendar' },
          { name: 'Profilo e Indirizzi', href: '/profile', icon: UserCircleIcon }
        );
        
        return professionalItems;
      case 'CLIENT':
        return [
          ...baseItems,
          { name: 'Le mie Richieste', href: '/requests', icon: DocumentTextIcon },
          { name: 'Preventivi Ricevuti', href: '/quotes', icon: CurrencyDollarIcon },
          { name: 'Documenti Legali', href: '/my-legal-documents', icon: ShieldCheckIcon, isNew: true },
          { name: 'Rapporti Intervento', href: '/client/reports', icon: DocumentTextIcon, isNew: true },
          { name: 'Nuova Richiesta', href: '/requests/new', icon: ClipboardDocumentListIcon },
          { name: 'Profilo', href: '/profile', icon: UserCircleIcon },
        ];
      default:
        return baseItems;
    }
  };

  const navigationItems: NavigationItem[] = getNavigationItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-full flex-col">
          {/* Logo Section - Più spazio senza user info */}
          <div className="h-24 border-b border-gray-200 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 p-4">
            <div className="flex flex-col items-center justify-center h-full">
              {siteLogo ? (
                <img 
                  src={siteLogo} 
                  alt={siteName} 
                  className="h-12 w-auto object-contain filter brightness-0 invert"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <h1 className={`text-xl font-bold text-white text-center ${siteLogo ? 'hidden' : ''}`}>
                {siteName}
              </h1>
              {siteClaim && (
                <p className="text-xs text-white/90 mt-1 text-center italic">
                  {siteClaim}
                </p>
              )}
            </div>
          </div>

          {/* Navigation - Ora con più spazio */}
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
            {navigationItems.map((item, index) => {
              // Se è un separatore, renderizza una linea
              if (isSeparator(item)) {
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
                  // Aggiungi data-tour per elementi specifici
                  data-tour={item.tourId}
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
        {/* Top Header con User Info */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {
                (navigationItems.find((it) => !isSeparator(it) && it.href === location.pathname) as Exclude<NavigationItem, { type: 'separator' }> | undefined)?.name || 'Dashboard'
              }
            </h2>
            
            <div className="flex items-center space-x-4">
              {/* Service Status - Solo SUPER_ADMIN */}
              {user?.role === 'SUPER_ADMIN' && (
                <ServiceStatusIndicator />
              )}
              
              {/* Security Status - ADMIN e SUPER_ADMIN */}
              {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                <SecurityStatusIndicator />
              )}
              
              {/* Enhanced Notifications - Tutti gli utenti - TOUR ATTRIBUTE! */}
              <div data-tour="notifications">
                <EnhancedNotificationCenter />
              </div>
              
              {/* Info Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowInfoPanel(true);
                }}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Informazioni Sistema"
              >
                <InformationCircleIcon className="h-6 w-6" />
              </button>
              
              {/* Divider */}
              <div className="h-8 w-px bg-gray-200"></div>
              
              {/* User Info nell'header - TOUR ATTRIBUTE! */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
                <Link 
                  to="/profile"
                  data-tour="profile-menu"
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all shadow-md"
                  title="Vai al profilo"
                >
                  <span className="text-white font-semibold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </Link>
              </div>
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