import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserIcon, 
  LockClosedIcon, 
  SparklesIcon,
  UserCircleIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  WrenchIcon,
  BoltIcon,
  Cog6ToothIcon,
  RectangleGroupIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useSystemSettings } from '../hooks/useSystemSettings';

// Utenti di test predefiniti - AGGIORNATI CON IL DATABASE SEED
const testUsers = {
  admin: [
    {
      email: 'admin@assistenza.it',
      password: 'password123',
      role: 'Super Admin',
      name: 'Super Admin',
      color: 'bg-purple-500',
      icon: ShieldCheckIcon,
      description: 'Accesso completo al sistema'
    },
    {
      email: 'staff@assistenza.it',
      password: 'password123',
      role: 'Admin',
      name: 'Staff Assistenza',
      color: 'bg-orange-500',
      icon: BriefcaseIcon,
      description: 'Gestione operativa'
    }
  ],
  client: [
    {
      email: 'luigi.bianchi@gmail.com',
      password: 'password123',
      role: 'Cliente',
      name: 'Luigi Bianchi',
      color: 'bg-blue-500',
      icon: UserCircleIcon,
      description: 'Napoli'
    },
    {
      email: 'maria.rossi@hotmail.it',
      password: 'password123',
      role: 'Cliente',
      name: 'Maria Rossi',
      color: 'bg-blue-500',
      icon: UserCircleIcon,
      description: 'Roma'
    }
  ],
  professional: [
    {
      email: 'mario.rossi@assistenza.it',
      password: 'password123',
      role: 'Professionista',
      name: 'Mario Rossi',
      color: 'bg-green-500',
      icon: WrenchIcon,
      description: 'Idraulico - Roma'
    },
    {
      email: 'francesco.russo@assistenza.it',
      password: 'password123',
      role: 'Professionista',
      name: 'Francesco Russo',
      color: 'bg-yellow-500',
      icon: BoltIcon,
      description: 'Elettricista - Milano'
    }
  ]
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { siteName, siteLogo, siteClaim, companyName, siteVersion } = useSystemSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'admin' | 'client' | 'professional'>('admin');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      toast.success('Login effettuato con successo!');
      
      // Redirect basato sul ruolo
      setTimeout(() => {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') {
          navigate('/admin');
        } else if (currentUser.role === 'PROFESSIONAL') {
          // Controllo stato approvazione
          if (currentUser.approvalStatus !== 'APPROVED') {
            navigate('/pending-approval');
          } else {
            navigate('/dashboard');
          }
        } else {
          navigate('/dashboard');
        }
      }, 100);
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.message === '2FA_REQUIRED') {
        toast.error('È richiesta l\'autenticazione a due fattori');
      } else if (error.message?.includes('Account locked')) {
        toast.error('Account bloccato. Troppi tentativi falliti.');
      } else if (error.message?.includes('Invalid')) {
        toast.error('Email o password non validi');
      } else {
        toast.error(error.message || 'Errore durante il login. Riprova.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (user: any) => {
    setFormData({ email: user.email, password: user.password });
    setIsLoading(true);
    
    try {
      await login(user.email, user.password);
      toast.success(`Accesso rapido come ${user.name}!`);
      
      setTimeout(() => {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') {
          navigate('/admin');
        } else if (currentUser.role === 'PROFESSIONAL') {
          if (currentUser.approvalStatus !== 'APPROVED') {
            navigate('/pending-approval');
          } else {
            navigate('/dashboard');
          }
        } else {
          navigate('/dashboard');
        }
      }, 100);
      
    } catch (error: any) {
      console.error('Quick login error:', error);
      toast.error(error.message || 'Errore nel login rapido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Main Container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid lg:grid-cols-2">
            
            {/* Left Side - Login Form */}
            <div className="p-8 lg:p-12">
              {/* Logo/Header */}
              <div className="text-center mb-8">
                {/* Logo dinamico o icona di fallback */}
                {siteLogo ? (
                  <div className="mb-4">
                    <img 
                      src={siteLogo} 
                      alt={siteName} 
                      className="h-16 w-auto mx-auto"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                        // Mostra l'icona di fallback se l'immagine non si carica
                        const fallback = document.getElementById('logo-fallback');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div id="logo-fallback" className="hidden items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mx-auto">
                      <WrenchScrewdriverIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
                    <WrenchScrewdriverIcon className="h-8 w-8 text-white" />
                  </div>
                )}
                <h1 className="text-3xl font-bold text-blue-600 mb-2">
                  {siteName || 'Richiesta Assistenza'}
                </h1>
                <p className="text-lg italic text-blue-400 mb-2">
                  {siteClaim}
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  Versione <span className="font-bold">{siteVersion?.replace('v', '') || '1.0'}</span>
                </p>
                <p className="text-gray-600">
                  Accedi al tuo account
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="nome@esempio.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">Ricordami</span>
                  </label>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                    Password dimenticata?
                  </a>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Accesso in corso...
                    </span>
                  ) : (
                    'Accedi'
                  )}
                </button>
              </form>

              {/* Register Link */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                  Non hai un account?{' '}
                  <button
                    onClick={() => navigate('/register')}
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Registrati ora
                  </button>
                </p>
              </div>
            </div>

            {/* Right Side - Quick Access */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 lg:p-12">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <SparklesIcon className="h-6 w-6 text-yellow-500 mr-2" />
                  <h2 className="text-xl font-bold text-gray-900">Accesso Rapido Test</h2>
                </div>
                <p className="text-sm text-gray-600">
                  Seleziona un profilo per il login rapido
                </p>
              </div>

              {/* Category Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setSelectedCategory('admin')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === 'admin' 
                      ? 'bg-purple-100 text-purple-700 shadow-sm' 
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <ShieldCheckIcon className="h-4 w-4 inline mr-1" />
                  Admin
                </button>
                <button
                  onClick={() => setSelectedCategory('client')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === 'client' 
                      ? 'bg-blue-100 text-blue-700 shadow-sm' 
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <UserCircleIcon className="h-4 w-4 inline mr-1" />
                  Clienti
                </button>
                <button
                  onClick={() => setSelectedCategory('professional')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === 'professional' 
                      ? 'bg-green-100 text-green-700 shadow-sm' 
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <WrenchIcon className="h-4 w-4 inline mr-1" />
                  Professionisti
                </button>
              </div>

              {/* User Cards */}
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                {testUsers[selectedCategory].map((user) => {
                  const Icon = user.icon;
                  return (
                    <button
                      key={user.email}
                      onClick={() => quickLogin(user)}
                      disabled={isLoading}
                      className="w-full bg-white rounded-xl p-4 hover:shadow-md transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 hover:border-gray-300"
                    >
                      <div className="flex items-center">
                        <div className={`w-10 h-10 ${user.color} rounded-lg flex items-center justify-center text-white mr-3`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.role} • {user.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Info Box */}
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex">
                  <ExclamationCircleIcon className="h-5 w-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-amber-800 mb-1">Ambiente di Test</p>
                    <p className="text-amber-700">
                      Password: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">password123</code>
                    </p>
                    <p className="text-amber-600 mt-1">
                      Database popolato con dati di esempio
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Footer in basso a destra */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col items-end gap-2">
                  <p className="text-xs text-gray-500">
                    © 2025 {siteName || 'Richiesta Assistenza'}. Tutti i diritti riservati.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <a href="/legal/privacy-policy" className="hover:text-gray-700 transition-colors">
                      Privacy Policy
                    </a>
                    <span>•</span>
                    <a href="/legal/terms-service" className="hover:text-gray-700 transition-colors">
                      Termini di Servizio
                    </a>
                    <span>•</span>
                    <a href="/legal/cookie-policy" className="hover:text-gray-700 transition-colors">
                      Cookie Policy
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles - Moved to global CSS or inline styles */}
    </div>
  );
};

export default LoginPage;
