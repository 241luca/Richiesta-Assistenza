import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProfessionalLayout from '../pages/admin/professionals/ProfessionalLayout';

export default function ProfessionalRouteWrapper() {
  const { professionalId } = useParams<{ professionalId: string }>();
  const { user } = useAuth();

  // Admin e Super Admin possono vedere tutto
  if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
    return <ProfessionalLayout />;
  }

  // I professionisti possono vedere solo le proprie pagine
  if (user?.role === 'PROFESSIONAL') {
    if (professionalId === user.id) {
      return <ProfessionalLayout />;
    } else {
      // Se un professionista cerca di vedere dati di altri, reindirizza al proprio
      return <Navigate to={`/admin/professionals/${user.id}/competenze`} replace />;
    }
  }

  // Altri ruoli non hanno accesso
  return <Navigate to="/dashboard" />;
}
