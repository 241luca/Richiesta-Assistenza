import React, { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';

interface OnboardingTourProps {
  userRole?: string;
  userName?: string;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ 
  userRole = 'CLIENT', 
  userName = 'utente' 
}) => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Controlla se è la prima visita per questo utente
    const hasSeenTour = localStorage.getItem(`onboarding_completed_${userRole}`);
    if (!hasSeenTour) {
      // Delay di 2 secondi per far caricare la pagina completamente
      const timer = setTimeout(() => setRun(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [userRole]);

  // Step del tour basati sul ruolo dell'utente
  const getStepsByRole = (): Step[] => {
    const baseSteps: Step[] = [
      {
        target: 'body',
        content: `👋 Ciao ${userName}! Benvenuto nel sistema di richiesta assistenza. Ti guiderò attraverso le funzionalità principali!`,
        placement: 'center',
        disableBeacon: true
      }
    ];

    if (userRole === 'CLIENT') {
      return [
        ...baseSteps,
        {
          target: '[data-tour="create-request"]',
          content: '📝 Qui puoi creare una nuova richiesta di assistenza. Clicca per iniziare!',
          placement: 'bottom'
        },
        {
          target: '[data-tour="request-form-modes"]',
          content: '⚡ Scegli tra modalità veloce (con AI) o standard (completa). Per iniziare, prova la modalità veloce!',
          placement: 'top'
        },
        {
          target: '[data-tour="category-selection"]',
          content: '🏷️ Seleziona prima la categoria del servizio che ti serve, poi la sottocategoria specifica.',
          placement: 'right'
        },
        {
          target: '[data-tour="ai-assistant"]',
          content: '🤖 Hai dubbi? L\'Assistente AI può aiutarti a descrivere il problema e scegliere la categoria giusta!',
          placement: 'left'
        },
        {
          target: '[data-tour="requests-list"]',
          content: '📋 In questa sezione trovi tutte le tue richieste, sia quelle attive che quelle completate.',
          placement: 'right'
        },
        {
          target: '[data-tour="notifications"]',
          content: '🔔 Qui riceverai notifiche in tempo reale sui preventivi, messaggi e aggiornamenti delle tue richieste.',
          placement: 'bottom'
        },
        {
          target: '[data-tour="profile-menu"]',
          content: '👤 Dal menu profilo puoi gestire i tuoi dati, vedere la cronologia e accedere alle impostazioni.',
          placement: 'left'
        }
      ];
    } else if (userRole === 'PROFESSIONAL') {
      return [
        ...baseSteps,
        {
          target: '[data-tour="available-requests"]',
          content: '🔧 Qui vedi tutte le richieste disponibili nella tua zona di competenza. Puoi inviare preventivi!',
          placement: 'bottom'
        },
        {
          target: '[data-tour="my-quotes"]',
          content: '💰 Gestisci tutti i tuoi preventivi: creati, in attesa, accettati o rifiutati.',
          placement: 'right'
        },
        {
          target: '[data-tour="calendar"]',
          content: '📅 Il calendario ti aiuta a organizzare gli interventi e vedere la tua disponibilità.',
          placement: 'bottom'
        },
        {
          target: '[data-tour="profile-menu"]',
          content: '👤 Dal profilo puoi aggiornare le tue competenze, tariffe e dati professionali.',
          placement: 'left'
        }
      ];
    }

    return baseSteps;
  };

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, type } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem(`onboarding_completed_${userRole}`, 'true');
      setRun(false);
    }

    // Log per debugging (rimuovere in produzione)
    console.log('Joyride callback:', { status, action, type });
  };

  return (
    <Joyride
      steps={getStepsByRole()}
      run={run}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableOverlayClose
      styles={{
        options: {
          primaryColor: '#3B82F6', // blu Tailwind
          zIndex: 10000,
          arrowColor: '#fff',
          backgroundColor: '#fff',
          textColor: '#1F2937', // gray-800
          overlayColor: 'rgba(0, 0, 0, 0.6)'
        },
        tooltip: {
          borderRadius: 12,
          fontSize: 16,
          padding: 20,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        },
        buttonNext: {
          backgroundColor: '#3B82F6',
          borderRadius: 8,
          padding: '10px 16px',
          fontSize: 14,
          fontWeight: 600
        },
        buttonBack: {
          color: '#6B7280',
          marginRight: 12,
          fontSize: 14
        },
        buttonSkip: {
          color: '#EF4444',
          fontSize: 14
        },
        spotlight: {
          borderRadius: 8
        }
      }}
      locale={{
        back: 'Indietro',
        close: 'Chiudi',
        last: 'Fine',
        next: 'Avanti',
        skip: 'Salta tutorial'
      }}
      callback={handleJoyrideCallback}
    />
  );
};