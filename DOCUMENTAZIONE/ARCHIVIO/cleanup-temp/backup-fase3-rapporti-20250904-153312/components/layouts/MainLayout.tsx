import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationCenter } from '../notifications';
import {
  HomeIcon,
  DocumentTextIcon,
  CurrencyEuroIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BeakerIcon,
  ChartBarIcon,
  UsersIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

export function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Richieste', href: '/requests', icon: DocumentTextIcon },
    { name: 'Preventivi', href: '/quotes', icon: CurrencyEuroIcon },
    { name: 'Profilo', href: '/profile', icon: UserIcon },
  ];

  // Admin navigation section
  const adminNavigation = [
    { name: 'Dashboard Admin', href: '/admin', icon: ChartBarIcon },
    { name: 'Test Sistema', href: '/admin/tests', icon: BeakerIcon },
    { name: 'Utenti', href: '/admin/users', icon: UsersIcon },
    { name: 'Sicurezza', href: '/admin/security', icon: ShieldCheckIcon },
    { name: 'Configurazioni', href: '/admin/settings', icon: WrenchScrewdriverIcon },
  ];

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get current page title
  const currentPage = navigation.find(item => location.pathname.startsWith(item.href));
  const pageTitle = currentPage?.name || 'Dashboard';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white">
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Menu</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md
                    ${isActive
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <item.icon
                    className={`
                      mr-3 h-5 w-5
                      ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}
                    `}
                  />
                  {item.name}
                </Link>
              );
            })}
            
            {/* Admin Section */}
            {isAdmin && (
              <>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amministrazione
                  </p>
                  <div className="mt-2 space-y-1">
                    {adminNavigation.map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`
                            group flex items-center px-2 py-2 text-sm font-medium rounded-md
                            ${isActive
                              ? 'bg-red-100 text-red-900'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }
                          `}
                        >
                          <item.icon
                            className={`
                              mr-3 h-5 w-5
                              ${isActive ? 'text-red-600' : 'text-gray-400 group-hover:text-gray-500'}
                            `}
                          />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </nav>
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-2 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-white border-r border-gray-200">
          <div className="flex items-center justify-center h-16 px-4 border-b">
            <h1 className="text-xl font-bold text-blue-600">Richiesta Assistenza</h1>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md
                    ${isActive
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <item.icon
                    className={`
                      mr-3 h-5 w-5
                      ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}
                    `}
                  />
                  {item.name}
                </Link>
              );
            })}
            
            {/* Admin Section */}
            {isAdmin && (
              <>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amministrazione
                  </p>
                  <div className="mt-2 space-y-1">
                    {adminNavigation.map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`
                            group flex items-center px-2 py-2 text-sm font-medium rounded-md
                            ${isActive
                              ? 'bg-red-100 text-red-900'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }
                          `}
                        >
                          <item.icon
                            className={`
                              mr-3 h-5 w-5
                              ${isActive ? 'text-red-600' : 'text-gray-400 group-hover:text-gray-500'}
                            `}
                          />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </nav>
          <div className="p-4 border-t">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-500"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <div className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700 lg:hidden"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex-1 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {pageTitle}
            </h2>

            {/* Notification Center and User Menu */}
            <div className="flex items-center gap-4">
              {/* Notification Center Component */}
              <NotificationCenter />
              
              {/* User Info (Desktop only) */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
