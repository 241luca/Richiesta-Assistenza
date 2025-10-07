import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * Loading Badge - Indicatore discreto per refresh in background
 * Appare in alto a destra durante il refresh automatico
 */
export default function LoadingBadge() {
  return (
    <div className="fixed top-20 right-6 z-50 animate-fade-in">
      <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
        <ArrowPathIcon className="w-4 h-4 animate-spin" />
        <span className="text-sm font-medium">Aggiornamento...</span>
      </div>
    </div>
  );
}
