// 🧪 PAGINA DI TEST PER LE CELEBRAZIONI
// Vai su http://localhost:5193/test-celebrations per testare tutto!

import React from 'react';
import { CelebrationDemo } from '../components/celebrations/examples';

export const TestCelebrationsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <CelebrationDemo />
    </div>
  );
};
