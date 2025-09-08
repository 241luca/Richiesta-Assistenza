#!/bin/bash

echo "🔧 CREA/AGGIORNA LISTA PROFESSIONISTI CON LINK CORRETTI"
echo "======================================================"

cd /Users/lucamambelli/Desktop/richiesta-assistenza

echo "1. Creo/Aggiorno la pagina lista professionisti:"

cat > src/pages/admin/ProfessionalsList.tsx << 'EOF'
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  UserGroupIcon,
  CogIcon,
  ChevronRightIcon,
  PlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { apiClient } from '../../services/api';

export default function ProfessionalsList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');

  const { data: professionals, isLoading } = useQuery({
    queryKey: ['professionals'],
    queryFn: async () => {
      const response = await apiClient.get('/users/professionals');
      return response.data.data || [];
    }
  });

  const filteredProfessionals = professionals?.filter((prof: any) => {
    const search = searchTerm.toLowerCase();
    return (
      prof.firstName?.toLowerCase().includes(search) ||
      prof.lastName?.toLowerCase().includes(search) ||
      prof.email?.toLowerCase().includes(search) ||
      prof.profession?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">Gestione Professionisti</h1>
              <p className="text-gray-600">
                {professionals?.length || 0} professionisti registrati
              </p>
            </div>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            Aggiungi Professionista
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per nome, email o professione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Lista Professionisti */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento professionisti...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredProfessionals?.map((professional: any) => (
            <div
              key={professional.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                      <span className="text-xl font-bold text-gray-600">
                        {professional.firstName?.[0]}{professional.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {professional.firstName} {professional.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{professional.email}</p>
                      <p className="text-sm text-gray-500">
                        {professional.profession || 'Professionista'} • ID: {professional.id}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Status Badge */}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    professional.isVerified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {professional.isVerified ? 'Verificato' : 'Da verificare'}
                  </span>
                  
                  {/* Gestisci Button */}
                  <button
                    onClick={() => {
                      console.log('Navigating to professional:', professional.id);
                      navigate(`/admin/professionals/${professional.id}/competenze`);
                    }}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <CogIcon className="h-5 w-5 mr-2" />
                    Gestisci
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
              
              {/* Additional Info */}
              <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Telefono:</span>
                  <p className="font-medium">{professional.phone || 'N/D'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Città:</span>
                  <p className="font-medium">{professional.city || 'N/D'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Registrato:</span>
                  <p className="font-medium">
                    {professional.createdAt 
                      ? new Date(professional.createdAt).toLocaleDateString('it-IT')
                      : 'N/D'}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {filteredProfessionals?.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm 
                  ? `Nessun professionista trovato per "${searchTerm}"`
                  : 'Nessun professionista registrato'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
EOF

echo "✅ ProfessionalsList.tsx creato"

echo ""
echo "2. Aggiungo la route per la lista professionisti:"

cat > /tmp/add-professionals-list-route.js << 'SCRIPT'
const fs = require('fs');

// Trova il file routes
let routeFile = 'src/routes.tsx';
if (!fs.existsSync(routeFile)) {
  routeFile = 'src/App.tsx';
}

if (fs.existsSync(routeFile)) {
  let content = fs.readFileSync(routeFile, 'utf8');
  
  // Aggiungi import se non esiste
  if (!content.includes('ProfessionalsList')) {
    content = content.replace(
      /(import.*ProfessionalLayout.*)/,
      '$1\nimport ProfessionalsList from \'./pages/admin/ProfessionalsList\';'
    );
  }
  
  // Aggiungi route se non esiste
  if (!content.includes('path="/admin/professionals"') && !content.includes('path=\"/admin/professionals\"')) {
    // Trova dove aggiungere (prima delle route dei singoli professionisti)
    content = content.replace(
      /(\s*<Route path="\/admin\/professionals\/:professionalId")/,
      '\n        <Route path="/admin/professionals" element={<ProfessionalsList />} />$1'
    );
  }
  
  fs.writeFileSync(routeFile, content);
  console.log('✅ Route lista professionisti aggiunta');
} else {
  console.log('❌ File routes non trovato');
}
SCRIPT

node /tmp/add-professionals-list-route.js
rm -f /tmp/add-professionals-list-route.js

echo ""
echo "3. Test degli ID professionisti:"
echo "Verifica nel database quali sono gli ID reali:"
echo ""
echo "Se hai accesso al database, esegui:"
echo "SELECT id, first_name, last_name FROM users WHERE role = 'PROFESSIONAL';"
echo ""

echo "======================================================"
echo "✅ LISTA PROFESSIONISTI CREATA!"
echo ""
echo "Ora vai su: http://localhost:5193/admin/professionals"
echo ""
echo "Dalla lista potrai cliccare su 'Gestisci' per ogni"
echo "professionista e verrai portato alle sue impostazioni"
echo "con l'ID corretto nell'URL."
echo ""
echo "RIAVVIA IL FRONTEND per vedere le modifiche!"
