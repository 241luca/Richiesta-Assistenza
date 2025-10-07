import React, { useMemo } from 'react';
import dayjs from 'dayjs';

interface CalendarStatsProps {
  interventions: any[];
}

/**
 * Statistiche Dinamiche Calendario
 * Calcola statistiche reali in tempo reale basate sugli interventi
 */
export default function CalendarStats({ interventions }: CalendarStatsProps) {
  // ✅ FIX PROBLEMA 3: Calcola statistiche VERE invece di valori hardcoded
  const todayStats = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    
    // Filtra interventi di oggi
    const todayInterventions = interventions?.filter(i => {
      const interventionDate = dayjs(i.proposedDate || i.startDate).format('YYYY-MM-DD');
      return interventionDate === today;
    }) || [];
    
    // Calcola statistiche
    return {
      total: todayInterventions.length,
      completed: todayInterventions.filter(i => i.status === 'COMPLETED').length,
      inProgress: todayInterventions.filter(i => i.status === 'IN_PROGRESS').length,
      pending: todayInterventions.filter(i => i.status === 'PROPOSED' || i.status === 'ACCEPTED').length
    };
  }, [interventions]);

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">
        Statistiche Oggi
      </h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Interventi totali:</span>
          <span className="font-semibold">{todayStats.total}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Completati:</span>
          <span className="font-semibold text-green-600">{todayStats.completed}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">In corso:</span>
          <span className="font-semibold text-blue-600">{todayStats.inProgress}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Da fare:</span>
          <span className="font-semibold text-orange-600">{todayStats.pending}</span>
        </div>
      </div>
      
      {/* Indicatore visivo se ci sono interventi oggi */}
      {todayStats.total > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Completamento</span>
            <span>{todayStats.total > 0 ? Math.round((todayStats.completed / todayStats.total) * 100) : 0}%</span>
          </div>
          <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ 
                width: `${todayStats.total > 0 ? (todayStats.completed / todayStats.total) * 100 : 0}%` 
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
