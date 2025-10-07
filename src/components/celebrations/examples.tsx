// 🎯 ESEMPI PRATICI DI CELEBRAZIONI
// Copia questi esempi nei tuoi componenti per vedere le celebrazioni in azione!

import React from 'react';
import { useCelebrations } from '.'; // Corrected import path
import { useMutation } from '@tanstack/react-query';

// 📝 ESEMPIO 1: Celebrare la prima richiesta
export const RequestCreationExample = () => {
  const { celebrateFirstRequest, celebrateCustom } = useCelebrations();
  
  // Simuliamo la creazione di una richiesta
  const createRequestMutation = useMutation({
    mutationFn: async (requestData: any) => {
      // Qui faresti la chiamata API vera
      // return api.post('/requests', requestData);
      console.log('Creando richiesta...', requestData);
      return { isFirstRequest: true }; // Simuliamo che sia la prima
    },
    onSuccess: (data) => {
      // ✨ Se è la prima richiesta, celebriamo!
      if (data.isFirstRequest) {
        celebrateFirstRequest();
      } else {
        // Altrimenti, celebrazione generica
        celebrateCustom(
          '📝 Nuova Richiesta Creata!',
          'La tua richiesta è stata inviata ai professionisti!',
          'achievement',
          { points: 5 }
        );
      }
    }
  });

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">Test Celebrazione Prima Richiesta</h3>
      <button
        onClick={() => createRequestMutation.mutate({ title: 'Test richiesta' })}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        🎯 Crea Prima Richiesta
      </button>
    </div>
  );
};

// 🏆 ESEMPIO 2: Celebrare upgrade di tier
export const TierUpgradeExample = () => {
  const { celebrateTierUpgrade } = useCelebrations();
  
  // Simuliamo il monitoraggio del tier dell'utente
  const handleTierUpgrade = (newTier: string) => {
    console.log(`Utente promosso a: ${newTier}`);
    celebrateTierUpgrade(newTier);
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">Test Upgrade Tier</h3>
      <div className="space-y-2">
        <button
          onClick={() => handleTierUpgrade('SILVER')}
          className="block px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
        >
          🥈 Promuovi a Silver
        </button>
        <button
          onClick={() => handleTierUpgrade('GOLD')}
          className="block px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          🥇 Promuovi a Gold
        </button>
        <button
          onClick={() => handleTierUpgrade('PLATINUM')}
          className="block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          💎 Promuovi a Platinum
        </button>
      </div>
    </div>
  );
};

// ⭐ ESEMPIO 3: Celebrare achievements
export const AchievementExample = () => {
  const { celebrateAchievement } = useCelebrations();
  
  const achievements = [
    {
      name: '🏆 Cliente Veterano',
      message: '10 richieste completate! Sei un pro!',
      points: 50,
      badge: '🏆'
    },
    {
      name: '📝 Top Reviewer',
      message: '5 recensioni lasciate! Sei prezioso per la community!',
      points: 25,
      badge: '🌟'
    },
    {
      name: '🎁 Referral Master',
      message: '5 amici invitati! Sei un vero ambassador!',
      points: 100,
      badge: '👑'
    }
  ];

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">Test Achievements</h3>
      <div className="space-y-2">
        {achievements.map((achievement, index) => (
          <button
            key={index}
            onClick={() => celebrateAchievement(
              achievement.name,
              achievement.message,
              achievement.points,
              achievement.badge
            )}
            className="block w-full text-left px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            {achievement.name}
          </button>
        ))}
      </div>
    </div>
  );
};

// ✅ ESEMPIO 4: Integrazione con React Query (caso reale)
export const RealWorldExample = () => {
  const { celebrateRequestCompleted, celebrateCustom } = useCelebrations();
  
  // Esempio: Monitoraggio completamento richiesta
  const completeRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      // Chiamata API reale
      // return api.patch(`/requests/${requestId}`, { status: 'COMPLETED' });
      console.log('Completando richiesta:', requestId);
      return { success: true, requestId };
    },
    onSuccess: (data) => {
      // Celebriamo il completamento
      celebrateRequestCompleted();
    },
    onError: (error) => {
      console.error('Errore nel completamento:', error);
    }
  });

  // Esempio: Monitoraggio recensione lasciata
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      // return api.post('/reviews', reviewData);
      console.log('Inviando recensione:', reviewData);
      return { isFirstReview: Math.random() > 0.5 }; // 50% chance prima recensione
    },
    onSuccess: (data) => {
      if (data.isFirstReview) {
        celebrateCustom(
          '⭐ Prima Recensione!',
          'Grazie! La tua opinione aiuta altri utenti!',
          'achievement',
          { points: 5, badge: '📝' }
        );
      }
    }
  });

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">Esempi Integrazione Reale</h3>
      <div className="space-y-2">
        <button
          onClick={() => completeRequestMutation.mutate('123')}
          className="block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          disabled={completeRequestMutation.isPending}
        >
          ✅ Completa Richiesta
        </button>
        <button
          onClick={() => submitReviewMutation.mutate({ rating: 5, text: 'Ottimo!' })}
          className="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={submitReviewMutation.isPending}
        >
          ⭐ Lascia Recensione
        </button>
      </div>
    </div>
  );
};

// 🎪 COMPONENTE DEMO COMPLETO
export const CelebrationDemo = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8">
        🎉 Demo Sistema Celebrazioni
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md">
          <RequestCreationExample />
        </div>
        
        <div className="bg-white rounded-lg shadow-md">
          <TierUpgradeExample />
        </div>
        
        <div className="bg-white rounded-lg shadow-md">
          <AchievementExample />
        </div>
        
        <div className="bg-white rounded-lg shadow-md">
          <RealWorldExample />
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-yellow-100 rounded-lg">
        <h3 className="font-bold text-yellow-800 mb-2">💡 Come usare:</h3>
        <ol className="list-decimal list-inside text-yellow-800 space-y-1">
          <li>Importa <code>useCelebrations</code> nel tuo componente</li>
          <li>Chiama la funzione appropriata quando succede qualcosa di importante</li>
          <li>La celebrazione apparirà automaticamente!</li>
          <li>L'utente vedrà animazioni, messaggi e ricompense</li>
        </ol>
      </div>
    </div>
  );
};
