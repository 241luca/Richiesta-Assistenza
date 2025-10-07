// 🧠 IL CERVELLO DELLE CELEBRAZIONI
// Questo file gestisce quando e come mostrare le celebrazioni

import { create } from 'zustand';

// Definizione di una celebrazione
interface CelebrationData {
  type: 'first_request' | 'tier_upgrade' | 'achievement' | 'request_completed';
  title: string;
  message: string;
  reward?: {
    points?: number;
    badge?: string;
  };
}

// Lo "stato" delle celebrazioni (cosa si ricorda il sistema)
interface CelebrationState {
  isOpen: boolean; // La finestra è aperta?
  type: string; // Che tipo di celebrazione?
  title: string; // Il titolo
  message: string; // Il messaggio
  reward?: any; // Le ricompense
  
  // Le "azioni" che possiamo fare
  celebrate: (data: CelebrationData) => void; // Mostra una celebrazione
  close: () => void; // Chiudi la finestra
}

// 🏪 Il "negozio" che ricorda tutto sulle celebrazioni
export const useCelebration = create<CelebrationState>((set) => ({
  // Stato iniziale (tutto spento)
  isOpen: false,
  type: '',
  title: '',
  message: '',
  reward: undefined,
  
  // 🎉 Funzione per avviare una celebrazione
  celebrate: (data: CelebrationData) => {
    console.log('🎉 Avviando celebrazione:', data.title);
    set({ 
      isOpen: true, 
      type: data.type,
      title: data.title,
      message: data.message,
      reward: data.reward
    });
  },
  
  // ❌ Funzione per chiudere la celebrazione
  close: () => {
    console.log('✅ Celebrazione chiusa');
    set({ isOpen: false });
  }
}));

// 📚 ESEMPI DI CELEBRAZIONI PREDEFINITE
// Puoi usare queste "ricette" già pronte!

export const CELEBRATION_RECIPES = {
  // 🎯 Prima richiesta creata
  FIRST_REQUEST: {
    type: 'first_request' as const,
    title: '🎉 Prima Richiesta Creata!',
    message: 'Fantastico! I professionisti la stanno già guardando!',
    reward: { points: 10, badge: '🥇' }
  },
  
  // ✅ Richiesta completata
  REQUEST_COMPLETED: {
    type: 'request_completed' as const,
    title: '✅ Intervento Completato!',
    message: 'Perfetto! Come è andata? Lascia una recensione!',
    reward: { points: 10 }
  },
  
  // ⭐ Prima recensione
  FIRST_REVIEW: {
    type: 'achievement' as const,
    title: '⭐ Prima Recensione!',
    message: 'Grazie! La tua opinione aiuta altri utenti!',
    reward: { points: 5, badge: '📝' }
  },
  
  // 🥈 Livello Silver
  TIER_SILVER: {
    type: 'tier_upgrade' as const,
    title: '🥈 Livello Silver!',
    message: 'Ora hai 5% di sconto su tutti i servizi!',
    reward: { badge: '🥈' }
  },
  
  // 🥇 Livello Gold
  TIER_GOLD: {
    type: 'tier_upgrade' as const,
    title: '🥇 Livello Gold!',
    message: 'Complimenti! Supporto prioritario sbloccato!',
    reward: { badge: '🥇' }
  },
  
  // 💎 Livello Platinum
  TIER_PLATINUM: {
    type: 'tier_upgrade' as const,
    title: '💎 Livello Platinum!',
    message: 'Sei nella top 1%! Benefici esclusivi!',
    reward: { badge: '💎' }
  },
  
  // 🏆 Cliente veterano (10 richieste)
  VETERAN_CLIENT: {
    type: 'achievement' as const,
    title: '🏆 Cliente Veterano!',
    message: '10 richieste completate! Sei un pro!',
    reward: { points: 50, badge: '🏆' }
  },
  
  // 📝 Top reviewer (5 recensioni)
  TOP_REVIEWER: {
    type: 'achievement' as const,
    title: '📝 Top Reviewer!',
    message: '5 recensioni lasciate! Sei prezioso!',
    reward: { points: 25, badge: '🌟' }
  },
  
  // 🎁 Referral master (5 amici invitati)
  REFERRAL_MASTER: {
    type: 'achievement' as const,
    title: '🎁 Referral Master!',
    message: '5 amici invitati! Ambassador ufficiale!',
    reward: { points: 100, badge: '👑' }
  }
};

// 🎯 FUNZIONI HELPER PER USO FACILE

// Celebra la prima richiesta
export const celebrateFirstRequest = () => {
  const { celebrate } = useCelebration.getState();
  celebrate(CELEBRATION_RECIPES.FIRST_REQUEST);
};

// Celebra richiesta completata  
export const celebrateRequestCompleted = () => {
  const { celebrate } = useCelebration.getState();
  celebrate(CELEBRATION_RECIPES.REQUEST_COMPLETED);
};

// Celebra upgrade di tier
export const celebrateTierUpgrade = (newTier: string) => {
  const { celebrate } = useCelebration.getState();
  
  switch(newTier) {
    case 'SILVER':
      celebrate(CELEBRATION_RECIPES.TIER_SILVER);
      break;
    case 'GOLD':
      celebrate(CELEBRATION_RECIPES.TIER_GOLD);
      break;
    case 'PLATINUM':
      celebrate(CELEBRATION_RECIPES.TIER_PLATINUM);
      break;
  }
};

// Celebra achievement generico
export const celebrateAchievement = (achievementKey: keyof typeof CELEBRATION_RECIPES) => {
  const { celebrate } = useCelebration.getState();
  celebrate(CELEBRATION_RECIPES[achievementKey]);
};
