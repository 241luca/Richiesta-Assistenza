import React from 'react';

export function TestProfessionalLink() {
  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
      <p className="text-sm mb-2">Test Links:</p>
      <div className="space-y-1">
        <a href="/admin/professionals" className="block underline hover:text-blue-200">
          → Lista Professionisti
        </a>
        <a href="/admin/professionals/1/competenze" className="block underline hover:text-blue-200">
          → Professional ID 1
        </a>
      </div>
    </div>
  );
}
