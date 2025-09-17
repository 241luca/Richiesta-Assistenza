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
  HomeIcon,
  WrenchIcon,
  BoltIcon,
  Cog6ToothIcon,
  RectangleGroupIcon
} from '@heroicons/react/24/outline';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
// CAMBIATO: Ora usa il hook invece del context
import { useAuth } from '../hooks/useAuth';

// Utenti di test predefiniti - AGGIORNATI CON IL DATABASE SEED
const adminUsers = [
  {
    email: 'admin@assistenza.it',
    password: 'password123',
    role: 'Super Admin',
    name: 'Super Admin',
    color: 'from-purple-500 to-pink-500',
    icon: ShieldCheckIcon,
    description: 'Accesso completo al sistema'
  },
  {
    email: 'staff@assistenza.it',
    password: 'password123',
    role: 'Admin',
    name: 'Staff Assistenza',
    color: 'from-orange-500 to-yellow-500',
    icon: BriefcaseIcon,
    description: 'Gestione operativa sistema'
  }
];

const clientUsers = [
  {
    email: 'luigi.bianchi@gmail.com',
    password: 'password123',
    role: 'Cliente',
    name: 'Luigi Bianchi',
    color: 'from-blue-500 to-cyan-500',
    icon: UserCircleIcon,
    description: 'Napoli - Cliente privato'
  },
  {
    email: 'maria.rossi@hotmail.it',
    password: 'password123',
    role: 'Cliente',
    name: 'Maria Rossi',
    color: 'from-blue-500 to-cyan-500',
    icon: UserCircleIcon,
    description: 'Roma - Cliente privato'
  },
  {
    email: 'giuseppe.verdi@libero.it',
    password: 'password123',
    role: 'Cliente',
    name: 'Giuseppe Verdi',
    color: 'from-blue-500 to-cyan-500',
    icon: UserCircleIcon,
    description: 'Torino - Cliente privato'
  },
  {
    email: 'anna.ferrari@outlook.it',
    password: 'password123',
    role: 'Cliente',
    name: 'Anna Ferrari',
    color: 'from-blue-500 to-cyan-500',
    icon: UserCircleIcon,
    description: 'Bologna - Cliente privato'
  }
];

const professionalUsers = [
  {
    email: 'mario.rossi@assistenza.it',
    password: 'password123',
    role: 'Professionista',
    name: 'Mario Rossi',
    color: 'from-green-500 to-emerald-500',
    icon: WrenchIcon,
    description: 'Idraulico - Roma',
    specialization: '🔧 Idraulico'
  },
  {
    email: 'francesco.russo@assistenza.it',
    password: 'password123',
    role: 'Professionista',
    name: 'Francesco Russo',
    color: 'from-yellow-500 to-amber-500',
    icon: BoltIcon,
    description: 'Elettricista - Milano',
    specialization: '⚡ Elettricista'
  },
  {
    email: 'paolo.costa@assistenza.it',
    password: 'password123',
    role: 'Professionista',
    name: 'Paolo Costa',
    color: 'from-cyan-500 to-blue-500',
    icon: Cog6ToothIcon,
    description: 'Tecnico Climatizzazione - Napoli',
    specialization: '❄️ Climatizzazione'
  },
  {
    email: 'luca.moretti@assistenza.it',
    password: 'password123',
    role: 'Professionista',
    name: 'Luca Moretti',
    color: 'from-amber-600 to-orange-600',
    icon: RectangleGroupIcon,
    description: 'Falegname - Torino',
    specialization: '🪵 Falegname'
  }
];

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
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
      
      setTimeout(() => {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') {
          navigate('/admin');
        } else if (currentUser.role === 'PROFESSIONAL') {
          navigate('/dashboard');
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
    setIsLoading(true);
    try {
      await login(user.email, user.password);
      toast.success(`Accesso rapido come ${user.name}!`);
      
      setTimeout(() => {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') {
          navigate('/admin');
        } else if (currentUser.role === 'PROFESSIONAL') {
          navigate('/dashboard');
        } else {
          navigate('/dashboard');
        }
      }, 100);
      
    } catch (error: any) {
      console.error('Quick login error:', error);
      
      if (error.message === '2FA_REQUIRED') {
        toast.error('È richiesta l\'autenticazione a due fattori');
      } else if (error.message?.includes('Account locked')) {
        toast.error('Account bloccato. Troppi tentativi falliti.');
      } else if (error.message?.includes('Invalid')) {
        toast.error('Credenziali non valide. Verifica che il database sia configurato correttamente.');
      } else {
        toast.error(error.message || 'Errore nel login rapido');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getUsersToDisplay = () => {
    switch (selectedCategory) {
      case 'admin':
        return adminUsers;
      case 'client':
        return clientUsers;
      case 'professional':
        return professionalUsers;
      default:
        return adminUsers;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-8 items-start">
        {/* Left Section - Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <WrenchScrewdriverIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Benvenuto
            </h1>
            <p className="text-gray-600">
              Accedi al sistema di richiesta assistenza
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Non hai un account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Registrati
              </button>
            </p>
          </div>
        </div>

        {/* Right Section - Quick Access */}
        <div className="space-y-6">
          {/* Quick Access Header */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start mb-4">
              <SparklesIcon className="h-8 w-8 text-yellow-500 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Accesso Rapido Test</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Seleziona un profilo di test per accedere rapidamente
            </p>
            
            {/* Category Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSelectedCategory('admin')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === 'admin' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🛡️ Amministratori (2)
              </button>
              <button
                onClick={() => setSelectedCategory('client')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === 'client' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                👤 Clienti (4)
              </button>
              <button
                onClick={() => setSelectedCategory('professional')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === 'professional' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🔧 Professionisti (4)
              </button>
            </div>
          </div>

          {/* Test User Cards */}
          <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
            {getUsersToDisplay().map((testUser) => {
              const Icon = testUser.icon;
              return (
                <button
                  key={testUser.email}
                  onClick={() => quickLogin(testUser)}
                  disabled={isLoading}
                  className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${testUser.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                  
                  <div className="relative p-4 flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${testUser.color} flex items-center justify-center text-white flex-shrink-0`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-900">{testUser.name}</h3>
                      <p className="text-sm text-gray-500">
                        {testUser.role}
                        {'specialization' in testUser && (
                          <span className="ml-2 text-xs">{testUser.specialization}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{testUser.description}</p>
                    </div>
                    
                    <div className="text-xs text-gray-400 hidden sm:block">
                      <div className="font-mono bg-gray-50 px-2 py-1 rounded text-[10px]">
                        {testUser.email}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Database popolato con dati di test
                </h3>
                <div className="mt-2 text-xs text-blue-700 space-y-1">
                  <p>Password per tutti gli account: <code className="bg-white px-1 py-0.5 rounded font-mono">password123</code></p>
                  <p className="text-[11px]">✅ 20 richieste di assistenza • ✅ 8 preventivi • ✅ 40 sottocategorie</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
