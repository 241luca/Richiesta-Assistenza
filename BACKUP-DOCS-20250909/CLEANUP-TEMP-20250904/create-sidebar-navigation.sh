#!/bin/bash

echo "🎯 CREAZIONE MENU LATERALE PER NAVIGAZIONE"
echo "=========================================="

cd /Users/lucamambelli/Desktop/richiesta-assistenza

echo "1. Creo il layout con menu laterale:"

cat > src/pages/admin/professionals/ProfessionalLayout.tsx << 'EOF'
import React from 'react';
import { NavLink, Outlet, useParams } from 'react-router-dom';
import { 
  AcademicCapIcon,
  CurrencyEuroIcon,
  CpuChipIcon,
  SparklesIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../services/api';

export default function ProfessionalLayout() {
  const { professionalId } = useParams();
  
  const { data: professional } = useQuery({
    queryKey: ['professional', professionalId],
    queryFn: async () => {
      const response = await apiClient.get(`/users/professionals/${professionalId}`);
      return response.data.data;
    }
  });

  const navigation = [
    { 
      name: 'Competenze', 
      href: `/admin/professionals/${professionalId}/competenze`, 
      icon: AcademicCapIcon,
      description: 'Gestisci sottocategorie e competenze'
    },
    { 
      name: 'Tariffe', 
      href: `/admin/professionals/${professionalId}/tariffe`, 
      icon: CurrencyEuroIcon,
      description: 'Configura tariffe e costi'
    },
    { 
      name: 'AI Settings', 
      href: `/admin/professionals/${professionalId}/ai`, 
      icon: CpuChipIcon,
      description: 'Personalizza assistente AI'
    },
    { 
      name: 'Skills', 
      href: `/admin/professionals/${professionalId}/skills`, 
      icon: SparklesIcon,
      description: 'Skills e certificazioni'
    },
  ];

  return (
    <div className="flex h-full bg-gray-50">
      {/* Menu Laterale */}
      <div className="w-80 bg-white shadow-lg">
        {/* Header del menu */}
        <div className="p-6 border-b">
          <a 
            href="/admin/professionals" 
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            <span>Torna alla lista</span>
          </a>
          
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {professional?.firstName} {professional?.lastName}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {professional?.email}
            </p>
            <p className="text-sm text-gray-600">
              {professional?.profession || 'Professionista'}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-start px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="h-6 w-6 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {item.description}
                </div>
              </div>
            </NavLink>
          ))}
        </nav>

        {/* Stats Footer */}
        <div className="p-6 mt-auto border-t">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Stato</span>
              <span className="font-medium text-green-600">Attivo</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Verificato</span>
              <span className="font-medium">
                {professional?.isVerified ? '✓ Sì' : 'No'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Registrato</span>
              <span className="font-medium">
                {professional?.createdAt ? 
                  new Date(professional.createdAt).toLocaleDateString('it-IT') : 
                  'N/D'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
EOF

echo "✅ ProfessionalLayout.tsx creato"

echo ""
echo "2. Aggiorno il routing in routes.tsx o App.tsx:"

cat > /tmp/add-professional-routes.js << 'SCRIPT'
const fs = require('fs');

// Cerca il file routes
let routeFile = null;
if (fs.existsSync('src/routes.tsx')) {
  routeFile = 'src/routes.tsx';
} else if (fs.existsSync('src/routes/index.tsx')) {
  routeFile = 'src/routes/index.tsx';
} else if (fs.existsSync('src/App.tsx')) {
  routeFile = 'src/App.tsx';
}

if (routeFile) {
  let content = fs.readFileSync(routeFile, 'utf8');
  
  // Aggiungi gli import se non esistono
  const imports = `
// Professional Management Pages
import ProfessionalLayout from './pages/admin/professionals/ProfessionalLayout';
import ProfessionalCompetenze from './pages/admin/professionals/ProfessionalCompetenze';
import ProfessionalTariffe from './pages/admin/professionals/ProfessionalTariffe';
import ProfessionalAI from './pages/admin/professionals/ProfessionalAI';
import ProfessionalSkills from './pages/admin/professionals/ProfessionalSkills';
`;

  if (!content.includes('ProfessionalLayout')) {
    // Aggiungi dopo gli altri import
    content = content.replace(
      /(import.*from.*['"]\.\/pages.*['"];?)/,
      '$1\n' + imports
    );
  }

  // Le route da aggiungere
  const routes = `
        {/* Professional Management with Sidebar */}
        <Route path="/admin/professionals/:professionalId" element={<ProfessionalLayout />}>
          <Route index element={<Navigate to="competenze" replace />} />
          <Route path="competenze" element={<ProfessionalCompetenze />} />
          <Route path="tariffe" element={<ProfessionalTariffe />} />
          <Route path="ai" element={<ProfessionalAI />} />
          <Route path="skills" element={<ProfessionalSkills />} />
        </Route>
`;

  // Aggiungi le route se non esistono
  if (!content.includes('ProfessionalLayout')) {
    // Trova dove aggiungere le route (dopo altre route admin)
    content = content.replace(
      /(<Route.*path="\/admin.*\/>)/g,
      '$1\n' + routes
    );
  }

  fs.writeFileSync(routeFile, content);
  console.log('✅ Route aggiunte in', routeFile);
} else {
  console.log('❌ File delle route non trovato');
}
SCRIPT

node /tmp/add-professional-routes.js
rm -f /tmp/add-professional-routes.js

echo ""
echo "3. Aggiungo Navigate import se mancante:"
if [ -f "src/App.tsx" ]; then
  if ! grep -q "Navigate" src/App.tsx; then
    sed -i '' "s/import { BrowserRouter/import { Navigate, BrowserRouter/" src/App.tsx
  fi
  echo "✅ Navigate import verificato"
fi

echo ""
echo "=========================================="
echo "✅ MENU LATERALE CREATO!"
echo ""
echo "Ora quando vai su /admin/professionals/:id vedrai:"
echo "- Menu laterale fisso a sinistra con info professionista"
echo "- 4 voci di menu per navigare tra le sezioni"
echo "- Area contenuto principale a destra che cambia"
echo ""
echo "RIAVVIA IL FRONTEND per vedere le modifiche!"
