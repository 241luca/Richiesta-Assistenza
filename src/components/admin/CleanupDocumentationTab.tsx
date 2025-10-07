// 📚 TAB DOCUMENTAZIONE CLEANUP - SISTEMA BACKUP
// src/components/admin/CleanupDocumentationTab.tsx

import React, { useState } from 'react';
import {
  InformationCircleIcon,
  FolderIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  CogIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  ClockIcon,
  ServerIcon,
  CodeBracketIcon,
  LightBulbIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const CleanupDocumentationTab: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['intro']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const SectionHeader = ({ id, title, icon: Icon, description }: any) => (
    <div
      onClick={() => toggleSection(id)}
      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer rounded-lg transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-6 w-6 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      {expandedSections.includes(id) ? (
        <ChevronDownIcon className="h-5 w-5 text-gray-500" />
      ) : (
        <ChevronRightIcon className="h-5 w-5 text-gray-500" />
      )}
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header Principale */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <BookOpenIcon className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            Documentazione Sistema Cleanup
          </h1>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Guida completa al sistema di gestione dei file temporanei di sviluppo. 
          Il sistema sposta i file in cartelle datate invece di eliminarli, permettendo 
          un recupero sicuro quando necessario.
        </p>
      </div>

      {/* Sezione 1: Introduzione */}
      <div className="bg-white rounded-lg shadow">
        <SectionHeader
          id="intro"
          title="Cos'è il Sistema Cleanup"
          icon={InformationCircleIcon}
          description="Panoramica generale e concetti fondamentali"
        />
        {expandedSections.includes('intro') && (
          <div className="p-6 space-y-4">
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Il <strong>Sistema di Gestione Cleanup</strong> è una funzionalità avanzata che permette di 
                mantenere pulito l'ambiente di sviluppo spostando i file temporanei in cartelle apposite 
                invece di eliminarli definitivamente.
              </p>
              
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <h4 className="font-semibold text-blue-900 mb-2">🎯 Obiettivi Principali:</h4>
                <ul className="space-y-2 text-blue-800">
                  <li>• <strong>Sicurezza</strong>: Nessuna perdita accidentale di file</li>
                  <li>• <strong>Tracciabilità</strong>: Ogni file può essere recuperato</li>
                  <li>• <strong>Organizzazione</strong>: Ambiente di sviluppo sempre pulito</li>
                  <li>• <strong>Efficienza</strong>: Processo automatizzato e veloce</li>
                </ul>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <CheckCircleIcon className="h-8 w-8 text-green-600 mb-2" />
                  <h5 className="font-semibold text-green-900">Zero Perdite</h5>
                  <p className="text-sm text-green-700 mt-1">
                    I file vengono spostati, mai eliminati direttamente
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <ClockIcon className="h-8 w-8 text-purple-600 mb-2" />
                  <h5 className="font-semibold text-purple-900">Timestamp Automatico</h5>
                  <p className="text-sm text-purple-700 mt-1">
                    Ogni cartella ha data e ora precise di creazione
                  </p>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <FolderIcon className="h-8 w-8 text-orange-600 mb-2" />
                  <h5 className="font-semibold text-orange-900">Struttura Preservata</h5>
                  <p className="text-sm text-orange-700 mt-1">
                    I path relativi vengono mantenuti intatti
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sezione 2: Come Funziona */}
      <div className="bg-white rounded-lg shadow">
        <SectionHeader
          id="howto"
          title="Come Funziona"
          icon={CogIcon}
          description="Il processo passo-passo del sistema cleanup"
        />
        {expandedSections.includes('howto') && (
          <div className="p-6">
            <div className="space-y-6">
              {/* Workflow Steps */}
              <div className="relative">
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                
                {[
                  {
                    step: 1,
                    title: "Scansione Directory",
                    desc: "Il sistema analizza ricorsivamente le directory del progetto (max 2 livelli)",
                    icon: ServerIcon,
                    color: "blue"
                  },
                  {
                    step: 2,
                    title: "Pattern Matching",
                    desc: "Identifica i file che corrispondono ai pattern configurati (*.backup-*, fix-*.sh, ecc.)",
                    icon: CodeBracketIcon,
                    color: "purple"
                  },
                  {
                    step: 3,
                    title: "Creazione Cartella Datata",
                    desc: "Crea una nuova cartella CLEANUP-YYYY-MM-DD-HH-mm-ss nella root",
                    icon: FolderIcon,
                    color: "green"
                  },
                  {
                    step: 4,
                    title: "Spostamento File",
                    desc: "Sposta i file mantenendo la struttura delle directory originali",
                    icon: ArrowRightIcon,
                    color: "orange"
                  },
                  {
                    step: 5,
                    title: "Generazione README",
                    desc: "Crea un file README.md con il riepilogo dell'operazione",
                    icon: DocumentTextIcon,
                    color: "indigo"
                  }
                ].map((item, index) => (
                  <div key={index} className="relative flex items-start mb-8">
                    <div className={`z-10 flex items-center justify-center w-16 h-16 bg-${item.color}-100 border-4 border-white rounded-full shadow-md`}>
                      <item.icon className={`h-8 w-8 text-${item.color}-600`} />
                    </div>
                    <div className="ml-6 flex-1">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Passo {item.step}: {item.title}
                      </h4>
                      <p className="text-gray-600 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Esempio di Struttura */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">📁 Esempio Struttura Cartella Cleanup:</h4>
                <pre className="text-sm text-gray-700 font-mono bg-white p-3 rounded border">
{`CLEANUP-2025-09-09-14-30-45/
├── README.md
├── backend/
│   ├── fix-database.sh
│   ├── test-api.sh
│   └── services/
│       └── user.service.backup-20250909.ts
├── src/
│   ├── Dashboard.fixed.tsx
│   └── components/
│       └── Header.backup-20250908.tsx
└── scripts/
    └── debug-websocket.sh`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sezione 3: File Gestiti */}
      <div className="bg-white rounded-lg shadow">
        <SectionHeader
          id="patterns"
          title="Pattern File Gestiti"
          icon={DocumentTextIcon}
          description="Quali file vengono spostati durante il cleanup"
        />
        {expandedSections.includes('patterns') && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pattern
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Esempi
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azione
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[
                    { pattern: '*.backup-*', tipo: 'Backup automatici', esempio: 'api.service.backup-20250909.ts', action: 'move' },
                    { pattern: 'fix-*.sh', tipo: 'Script correzione', esempio: 'fix-database.sh', action: 'move' },
                    { pattern: 'test-*.sh', tipo: 'Script test', esempio: 'test-backup.sh', action: 'move' },
                    { pattern: 'check-*.sh', tipo: 'Script verifica', esempio: 'check-system.sh', action: 'move' },
                    { pattern: 'debug-*.sh', tipo: 'Script debug', esempio: 'debug-websocket.sh', action: 'move' },
                    { pattern: '*.fixed.ts', tipo: 'TypeScript corretti', esempio: 'user.service.fixed.ts', action: 'move' },
                    { pattern: '*.fixed.tsx', tipo: 'React corretti', esempio: 'Dashboard.fixed.tsx', action: 'move' },
                    { pattern: 'backup-*.sql', tipo: 'Backup SQL', esempio: 'backup-20250909.sql', action: 'move' },
                    { pattern: '*.mjs', tipo: 'Moduli JS temp', esempio: 'temp-module.mjs', action: 'move' },
                    { pattern: 'BACKUP-*', tipo: 'Directory backup', esempio: 'BACKUP-EMERGENCY/', action: 'move' }
                  ].map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm font-mono">
                          {row.pattern}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.tipo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600 font-mono">{row.esempio}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          ✅ Sposta
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Directory Escluse */}
            <div className="mt-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">🚫 Directory Sempre Escluse</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { dir: 'node_modules', reason: 'Dipendenze NPM (rigenerabile)', critical: true },
                  { dir: '.git', reason: 'Repository Git (critico)', critical: true },
                  { dir: 'dist', reason: 'Build produzione', critical: false },
                  { dir: 'build', reason: 'Build sviluppo', critical: false },
                  { dir: '.next', reason: 'Cache Next.js', critical: false },
                  { dir: 'CLEANUP-*', reason: 'Evita ricorsione', critical: true },
                  { dir: 'backend/backups', reason: 'Backup ufficiali', critical: true },
                  { dir: 'uploads', reason: 'File utenti', critical: true }
                ].map((item, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${item.critical ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    <div className="flex items-start gap-2">
                      <XCircleIcon className={`h-5 w-5 mt-0.5 ${item.critical ? 'text-red-600' : 'text-yellow-600'}`} />
                      <div>
                        <code className="font-mono font-semibold text-gray-800">{item.dir}</code>
                        <p className="text-sm text-gray-600 mt-1">{item.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sezione 4: Guida Operativa */}
      <div className="bg-white rounded-lg shadow">
        <SectionHeader
          id="guide"
          title="Guida Operativa"
          icon={AcademicCapIcon}
          description="Come utilizzare il sistema nel quotidiano"
        />
        {expandedSections.includes('guide') && (
          <div className="p-6 space-y-6">
            {/* Workflow Consigliato */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">📅 Workflow Consigliato</h4>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">1</span>
                    <div>
                      <strong className="text-blue-900">Controllo Settimanale</strong>
                      <p className="text-blue-700">Ogni lunedì, controlla le cartelle di cleanup accumulate</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">2</span>
                    <div>
                      <strong className="text-blue-900">Valutazione</strong>
                      <p className="text-blue-700">Identifica cartelle con badge "Vecchia" (&gt; 7 giorni)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">3</span>
                    <div>
                      <strong className="text-blue-900">Eliminazione Sicura</strong>
                      <p className="text-blue-700">Elimina cartelle &gt; 30 giorni dopo verifica contenuto</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Best Practices */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  Best Practices (DO's)
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Controlla regolarmente (settimanale)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Elimina cartelle &gt; 30 giorni</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Documenta se recuperi file importanti</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Fai backup prima di eliminazioni massive</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Monitora lo spazio occupato</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                  Da Evitare (DON'Ts)
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                    <span className="text-gray-700">Non eliminare cartelle &lt; 7 giorni</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                    <span className="text-gray-700">Non eliminare durante sviluppo attivo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                    <span className="text-gray-700">Non modificare manualmente le cartelle</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                    <span className="text-gray-700">Non rinominare le cartelle CLEANUP</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                    <span className="text-gray-700">Non ignorare per mesi</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Frequenze Consigliate */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">⏰ Frequenze Consigliate</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attività</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequenza</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durata</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priorità</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[
                      { task: 'Revisione cartelle', freq: 'Settimanale', time: '5 min', priority: 'Alta' },
                      { task: 'Eliminazione vecchie', freq: 'Bisettimanale', time: '2 min', priority: 'Alta' },
                      { task: 'Cleanup completo', freq: 'Mensile', time: '10 min', priority: 'Media' },
                      { task: 'Verifica spazio', freq: 'Giornaliera', time: '1 min', priority: 'Bassa' },
                      { task: 'Backup pre-cleanup', freq: 'Prima eliminazione', time: '5 min', priority: 'Alta' }
                    ].map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.task}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.freq}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.time}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.priority === 'Alta' ? 'bg-red-100 text-red-800' :
                            item.priority === 'Media' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {item.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sezione 5: Troubleshooting */}
      <div className="bg-white rounded-lg shadow">
        <SectionHeader
          id="troubleshooting"
          title="Risoluzione Problemi"
          icon={ExclamationTriangleIcon}
          description="Soluzioni ai problemi comuni"
        />
        {expandedSections.includes('troubleshooting') && (
          <div className="p-6 space-y-4">
            {[
              {
                problem: "Nessuna cartella di cleanup presente",
                cause: "Le cartelle vengono create solo quando si esegue una pulizia",
                solution: "Non è un errore. Significa che non è stato ancora eseguito alcun cleanup",
                severity: "info"
              },
              {
                problem: "Errore durante l'eliminazione",
                cause: "File in uso da altri processi o permessi insufficienti",
                solution: "1. Chiudi tutti gli editor/IDE\n2. Verifica permessi filesystem\n3. Ricarica la pagina",
                severity: "warning"
              },
              {
                problem: "Spazio disco insufficiente",
                cause: "Troppe cartelle cleanup accumulate",
                solution: "1. Elimina cartelle &gt; 30 giorni\n2. Verifica backup in /backend/backups\n3. Pulisci node_modules",
                severity: "error"
              },
              {
                problem: "Timeout durante operazione",
                cause: "Troppi file da processare",
                solution: "Aumenta il timeout nel service o esegui cleanup più frequenti",
                severity: "warning"
              },
              {
                problem: "Cartella non trovata",
                cause: "La cartella è già stata eliminata",
                solution: "Ricarica la pagina per aggiornare la lista",
                severity: "info"
              }
            ].map((item, index) => (
              <div key={index} className={`border rounded-lg p-4 ${
                item.severity === 'error' ? 'bg-red-50 border-red-200' :
                item.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className={`h-6 w-6 mt-0.5 ${
                    item.severity === 'error' ? 'text-red-600' :
                    item.severity === 'warning' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`} />
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 mb-1">{item.problem}</h5>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Causa:</strong> {item.cause}
                    </p>
                    <div className="bg-white bg-opacity-50 rounded p-2">
                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        <strong>Soluzione:</strong> {item.solution}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sezione 6: Metriche e KPI */}
      <div className="bg-white rounded-lg shadow">
        <SectionHeader
          id="metrics"
          title="Metriche e KPI"
          icon={ChartBarIcon}
          description="Indicatori di performance e obiettivi"
        />
        {expandedSections.includes('metrics') && (
          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">📊 KPI Principali</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { kpi: 'Cartelle accumulate', target: '&lt; 5', alert: '&gt; 10', current: '3' },
                  { kpi: 'Età media', target: '&lt; 14 giorni', alert: '&gt; 30 giorni', current: '8 giorni' },
                  { kpi: 'Spazio occupato', target: '&lt; 500 MB', alert: '&gt; 1 GB', current: '245 MB' },
                  { kpi: 'Frequenza pulizie', target: '≥ 1/settimana', alert: '&lt; 0.5/settimana', current: '1.2/settimana' },
                  { kpi: 'Tasso recupero', target: '&lt; 5%', alert: '&gt; 20%', current: '2.3%' },
                  { kpi: 'Tempo gestione', target: '&lt; 10 min/sett', alert: '&gt; 30 min/sett', current: '7 min/sett' }
                ].map((metric, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 mb-2">{metric.kpi}</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Target:</span>
                        <span className="font-medium text-green-600">{metric.target}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Alert:</span>
                        <span className="font-medium text-red-600">{metric.alert}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-gray-600">Attuale:</span>
                        <span className="font-bold text-blue-600">{metric.current}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Obiettivi Futuri */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">🎯 Obiettivi e Roadmap</h4>
              <div className="space-y-3">
                {[
                  { feature: 'Cleanup schedulato automatico', priority: 'Alta', timeline: 'Q1 2025', benefit: '-90% intervento manuale' },
                  { feature: 'Auto-eliminazione dopo X giorni', priority: 'Alta', timeline: 'Q1 2025', benefit: '-50% spazio storage' },
                  { feature: 'Compressione ZIP automatica', priority: 'Media', timeline: 'Q2 2025', benefit: '-70% spazio occupato' },
                  { feature: 'Report email settimanali', priority: 'Media', timeline: 'Q2 2025', benefit: '+100% awareness' },
                  { feature: 'Analytics dashboard', priority: 'Bassa', timeline: 'Q3 2025', benefit: 'Insights dettagliati' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">{item.feature}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          item.priority === 'Alta' ? 'bg-red-100 text-red-800' :
                          item.priority === 'Media' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{item.benefit}</p>
                    </div>
                    <span className="text-sm font-medium text-blue-600">{item.timeline}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer con Tips */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
        <div className="flex items-start gap-3">
          <LightBulbIcon className="h-8 w-8 text-indigo-600 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">💡 Suggerimenti Pro</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• Imposta un reminder settimanale per controllare le cartelle cleanup</li>
              <li>• Prima di eliminare cartelle vecchie, verifica sempre se contengono file che potrebbero servire</li>
              <li>• Considera di creare uno script automatico per eliminare cartelle &gt; 60 giorni</li>
              <li>• Monitora il trend dello spazio occupato per identificare pattern anomali</li>
              <li>• Documenta nel README del progetto la policy di cleanup adottata</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CleanupDocumentationTab;
