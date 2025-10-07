import React, { useMemo } from 'react';
import dayjs from 'dayjs';

interface UpcomingInterventionsProps {
  interventions: any[];
  onInterventionClick: (intervention: any) => void;
}

/**
 * Prossimi Appuntamenti Ottimizzato
 * Mostra solo i prossimi 3 interventi invece di caricare tutti
 */
export default function UpcomingInterventions({ 
  interventions, 
  onInterventionClick 
}: UpcomingInterventionsProps) {
  // ✅ FIX PROBLEMA 3: Ottimizza il calcolo dei prossimi interventi
  const upcomingInterventions = useMemo(() => {
    const now = dayjs();
    
    // Filtra e ordina solo gli interventi futuri
    const futureInterventions = interventions
      ?.filter(i => {
        const interventionDate = dayjs(i.proposedDate || i.startDate);
        return interventionDate.isAfter(now) && i.status !== 'CANCELLED' && i.status !== 'COMPLETED';
      })
      .sort((a, b) => {
        const dateA = dayjs(a.proposedDate || a.startDate);
        const dateB = dayjs(b.proposedDate || b.startDate);
        return dateA.diff(dateB);
      })
      .slice(0, 3) || []; // Prendi solo i primi 3
    
    return futureInterventions;
  }, [interventions]);

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">
        Prossimi Appuntamenti
      </h3>
      
      {upcomingInterventions.length === 0 ? (
        <div className="text-xs text-gray-500 text-center py-4">
          Nessun intervento programmato
        </div>
      ) : (
        <div className="space-y-2">
          {upcomingInterventions.map(intervention => {
            const interventionDate = dayjs(intervention.proposedDate || intervention.startDate);
            const isToday = interventionDate.isSame(dayjs(), 'day');
            const isTomorrow = interventionDate.isSame(dayjs().add(1, 'day'), 'day');
            
            return (
              <div
                key={intervention.id}
                className="text-xs p-2 bg-white rounded border cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => onInterventionClick(intervention)}
              >
                {/* Data e ora */}
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-gray-800">
                    {interventionDate.format('HH:mm')}
                  </div>
                  <div className={`text-xs px-2 py-0.5 rounded ${
                    isToday 
                      ? 'bg-blue-100 text-blue-700' 
                      : isTomorrow
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isToday ? 'Oggi' : isTomorrow ? 'Domani' : interventionDate.format('DD/MM')}
                  </div>
                </div>
                
                {/* Cliente */}
                <div className="text-gray-600 truncate">
                  {intervention.client?.fullName || intervention.request?.client?.fullName || 'Cliente'}
                </div>
                
                {/* Indirizzo */}
                <div className="text-gray-500 truncate text-xs">
                  {intervention.address || intervention.request?.address || 'Indirizzo non specificato'}
                </div>
                
                {/* Status badge */}
                <div className="mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    intervention.status === 'PROPOSED' 
                      ? 'bg-orange-100 text-orange-700'
                      : intervention.status === 'ACCEPTED'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {intervention.status === 'PROPOSED' 
                      ? 'In attesa' 
                      : intervention.status === 'ACCEPTED'
                      ? 'Confermato'
                      : intervention.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
