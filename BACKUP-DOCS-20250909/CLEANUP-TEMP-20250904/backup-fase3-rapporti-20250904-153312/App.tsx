import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigate, BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Router from './routes';

// Professional Management Pages
import ProfessionalLayout from './pages/admin/professionals/ProfessionalLayout';
import ProfessionalCompetenze from './pages/admin/professionals/competenze/ProfessionalCompetenze';
import ProfessionalTariffe from './pages/admin/professionals/tariffe/ProfessionalTariffe';
import ProfessionalAiSettings from './pages/admin/professionals/ai-settings/ProfessionalAiSettings';
import ProfessionalSkills from './pages/admin/professionals/skills/ProfessionalSkills';
import SimpleBackupPage from './pages/admin/SimpleBackupPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minuti
    },
  },
});

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
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
