import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProfessionalSkillsRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'PROFESSIONAL' && user?.id) {
      // Reindirizza il professionista alla propria pagina competenze
      navigate(`/admin/professionals/${user.id}/competenze`, { replace: true });
    }
  }, [user, navigate]);

  // Se non è un professionista, vai al dashboard
  if (user?.role !== 'PROFESSIONAL') {
    return <Navigate to="/dashboard" replace />;
  }

  // Mostra un loading mentre reindirizza
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Caricamento competenze...</p>
      </div>
    </div>
  );
}
