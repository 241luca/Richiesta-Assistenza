// 🎪 COMPONENTE PRINCIPALE DELLE CELEBRAZIONI
// Questo è il componente che aggiungerai alla tua App

import React from 'react';
import { CelebrationModal } from './CelebrationModal';
import { useCelebration } from '../../hooks/useCelebration';

// 🎉 Componente che gestisce TUTTE le celebrazioni dell'app
export const CelebrationProvider: React.FC = () => {
  // Prendiamo tutte le informazioni sulle celebrazioni dal "cervello"
  const { isOpen, type, title, message, reward, close } = useCelebration();

  return (
    <CelebrationModal
      isOpen={isOpen}
      type={type as any} // Il tipo viene dal nostro hook
      title={title}
      message={message}
      reward={reward}
      onClose={close}
    />
  );
};

// 🎯 HOOK PERSONALIZZATO PER USO FACILE
// Questo ti permette di usare le celebrazioni ovunque nell'app!

export const useCelebrations = () => {
  const { celebrate } = useCelebration();
  
  return {
    // 🎉 Celebra la prima richiesta
    celebrateFirstRequest: () => {
      celebrate({
        type: 'first_request',
        title: '🎉 Prima Richiesta Creata!',
        message: 'Fantastico! I professionisti la stanno già guardando!',
        reward: { points: 10, badge: '🥇' }
      });
    },
    
    // ✅ Celebra richiesta completata
    celebrateRequestCompleted: () => {
      celebrate({
        type: 'request_completed',
        title: '✅ Intervento Completato!',
        message: 'Perfetto! Come è andata? Lascia una recensione!',
        reward: { points: 10 }
      });
    },
    
    // 🏆 Celebra upgrade di livello
    celebrateTierUpgrade: (tier: string) => {
      const tierData = {
        SILVER: {
          title: '🥈 Livello Silver!',
          message: 'Ora hai 5% di sconto su tutti i servizi!',
          badge: '🥈'
        },
        GOLD: {
          title: '🥇 Livello Gold!',
          message: 'Complimenti! Supporto prioritario sbloccato!',
          badge: '🥇'
        },
        PLATINUM: {
          title: '💎 Livello Platinum!',
          message: 'Sei nella top 1%! Benefici esclusivi!',
          badge: '💎'
        }
      };
      
      const data = tierData[tier as keyof typeof tierData];
      if (data) {
        celebrate({
          type: 'tier_upgrade',
          title: data.title,
          message: data.message,
          reward: { badge: data.badge }
        });
      }
    },
    
    // ⭐ Celebra achievement generico
    celebrateAchievement: (title: string, message: string, points?: number, badge?: string) => {
      celebrate({
        type: 'achievement',
        title,
        message,
        reward: { points, badge }
      });
    },
    
    // 🎯 Celebrazione personalizzata (per casi speciali)
    celebrateCustom: (title: string, message: string, type: 'first_request' | 'tier_upgrade' | 'achievement' | 'request_completed' = 'achievement', reward?: { points?: number; badge?: string }) => {
      celebrate({
        type,
        title,
        message,
        reward
      });
    }
  };
};
