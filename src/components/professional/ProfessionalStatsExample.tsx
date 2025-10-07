/**
 * 📋 ESEMPIO USO COMPONENTE ProfessionalStats
 * 
 * Questo file mostra come utilizzare il componente ProfessionalStats
 * nelle varie pagine del progetto.
 */

import React from 'react';
import { ProfessionalStats } from './ProfessionalStats';

// 🎯 ESEMPIO 1: Nel profilo del professionista
export const ProfessionalProfilePage: React.FC = () => {
  const professionalId = "user-id-del-professionista"; // Sostituire con ID reale

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        👨‍🔧 Profilo Professionista
      </h1>
      
      {/* 📊 Componente Statistiche */}
      <ProfessionalStats 
        professionalId={professionalId}
        className="mb-6"
      />
      
      {/* Altri contenuti del profilo... */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Informazioni Personali</h2>
        <p className="text-gray-600">Altri dati del professionista...</p>
      </div>
    </div>
  );
};

// 🎯 ESEMPIO 2: Nella dashboard del professionista
export const ProfessionalDashboard: React.FC = () => {
  const professionalId = "current-user-id"; // ID dell'utente corrente

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          📊 Dashboard Professionista
        </h1>
        <p className="text-gray-600">
          Panoramica delle tue performance e statistiche
        </p>
      </div>

      {/* 📊 Statistiche prominenti in alto */}
      <ProfessionalStats 
        professionalId={professionalId}
        className="mb-8"
      />

      {/* Altri widget della dashboard... */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">📋 Richieste Recenti</h3>
          <p className="text-gray-600">Lista delle ultime richieste...</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">📅 Prossimi Appuntamenti</h3>
          <p className="text-gray-600">Calendario degli interventi...</p>
        </div>
      </div>
    </div>
  );
};

// 🎯 ESEMPIO 3: Nella lista dei professionisti (versione compatta)
export const ProfessionalCard: React.FC<{ professional: any }> = ({ professional }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">
            {professional.firstName} {professional.lastName}
          </h3>
          <p className="text-gray-600">{professional.city}</p>
        </div>
        
        {professional.isVerified && (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            ✅ Verificato
          </span>
        )}
      </div>
      
      {/* 📊 Statistiche compatte */}
      <ProfessionalStats 
        professionalId={professional.id}
        className="mt-4"
      />
      
      <div className="mt-4 flex justify-end">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Visualizza Profilo
        </button>
      </div>
    </div>
  );
};

// 🎯 ESEMPIO 4: Hook personalizzato per le statistiche
export const useProfessionalStats = (professionalId: string) => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['professional-stats', professionalId],
    queryFn: async () => {
      const response = await api.get(`/professionals/${professionalId}/stats`);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000 // Cache per 5 minuti
  });

  // Funzioni helper
  const isHighRated = stats ? stats.averageRating >= 4.5 : false;
  const isExperienced = stats ? stats.completedJobs >= 20 : false;
  const isReliable = stats ? stats.responseRate >= 90 : false;

  return {
    stats,
    isLoading,
    error,
    // Flags utili
    isHighRated,
    isExperienced,
    isReliable,
    isTopProfessional: isHighRated && isExperienced && isReliable
  };
};

// 🎯 ESEMPIO 5: Integrazione con Router
export const ProfessionalStatsRoute: React.FC = () => {
  const { professionalId } = useParams<{ professionalId: string }>();
  
  if (!professionalId) {
    return <div>ID professionista non valido</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <ProfessionalStats professionalId={professionalId} />
    </div>
  );
};

/**
 * 🔧 CONFIGURAZIONE ROUTE (da aggiungere al router principale)
 * 
 * Nel file routes/index.tsx aggiungere:
 * 
 * import { ProfessionalStatsRoute } from '../components/professional/ProfessionalStatsExample';
 * 
 * <Route path="/professionals/:professionalId/stats" element={<ProfessionalStatsRoute />} />
 */

/**
 * 📱 UTILIZZO NEL CODICE ESISTENTE
 * 
 * Per integrare nelle pagine esistenti:
 * 
 * 1. Importare il componente:
 *    import { ProfessionalStats } from '../components/professional/ProfessionalStats';
 * 
 * 2. Usarlo nella pagina:
 *    <ProfessionalStats professionalId={userId} />
 * 
 * 3. Il componente si occupa automaticamente di:
 *    - Caricare i dati dall'API
 *    - Gestire gli stati di loading/error
 *    - Aggiornare automaticamente i dati (cache React Query)
 *    - Mostrare le statistiche in modo visualmente accattivante
 */

/**
 * 🎨 PERSONALIZZAZIONE STYLING
 * 
 * Il componente accetta una prop className per personalizzazioni:
 * 
 * <ProfessionalStats 
 *   professionalId={userId}
 *   className="shadow-lg border-2 border-blue-200" 
 * />
 */

export default {
  ProfessionalProfilePage,
  ProfessionalDashboard,
  ProfessionalCard,
  useProfessionalStats,
  ProfessionalStatsRoute
};
