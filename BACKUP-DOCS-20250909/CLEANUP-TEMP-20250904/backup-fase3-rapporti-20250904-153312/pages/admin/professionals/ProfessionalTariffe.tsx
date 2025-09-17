import React from 'react';
import { useParams } from 'react-router-dom';
import ProfessionalPricingPage from '../../../components/professional/ProfessionalPricingPage';

export default function ProfessionalTariffe() {
  const { professionalId } = useParams();
  
  if (!professionalId) {
    return (
      <div className="p-6 text-center text-gray-500">
        ID professionista mancante
      </div>
    );
  }

  return (
    <ProfessionalPricingPage professionalId={professionalId} />
  );
}
