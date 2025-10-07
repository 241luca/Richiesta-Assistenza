import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CheckCircleIcon, 
  StarIcon, 
  ClockIcon,
  ChartBarIcon,
  CurrencyEuroIcon,
  CalendarIcon,
  TrendingUpIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

// 🎯 Tipi per TypeScript
interface ProfessionalStats {
  completedJobs: number;
  averageRating: number;
  totalReviews: number;
  yearsActive: number;
  responseRate: number;
  totalEarnings: number;
  currentMonthJobs: number;
}

interface ProfessionalStatsProps {
  professionalId: string;
  className?: string;
}

// 🎨 Componente principale
export const ProfessionalStats: React.FC<ProfessionalStatsProps> = ({
  professionalId,
  className = ''
}) => {
  // 📡 Carica le statistiche usando React Query (seguendo i pattern del progetto)
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['professional-stats', professionalId],
    queryFn: async () => {
      const response = await api.get(`/professionals/${professionalId}/stats`);
      return response.data.data as ProfessionalStats;
    },
    staleTime: 5 * 60 * 1000, // Cache per 5 minuti
    gcTime: 10 * 60 * 1000, // Mantieni in cache per 10 minuti
    retry: 2
  });

  // 🔄 Stati di caricamento
  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-8 w-8 bg-gray-200 rounded mx-auto mb-2"></div>
                <div className="h-6 bg-gray-200 rounded mb-1"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ❌ Gestione errori
  if (error || !stats) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-2">⚠️ Errore nel caricamento</div>
          <div className="text-sm text-red-500">
            Non è stato possibile caricare le statistiche
          </div>
        </div>
      </div>
    );
  }

  // 📊 Configurazione delle statistiche da mostrare
  const statItems = [
    {
      icon: CheckCircleIcon,
      value: stats.completedJobs,
      label: 'Lavori Completati',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Interventi conclusi con successo'
    },
    {
      icon: StarIcon,
      value: stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)} ⭐` : 'N/A',
      label: `Rating (${stats.totalReviews} recensioni)`,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'Valutazione media cliente'
    },
    {
      icon: ClockIcon,
      value: stats.yearsActive === 0 ? 'Nuovo' : `${stats.yearsActive}+ anni`,
      label: 'Esperienza',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Anni di attività sulla piattaforma'
    },
    {
      icon: ChartBarIcon,
      value: `${stats.responseRate}%`,
      label: 'Tasso Risposta',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Percentuale di richieste completate'
    }
  ];

  // 📈 Statistiche aggiuntive se ci sono dati interessanti
  const additionalStats = [];
  
  if (stats.totalEarnings > 0) {
    additionalStats.push({
      icon: CurrencyEuroIcon,
      value: `€${stats.totalEarnings.toLocaleString()}`,
      label: 'Guadagni Totali',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      description: 'Fatturato totale dalla piattaforma'
    });
  }

  if (stats.currentMonthJobs > 0) {
    additionalStats.push({
      icon: CalendarIcon,
      value: stats.currentMonthJobs,
      label: 'Lavori Questo Mese',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Interventi completati nel mese corrente'
    });
  }

  // 🏆 Badge di qualità basato sui dati
  const getQualityBadge = () => {
    if (stats.completedJobs >= 50 && stats.averageRating >= 4.5 && stats.responseRate >= 90) {
      return {
        icon: '🏆',
        text: 'Professionista Eccellente',
        color: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
      };
    }
    if (stats.completedJobs >= 20 && stats.averageRating >= 4.0 && stats.responseRate >= 80) {
      return {
        icon: '⭐',
        text: 'Professionista Qualificato',
        color: 'bg-gradient-to-r from-blue-400 to-blue-600 text-white'
      };
    }
    if (stats.completedJobs >= 10) {
      return {
        icon: '✅',
        text: 'Professionista Esperto',
        color: 'bg-gradient-to-r from-green-400 to-green-600 text-white'
      };
    }
    return {
      icon: '🌟',
      text: 'Professionista',
      color: 'bg-gradient-to-r from-gray-400 to-gray-600 text-white'
    };
  };

  const qualityBadge = getQualityBadge();

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 ${className}`}>
      {/* 🏷️ Header con badge di qualità */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          📊 Statistiche Professionista
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${qualityBadge.color}`}>
          {qualityBadge.icon} {qualityBadge.text}
        </div>
      </div>

      {/* 📊 Griglia statistiche principali */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statItems.map((item, index) => (
          <div 
            key={index} 
            className={`${item.bgColor} rounded-lg p-4 text-center hover:shadow-sm transition-shadow`}
            title={item.description}
          >
            <item.icon className={`h-8 w-8 ${item.color} mx-auto mb-2`} />
            <p className="text-2xl font-bold text-gray-900 mb-1">{item.value}</p>
            <p className="text-xs text-gray-600 leading-tight">{item.label}</p>
          </div>
        ))}
      </div>

      {/* 📈 Statistiche aggiuntive se disponibili */}
      {additionalStats.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-2 gap-4">
            {additionalStats.map((item, index) => (
              <div 
                key={index} 
                className={`${item.bgColor} rounded-lg p-4 text-center hover:shadow-sm transition-shadow`}
                title={item.description}
              >
                <item.icon className={`h-6 w-6 ${item.color} mx-auto mb-1`} />
                <p className="text-lg font-bold text-gray-900">{item.value}</p>
                <p className="text-xs text-gray-600">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 💡 Messaggio incoraggiante per professionisti nuovi */}
      {stats.completedJobs === 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center text-blue-700 text-sm">
            <TrendingUpIcon className="h-5 w-5 mr-2" />
            <span>Inizia a completare richieste per costruire la tua reputazione!</span>
          </div>
        </div>
      )}

      {/* 📅 Timestamp ultimo aggiornamento */}
      <div className="mt-4 text-xs text-gray-400 text-center">
        Ultimo aggiornamento: {new Date().toLocaleString('it-IT')}
      </div>
    </div>
  );
};

export default ProfessionalStats;
