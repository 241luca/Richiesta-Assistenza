import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserIcon, 
  CogIcon,
  ChevronRightIcon 
} from '@heroicons/react/24/outline';

export function ProfessionalCard({ professional }: { professional: any }) {
  const navigate = useNavigate();
  
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <UserIcon className="h-10 w-10 text-gray-400 mr-4" />
          <div>
            <h3 className="text-lg font-semibold">
              {professional.firstName} {professional.lastName}
            </h3>
            <p className="text-sm text-gray-600">{professional.email}</p>
            <p className="text-sm text-gray-500">{professional.professionData?.name || professional.profession || 'Professionista'}</p>
          </div>
        </div>
        
        <button
          onClick={() => navigate(`/admin/professionals/${professional.id}/competenze`)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <CogIcon className="h-5 w-5 mr-2" />
          Gestisci
          <ChevronRightIcon className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
}
