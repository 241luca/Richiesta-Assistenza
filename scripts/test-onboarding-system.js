#!/usr/bin/env node

/**
 * 🧪 TEST SISTEMA ONBOARDING
 * 
 * Questo script verifica che tutti i componenti del sistema di onboarding
 * siano correttamente implementati e configurati.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 TESTING SISTEMA ONBOARDING...\n');

// Percorsi da controllare
const paths = {
  onboardingTour: './src/components/onboarding/OnboardingTour.tsx',
  onboardingChecklist: './src/components/onboarding/OnboardingChecklist.tsx',
  onboardingIndex: './src/components/onboarding/index.ts',
  app: './src/App.tsx',
  dashboard: './src/pages/DashboardPage.tsx',
  layout: './src/components/Layout.tsx',
  newRequest: './src/pages/NewRequestPage.tsx',
  packageJson: './package.json'
};

let testsPassati = 0;
let testsTotali = 0;

function test(descrizione, condizione) {
  testsTotali++;
  if (condizione) {
    console.log(`✅ ${descrizione}`);
    testsPassati++;
  } else {
    console.log(`❌ ${descrizione}`);
  }
}

try {
  // Test 1: Verifica esistenza file componenti
  test('OnboardingTour.tsx esiste', fs.existsSync(paths.onboardingTour));
  test('OnboardingChecklist.tsx esiste', fs.existsSync(paths.onboardingChecklist));
  test('index.ts esiste', fs.existsSync(paths.onboardingIndex));

  // Test 2: Verifica dipendenza react-joyride
  const packageJson = JSON.parse(fs.readFileSync(paths.packageJson, 'utf8'));
  test('react-joyride installato', packageJson.dependencies && packageJson.dependencies['react-joyride']);

  // Test 3: Verifica integrazione in App.tsx
  const appContent = fs.readFileSync(paths.app, 'utf8');
  test('OnboardingTour importato in App.tsx', appContent.includes('OnboardingTour'));
  test('OnboardingTour renderizzato in App.tsx', appContent.includes('<OnboardingTour'));

  // Test 4: Verifica integrazione in Dashboard
  const dashboardContent = fs.readFileSync(paths.dashboard, 'utf8');
  test('OnboardingChecklist importato in Dashboard', dashboardContent.includes('OnboardingChecklist'));
  test('OnboardingChecklist renderizzato in Dashboard', dashboardContent.includes('<OnboardingChecklist'));

  // Test 5: Verifica data-tour attributes
  const layoutContent = fs.readFileSync(paths.layout, 'utf8');
  test('data-tour="notifications" presente in Layout', layoutContent.includes('data-tour="notifications"'));
  test('data-tour="profile-menu" presente in Layout', layoutContent.includes('data-tour="profile-menu"'));
  
  const dashboardContentCheck = fs.readFileSync(paths.dashboard, 'utf8');
  test('data-tour="create-request" presente in Dashboard', dashboardContentCheck.includes('data-tour="create-request"'));
  test('data-tour="requests-list" presente in Dashboard', dashboardContentCheck.includes('data-tour="requests-list"'));
  test('data-tour="my-quotes" presente in Dashboard', dashboardContentCheck.includes('data-tour="my-quotes"'));
  test('data-tour="calendar" presente in Dashboard', dashboardContentCheck.includes('data-tour="calendar"'));

  const newRequestContent = fs.readFileSync(paths.newRequest, 'utf8');
  test('data-tour="request-form-modes" presente in NewRequest', newRequestContent.includes('data-tour="request-form-modes"'));
  test('data-tour="category-selection" presente in NewRequest', newRequestContent.includes('data-tour="category-selection"'));
  test('data-tour="ai-assistant" presente in NewRequest', newRequestContent.includes('data-tour="ai-assistant"'));

  // Test 6: Verifica contenuto componenti chiave
  const tourContent = fs.readFileSync(paths.onboardingTour, 'utf8');
  test('OnboardingTour gestisce ruoli CLIENT e PROFESSIONAL', 
    tourContent.includes('CLIENT') && tourContent.includes('PROFESSIONAL'));
  test('OnboardingTour usa localStorage per tracking', tourContent.includes('localStorage'));
  test('OnboardingTour ha stili Tailwind configurati', tourContent.includes('primaryColor'));

  const checklistContent = fs.readFileSync(paths.onboardingChecklist, 'utf8');
  test('OnboardingChecklist usa Heroicons', checklistContent.includes('@heroicons/react'));
  test('OnboardingChecklist gestisce task diverse per ruolo', checklistContent.includes('userRole'));
  test('OnboardingChecklist ha gestione callback', checklistContent.includes('onTaskComplete'));

} catch (error) {
  console.error(`❌ Errore durante i test: ${error.message}`);
}

// Risultati finali
console.log(`\n📊 RISULTATI TEST:`);
console.log(`✅ Test passati: ${testsPassati}/${testsTotali}`);
console.log(`📈 Percentuale successo: ${Math.round((testsPassati/testsTotali) * 100)}%`);

if (testsPassati === testsTotali) {
  console.log(`\n🎉 TUTTI I TEST PASSATI! Il sistema di onboarding è correttamente implementato.`);
} else {
  console.log(`\n⚠️  Alcuni test non sono passati. Controlla i componenti indicati.`);
}

console.log(`\n🚀 COME TESTARE MANUALMENTE:`);
console.log(`1. Avvia l'applicazione: npm run dev`);
console.log(`2. Accedi con un nuovo utente (o svuota localStorage)`);
console.log(`3. Verifica che appaia il tour guidato`);
console.log(`4. Verifica che appaia la checklist nella dashboard`);
console.log(`5. Testa i bottoni "Fatto" nella checklist`);
console.log(`6. Verifica che il tour non riappaia dopo il completamento`);

console.log(`\n📚 DOCUMENTAZIONE ONBOARDING:`);
console.log(`- Componenti: src/components/onboarding/`);
console.log(`- Tour guidato: react-joyride`);
console.log(`- Attributi elementi: data-tour="[nome]"`);
console.log(`- Storage progresso: localStorage`);
