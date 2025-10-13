/**
 * useAuth Hook
 * Hook per gestire l'autenticazione utente
 * AGGIORNATO: Compatibile con ResponseFormatter backend
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
}

interface LoginData {
  email: string;
  password: string;
  remember?: boolean;
  twoFactorCode?: string; // opzionale per login con 2FA
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'CLIENT' | 'PROFESSIONAL';
  address: string;
  city: string;
  province: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  
  // Campi personali
  dateOfBirth?: string;
  codiceFiscale?: string;
  professionId?: string;
  profession?: string;
  
  // Campi aziendali (per professionisti)
  businessName?: string;
  businessAddress?: string;
  businessCity?: string;
  businessProvince?: string;
  businessPostalCode?: string;
  businessLatitude?: number;
  businessLongitude?: number;
  partitaIva?: string;
  businessCF?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessPec?: string;
  businessSdi?: string;
  
  // Privacy
  privacyAccepted?: boolean;
  termsAccepted?: boolean;
  marketingAccepted?: boolean;
  
  // Legacy
  organizationName?: string;
}

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Recupera il token dal localStorage
  const token = localStorage.getItem('accessToken');

  // Query per recuperare l'utente corrente - SOLO se c'è un token
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const response = await api.users.getProfile();
      // CORRETTO: Gestisce il ResponseFormatter che wrappa i dati in data.data
      const userData = response.data?.data || response.data;
      return userData;
    },
    enabled: !!token, // CORRETTO: Esegue la query SOLO se c'è un token
    retry: false,
    staleTime: 5 * 60 * 1000 // 5 minuti
  });

  // Mutation per il login
  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await api.auth.login(data);
      return response.data;
    },
    onSuccess: (responseData) => {
      // AGGIORNATO: Gestisce il nuovo formato ResponseFormatter
      const data = responseData.data || responseData; // Compatibilità con vecchio e nuovo formato
      const userObj = (data && (data.user || data.User)) || null;
      const requiresTwoFactor = !!data?.requiresTwoFactor;

      // Gestione 2FA: se richiesta, avvisa e non procede con il redirect
      if (requiresTwoFactor) {
        const msg = responseData.message || 'È richiesta l\'autenticazione a due fattori. Inserisci il codice 2FA.';
        toast.error(msg);
        return;
      }

      // Salva il token
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      // Salva anche l'oggetto utente per retrocompatibilità con componenti che leggono da localStorage
      if (userObj) {
        try {
          localStorage.setItem('user', JSON.stringify(userObj));
        } catch {}
      }
      
      // Invalida e ricarica i dati utente
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      
      // AGGIORNATO: Usa il messaggio dal ResponseFormatter
      const message = responseData.message || 'Login effettuato con successo';
      toast.success(message);
      
      // Redirect basato sul ruolo
      const role = userObj?.role;
      switch (role) {
        case 'ADMIN':
        case 'SUPER_ADMIN':
          navigate('/admin');
          break;
        case 'PROFESSIONAL':
          navigate('/professional');
          break;
        case 'CLIENT':
        default:
          navigate('/dashboard');
          break;
      }
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      // AGGIORNATO: Gestisce il nuovo formato degli errori ResponseFormatter
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error?.message ||
                          'Errore durante il login';
      toast.error(errorMessage);
    }
  });

  // Mutation per il logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await api.auth.logout();
      return response.data;
    },
    onSuccess: (responseData) => {
      // Pulisci storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Pulisci cache
      queryClient.clear();
      
      // AGGIORNATO: Usa il messaggio dal ResponseFormatter
      const message = responseData?.message || 'Logout effettuato';
      toast.success(message);
      navigate('/login');
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Logout anche in caso di errore
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      queryClient.clear();
      navigate('/login');
    }
  });

  // Mutation per la registrazione
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await api.auth.register(data);
      return response.data;
    },
    onSuccess: (responseData) => {
      // AGGIORNATO: Gestisce il nuovo formato ResponseFormatter
      const data = responseData.data || responseData; // Compatibilità con vecchio e nuovo formato
      
      // Se la registrazione include login automatico (token)
      if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        
        // Invalida e ricarica i dati utente
        queryClient.invalidateQueries({ queryKey: ['auth'] });
        
        const message = responseData?.message || 'Registrazione completata e login effettuato!';
        toast.success(message);
        
        // Redirect basato sul ruolo
        switch (data.user?.role) {
          case 'ADMIN':
          case 'SUPER_ADMIN':
            navigate('/admin');
            break;
          case 'PROFESSIONAL':
            navigate('/professional');
            break;
          case 'CLIENT':
          default:
            navigate('/dashboard');
            break;
        }
      } else {
        // Registrazione senza login automatico
        const message = responseData?.message || 
                       'Registrazione completata! Controlla la tua email per verificare l\'account.';
        toast.success(message);
        navigate('/login');
      }
    },
    onError: (error: any) => {
      console.error('Registration error:', error);
      // AGGIORNATO: Gestisce il nuovo formato degli errori ResponseFormatter
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error?.message ||
                          'Errore durante la registrazione';
      toast.error(errorMessage);
    }
  });

  // Mutation per il reset password
  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await api.auth.forgotPassword(email);
      return response.data;
    },
    onSuccess: (responseData) => {
      // AGGIORNATO: Usa il messaggio dal ResponseFormatter
      const message = responseData?.message || 'Email di reset password inviata!';
      toast.success(message);
    },
    onError: (error: any) => {
      console.error('Reset password error:', error);
      // AGGIORNATO: Gestisce il nuovo formato degli errori ResponseFormatter
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error?.message ||
                          'Errore durante il reset password';
      toast.error(errorMessage);
    }
  });

  // Mutation per aggiornare il profilo
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const response = await api.users.updateProfile(data);
      return response.data;
    },
    onSuccess: (responseData) => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      // AGGIORNATO: Usa il messaggio dal ResponseFormatter
      const message = responseData?.message || 'Profilo aggiornato con successo';
      toast.success(message);
    },
    onError: (error: any) => {
      console.error('Update profile error:', error);
      // AGGIORNATO: Gestisce il nuovo formato degli errori ResponseFormatter
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error?.message ||
                          'Errore durante l\'aggiornamento del profilo';
      toast.error(errorMessage);
    }
  });

  // Funzione per verificare se l'utente è autenticato
  // FIX: considera autenticato se esiste un token; l'utente può arrivare poco dopo via /users/profile
  const isAuthenticated = !!token;

  // Funzione per verificare i permessi
  const hasRole = (roles: string | string[]) => {
    if (!user) return false;
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    return rolesArray.includes(user.role);
  };

  // Funzione per verificare se è admin
  const isAdmin = hasRole(['ADMIN', 'SUPER_ADMIN']);

  // Funzione per verificare se è professionista
  const isProfessional = hasRole('PROFESSIONAL');

  // Funzione per verificare se è cliente
  const isClient = hasRole('CLIENT');

  // Funzioni helper per compatibilità
  const login = (emailOrData: string | LoginData, password?: string) => {
    if (typeof emailOrData === 'string' && password) {
      // Formato vecchio: login(email, password)
      return loginMutation.mutateAsync({ email: emailOrData, password });
    } else {
      // Formato nuovo: login({ email, password })
      return loginMutation.mutateAsync(emailOrData as LoginData);
    }
  };

  // Funzione logout che ritorna una Promise
  const logout = () => {
    return logoutMutation.mutateAsync();
  };

  return {
    // Dati utente
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    
    // Controlli ruolo
    hasRole,
    isAdmin,
    isProfessional,
    isClient,
    
    // Mutations con funzioni helper
    login,
    logout, // Ora usa la funzione che ritorna Promise
    register: registerMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    
    // Stati delle mutations
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isRegistering: registerMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending
  };
};

export default useAuth;