import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, CircleStackIcon, PlusIcon, MapPinIcon, BellIcon, CurrencyDollarIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

interface Task {
  id: string;
  label: string;
  description: string;
  done: boolean;
  icon: React.ComponentType<{ className?: string }>;
  userRole: string[];
}

interface OnboardingChecklistProps {
  userRole?: string;
  userName?: string;
  onTaskComplete?: (taskId: string) => void;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({ 
  userRole = 'CLIENT',
  userName = 'utente',
  onTaskComplete 
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const allTasks: Task[] = [
    {
      id: 'complete_profile',
      label: 'Completa il profilo',
      description: 'Aggiungi le tue informazioni personali',
      done: false,
      icon: CircleStackIcon,
      userRole: ['CLIENT', 'PROFESSIONAL']
    },
    {
      id: 'add_address',
      label: 'Aggiungi indirizzo',
      description: 'Inserisci il tuo indirizzo principale',
      done: false,
      icon: MapPinIcon,
      userRole: ['CLIENT', 'PROFESSIONAL']
    },
    {
      id: 'enable_notifications',
      label: 'Attiva notifiche',
      description: 'Ricevi aggiornamenti in tempo reale',
      done: false,
      icon: BellIcon,
      userRole: ['CLIENT', 'PROFESSIONAL']
    },
    // Task specifici per CLIENT
    {
      id: 'first_request',
      label: 'Crea prima richiesta',
      description: 'Pubblica la tua prima richiesta di assistenza',
      done: false,
      icon: PlusIcon,
      userRole: ['CLIENT']
    },
    {
      id: 'try_ai_assistant',
      label: 'Prova l\'Assistente AI',
      description: 'Usa l\'AI per aiutarti con le richieste',
      done: false,
      icon: SparklesIcon,
      userRole: ['CLIENT']
    },
    {
      id: 'first_quote_received',
      label: 'Ricevi primo preventivo',
      description: 'Aspetta che i professionisti ti inviino preventivi',
      done: false,
      icon: CurrencyDollarIcon,
      userRole: ['CLIENT']
    },
    // Task specifici per PROFESSIONAL
    {
      id: 'setup_skills',
      label: 'Configura competenze',
      description: 'Aggiungi le tue competenze professionali',
      done: false,
      icon: CircleStackIcon,
      userRole: ['PROFESSIONAL']
    },
    {
      id: 'setup_rates',
      label: 'Imposta tariffe',
      description: 'Configura le tue tariffe orarie',
      done: false,
      icon: CurrencyDollarIcon,
      userRole: ['PROFESSIONAL']
    },
    {
      id: 'first_quote_sent',
      label: 'Invia primo preventivo',
      description: 'Rispondi a una richiesta con un preventivo',
      done: false,
      icon: PlusIcon,
      userRole: ['PROFESSIONAL']
    }
  ];

  useEffect(() => {
    // Filtra task per ruolo
    const filteredTasks = allTasks.filter(task => 
      task.userRole.includes(userRole)
    );

    // Carica stato salvato
    const savedState = localStorage.getItem(`onboarding_tasks_${userRole}`);
    if (savedState) {
      const savedTasks = JSON.parse(savedState);
      const updatedTasks = filteredTasks.map(task => ({
        ...task,
        done: savedTasks[task.id] || false
      }));
      setTasks(updatedTasks);
    } else {
      setTasks(filteredTasks);
    }
  }, [userRole]);

  const markTaskComplete = (taskId: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, done: true } : task
    );
    setTasks(updatedTasks);

    // Salva stato
    const taskState = updatedTasks.reduce((acc, task) => ({
      ...acc,
      [task.id]: task.done
    }), {});
    localStorage.setItem(`onboarding_tasks_${userRole}`, JSON.stringify(taskState));

    // Callback per parent component
    onTaskComplete?.(taskId);
  };

  const progress = tasks.length > 0 ? (tasks.filter(t => t.done).length / tasks.length) * 100 : 0;
  const completedCount = tasks.filter(t => t.done).length;

  // Non mostrare se tutte le task sono completate
  if (progress === 100) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 mb-6">
        <div className="text-center">
          <CheckCircleIconSolid className="h-12 w-12 text-green-600 mx-auto mb-3" />
          <h3 className="font-bold text-lg text-green-900 mb-2">
            🎉 Complimenti {userName}!
          </h3>
          <p className="text-green-700">
            Hai completato tutti i passaggi dell'onboarding. Ora sei pronto a utilizzare al meglio la piattaforma!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-900">
          🎯 Inizia da qui, {userName}!
        </h3>
        <div className="text-right">
          <span className="text-sm font-semibold text-blue-600">
            {completedCount}/{tasks.length} Completati
          </span>
          <div className="text-xs text-gray-500">
            {Math.round(progress)}% progresso
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
        <div 
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map(task => {
          const IconComponent = task.icon;
          return (
            <div 
              key={task.id} 
              className={`flex items-start gap-4 p-3 rounded-lg transition-all duration-300 ${
                task.done 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {task.done ? (
                  <CheckCircleIconSolid className="h-6 w-6 text-green-600" />
                ) : (
                  <IconComponent className="h-6 w-6 text-blue-500" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${task.done ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                  {task.label}
                </p>
                <p className={`text-sm mt-1 ${task.done ? 'text-green-600' : 'text-gray-500'}`}>
                  {task.description}
                </p>
              </div>

              {!task.done && (
                <button
                  onClick={() => markTaskComplete(task.id)}
                  className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors duration-200"
                >
                  Fatto
                </button>
              )}
            </div>
          );
        })}
      </div>

      {progress > 0 && progress < 100 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Continua così! Mancano solo {tasks.length - completedCount} passaggi per completare la configurazione.
          </p>
        </div>
      )}
    </div>
  );
};