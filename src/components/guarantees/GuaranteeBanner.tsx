import React from 'react';
import { 
  ShieldCheckIcon, 
  CurrencyEuroIcon, 
  ClockIcon,
  CheckBadgeIcon 
} from '@heroicons/react/24/outline';

interface Guarantee {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
}

export const GuaranteeBanner: React.FC = () => {
  const guarantees: Guarantee[] = [
    {
      icon: ShieldCheckIcon,
      title: '100% Garantito',
      description: 'Soddisfatti o rimborsati',
      color: 'text-green-600'
    },
    {
      icon: ClockIcon,
      title: 'Garanzia 24 mesi',
      description: 'Su tutti i lavori',
      color: 'text-blue-600'
    },
    {
      icon: CurrencyEuroIcon,
      title: 'Assicurato €100.000',
      description: 'Copertura danni',
      color: 'text-purple-600'
    },
    {
      icon: CheckBadgeIcon,
      title: 'Professionisti Verificati',
      description: 'Solo esperti certificati',
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="bg-gradient-to-r from-green-50 via-blue-50 to-emerald-50 rounded-xl p-6 border border-green-200 shadow-lg">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          🛡️ Le Nostre Garanzie
        </h3>
        <p className="text-sm text-gray-600">
          La tua tranquillità è la nostra priorità
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {guarantees.map((guarantee, index) => (
          <div 
            key={index} 
            className="text-center bg-white/70 rounded-lg p-4 hover:bg-white/90 transition-all duration-200 hover:shadow-md"
          >
            <guarantee.icon className={`h-12 w-12 ${guarantee.color} mx-auto mb-3`} />
            <h4 className="font-semibold text-gray-900 mb-1">
              {guarantee.title}
            </h4>
            <p className="text-sm text-gray-600">
              {guarantee.description}
            </p>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-6">
        <a 
          href="/garanzie" 
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors duration-200"
        >
          📋 Scopri tutti i dettagli
        </a>
      </div>
    </div>
  );
};

export default GuaranteeBanner;