// 🎉 FINESTRA MAGICA DELLE CELEBRAZIONI
// Questa finestra appare quando l'utente raggiunge un traguardo!

import React, { useEffect } from 'react';
// import Lottie from 'lottie-react'; // Lo importeremo quando la libreria è installata

// Questi sono i tipi di eventi che possiamo celebrare
interface CelebrationModalProps {
  isOpen: boolean; // La finestra è aperta o chiusa?
  type: 'first_request' | 'tier_upgrade' | 'achievement' | 'request_completed'; // Che tipo di celebrazione?
  title: string; // Il titolo da mostrare (es: "🎉 Prima Richiesta!")
  message: string; // Il messaggio (es: "Fantastico! I professionisti la stanno già guardando!")
  reward?: {
    points?: number; // Punti guadagnati
    badge?: string; // Badge emoji guadagnato
  };
  onClose: () => void; // Funzione per chiudere la finestra
}

// Per ora usiamo semplici emoji invece delle animazioni Lottie
// Quando la libreria sarà installata, le sostituiremo con bellissime animazioni!
const celebrationEmojis = {
  first_request: '🎊', // Coriandoli per la prima richiesta
  tier_upgrade: '🏆', // Trofeo per upgrade di livello
  achievement: '⭐', // Stella per achievement
  request_completed: '✅' // Check per richiesta completata
};

const celebrationColors = {
  first_request: 'bg-gradient-to-r from-pink-500 to-purple-600',
  tier_upgrade: 'bg-gradient-to-r from-yellow-400 to-orange-500',
  achievement: 'bg-gradient-to-r from-blue-500 to-cyan-500',
  request_completed: 'bg-gradient-to-r from-green-500 to-emerald-600'
};

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  type,
  title,
  message,
  reward,
  onClose
}) => {
  
  useEffect(() => {
    if (isOpen) {
      // 🔊 Opzionale: suono di celebrazione
      // const audio = new Audio('/sounds/celebration.mp3');
      // audio.play().catch(() => {}); // Se non c'è il file audio, non fa niente
      
      // ⏰ Chiudi automaticamente dopo 5 secondi
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer); // Pulisci il timer se la finestra si chiude prima
    }
  }, [isOpen, onClose]);

  // Se la finestra è chiusa, non mostrare niente
  if (!isOpen) return null;

  return (
    // 🌑 Sfondo scuro trasparente che copre tutto lo schermo
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300">
      
      {/* 📦 La finestra principale */}
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative overflow-hidden shadow-2xl animate-bounce">
        
        {/* 🌈 Sfondo colorato animato */}
        <div className={`absolute inset-0 ${celebrationColors[type]} opacity-10 animate-pulse`}></div>
        
        {/* ✨ Emoji celebrativa grande */}
        <div className="relative z-10 text-center">
          <div className="text-8xl mb-4 animate-bounce">
            {celebrationEmojis[type]}
          </div>
          
          {/* 📝 Titolo della celebrazione */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          
          {/* 💬 Messaggio descrittivo */}
          <p className="text-lg text-gray-700 mb-4">
            {message}
          </p>

          {/* 🎁 Ricompense (se ci sono) */}
          {reward && (
            <div className="bg-yellow-100 rounded-lg p-4 mb-4 border-2 border-yellow-300">
              {reward.points && (
                <p className="text-2xl font-bold text-yellow-700 animate-pulse">
                  +{reward.points} Punti! 🎉
                </p>
              )}
              {reward.badge && (
                <p className="text-4xl mt-2 animate-bounce">
                  {reward.badge}
                </p>
              )}
            </div>
          )}

          {/* 🔘 Pulsante per chiudere */}
          <button
            onClick={onClose}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            Fantastico! 🚀
          </button>
        </div>
      </div>
    </div>
  );
};
