import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleMapsProvider } from './contexts/GoogleMapsContext';
import { OnboardingTour } from './components/onboarding';
import { CelebrationProvider } from './components/celebrations';
import { useAuth } from './hooks/useAuth';
import Router from './routes';
import { SocketProvider } from './contexts/SocketContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minuti
    },
  },
});

// Componente wrapper per OnboardingTour che ha accesso a useAuth
const OnboardingWrapper: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  
  // Mostra il tour solo per utenti autenticati
  if (!isAuthenticated || !user) {
    return null;
  }
  
  return (
    <OnboardingTour 
      userRole={user.role} 
      userName={user.firstName || user.email?.split('@')[0] || 'utente'} 
    />
  );
};

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <GoogleMapsProvider>
            <Router />
            <OnboardingWrapper />
            <CelebrationProvider />
          </GoogleMapsProvider>
        </SocketProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              zIndex: 1000, // Sotto il tutorial
            },
            success: {
              style: {
                background: 'green',
              },
            },
            error: {
              style: {
                background: 'red',
              },
            },
          }}
        />
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;