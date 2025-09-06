import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
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
  codiceFiscale?: string;
  partitaIva?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');
    
    if (storedUser && accessToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:3200/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // Prima controlla se la risposta è JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server error: ' + text);
      }

      const data = await response.json();

      if (response.ok) {
        // NUOVO: Gestisce il formato ResponseFormatter
        const responseData = data.data;
        
        // Check if 2FA is required
        if (responseData.requiresTwoFactor) {
          throw new Error('2FA_REQUIRED');
        }
        
        // Salva i token
        localStorage.setItem('accessToken', responseData.accessToken);
        localStorage.setItem('refreshToken', responseData.refreshToken);
        localStorage.setItem('user', JSON.stringify(responseData.user));
        setUser(responseData.user);
      } else {
        // NUOVO: Gestisce il formato errori ResponseFormatter
        const errorMessage = data.message || 'Login failed';
        
        if (response.status === 423) {
          throw new Error('Account locked. Too many failed attempts. Please try again later.');
        } else if (response.status === 401) {
          throw new Error(errorMessage);
        } else {
          throw new Error(errorMessage);
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (registerData: RegisterData) => {
    try {
      const response = await fetch('http://localhost:3200/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server error: ' + text);
      }

      const data = await response.json();

      if (response.ok) {
        // NUOVO: Gestisce il formato ResponseFormatter
        const responseData = data.data;
        
        // Salva automaticamente i token (registro + login automatico)
        localStorage.setItem('accessToken', responseData.accessToken);
        localStorage.setItem('refreshToken', responseData.refreshToken);
        localStorage.setItem('user', JSON.stringify(responseData.user));
        setUser(responseData.user);
      } else {
        // NUOVO: Gestisce il formato errori ResponseFormatter
        const errorMessage = data.message || 'Registration failed';
        
        if (response.status === 409) {
          throw new Error('An account with this email already exists');
        } else {
          throw new Error(errorMessage);
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const refreshToken = async () => {
    const token = localStorage.getItem('refreshToken');
    if (!token) {
      throw new Error('No refresh token');
    }

    const response = await fetch('http://localhost:3200/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: token }),
    });

    const data = await response.json();

    if (response.ok) {
      // NUOVO: Gestisce il formato ResponseFormatter
      const responseData = data.data;
      localStorage.setItem('accessToken', responseData.accessToken);
      localStorage.setItem('refreshToken', responseData.refreshToken);
    } else {
      logout();
      throw new Error('Token refresh failed');
    }
  };

  return (
    <AuthContext.Provider 
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
