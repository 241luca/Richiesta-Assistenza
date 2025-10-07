/**
 * Guide Tab Component
 * Documentazione e spiegazioni del sistema Health Check Automation & Alerts
 */

import React, { useState } from 'react';
import {
  BookOpenIcon,
  LightBulbIcon,
  QuestionMarkCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BellIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowRightIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function GuideTab() {
  const [activeSection, setActiveSection] = useState<string>('overview');

  const sections = [
    { id: 'overview', name: 'Panoramica Sistema', icon: BookOpenIcon },
    { id: 'automation', name: 'Come Funziona l\'Automazione', icon: ClockIcon },
    { id: 'alerts', name: 'Sistema di Alert', icon: BellIcon },
    { id: 'modules', name: 'Moduli Monitorati', icon: CheckCircleIcon },
    { id: 'remediation', name: 'Auto-Riparazione', icon: WrenchScrewdriverIcon },
    { id: 'reports', name: 'Report Automatici', icon: DocumentTextIcon },
    { id: 'faq', name: 'Domande Frequenti', icon: QuestionMarkCircleIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {section.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {activeSection === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <BookOpenIcon className="h-8 w-8 text-blue-500 mr-3" />
                Panoramica del Sistema Health Check
              </h2>
              <p className="text-gray-700 mb-4">
                Il sistema <strong>Health Check Automation & Alerts</strong> è una soluzione completa per monitorare, 
                analizzare e mantenere la salute del tuo sistema in modo completamente automatico.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">🎯 Cosa Fa il Sistema</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Controlla automaticamente tutti i moduli del sistema</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Invia alert quando rileva problemi</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Ripara automaticamente problemi comuni</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Genera report settimanali dettagliati</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Monitora le performance in tempo reale</span>
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">✨ Vantaggi Principali</h3>
                <ul className="space-y-2 text-sm text-green-800">
                  <li className="flex items-start">
                    <ArrowRightIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>Proattivo:</strong> Previene i problemi prima che diventino critici</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRightIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>Automatico:</strong> Non richiede intervento manuale</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRightIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>Intelligente:</strong> Impara dai pattern e si auto-ottimizza</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRightIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>Completo:</strong> Copre tutti gli aspetti del sistema</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">📊 Componenti del Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <ClockIcon className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                  <h4 className="font-medium">Scheduler</h4>
                  <p className="text-sm text-gray-600">Esegue controlli programmati</p>
                </div>
                <div className="text-center">
                  <BellIcon className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                  <h4 className="font-medium">Alert System</h4>
                  <p className="text-sm text-gray-600">Notifica problemi in tempo reale</p>
                </div>
                <div className="text-center">
                  <WrenchScrewdriverIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <h4 className="font-medium">Auto-Remediation</h4>
                  <p className="text-sm text-gray-600">Risolve problemi automaticamente</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'automation' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <ClockIcon className="h-8 w-8 text-blue-500 mr-3" />
                Come Funziona l'Automazione
              </h2>
              <p className="text-gray-700 mb-4">
                Il sistema di automazione opera 24/7 per mantenere il tuo sistema sempre efficiente e funzionante.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <h3 className="font-semibold text-blue-900 mb-2">🔄 Ciclo di Automazione</h3>
                <ol className="space-y-3 text-sm text-blue-800">
                  <li className="flex items-start">
                    <span className="font-bold mr-2">1.</span>
                    <div>
                      <strong>Controllo Schedulato:</strong> Ogni modulo viene controllato secondo la sua frequenza 
                      (es: database ogni 5 minuti, backup ogni 6 ore)
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">2.</span>
                    <div>
                      <strong>Analisi Risultati:</strong> Il sistema calcola un punteggio di salute (0-100) 
                      per ogni modulo controllato
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">3.</span>
                    <div>
                      <strong>Valutazione Soglie:</strong> Se il punteggio è sotto la soglia configurata, 
                      scatta un alert
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">4.</span>
                    <div>
                      <strong>Auto-Riparazione:</strong> Se esiste una regola di remediation, il sistema 
                      prova a risolvere automaticamente
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">5.</span>
                    <div>
                      <strong>Notifica:</strong> Gli amministratori vengono notificati del risultato
                    </div>
                  </li>
                </ol>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">⚙️ Configurazione Scheduler</h3>
                <p className="text-sm text-yellow-800 mb-3">
                  Puoi configurare la frequenza di controllo per ogni modulo usando espressioni cron:
                </p>
                <div className="bg-white rounded p-3 font-mono text-xs">
                  <div className="mb-2">*/5 * * * * = Ogni 5 minuti</div>
                  <div className="mb-2">0 * * * * = Ogni ora</div>
                  <div className="mb-2">0 */6 * * * = Ogni 6 ore</div>
                  <div className="mb-2">0 2 * * * = Ogni giorno alle 2:00</div>
                  <div>0 9 * * 1 = Ogni lunedì alle 9:00</div>
                </div>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <h3 className="font-semibold text-green-900 mb-2">💡 Best Practices</h3>
                <ul className="space-y-2 text-sm text-green-800">
                  <li>• Moduli critici (database, auth): controllo ogni 5-15 minuti</li>
                  <li>• Moduli importanti (notifiche, chat): controllo ogni 30 minuti</li>
                  <li>• Moduli di supporto (backup, AI): controllo ogni ora o più</li>
                  <li>• Report settimanali: lunedì mattina per revisione inizio settimana</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'alerts' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <BellIcon className="h-8 w-8 text-yellow-500 mr-3" />
                Sistema di Alert
              </h2>
              <p className="text-gray-700 mb-4">
                Gli alert ti notificano immediatamente quando qualcosa richiede la tua attenzione.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-red-50 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-3">🚨 Livelli di Alert</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 mr-3"></div>
                    <div>
                      <strong className="text-red-800">Critico (Score &lt; 60)</strong>
                      <p className="text-sm text-red-700">Sistema non funzionante, richiede intervento immediato</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mt-1.5 mr-3"></div>
                    <div>
                      <strong className="text-yellow-800">Warning (Score 60-79)</strong>
                      <p className="text-sm text-yellow-700">Problemi che potrebbero peggiorare</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 mr-3"></div>
                    <div>
                      <strong className="text-green-800">OK (Score ≥ 80)</strong>
                      <p className="text-sm text-green-700">Sistema funzionante correttamente</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">📬 Canali di Notifica</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <BellIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-blue-800">Email</strong>
                      <p className="text-sm text-blue-700">Alert critici e report settimanali</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <BellIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-blue-800">WebSocket</strong>
                      <p className="text-sm text-blue-700">Notifiche real-time nella dashboard</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <BellIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-blue-800">Database Log</strong>
                      <p className="text-sm text-blue-700">Storico permanente di tutti gli alert</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">⚡ Esempi di Alert Comuni</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-700">Database connection lost</span>
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">CRITICO</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-700">Memory usage above 85%</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">WARNING</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-700">API response time &gt; 1000ms</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">WARNING</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-700">Backup not completed</span>
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">CRITICO</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'modules' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" />
                Moduli Monitorati
              </h2>
              <p className="text-gray-700 mb-4">
                Il sistema monitora continuamente questi moduli critici del tuo sistema:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">🔐 Auth System</h3>
                <p className="text-sm text-gray-600 mb-2">Sistema di autenticazione e sessioni</p>
                <div className="text-xs space-y-1">
                  <div>✓ Login/Logout funzionanti</div>
                  <div>✓ JWT token validi</div>
                  <div>✓ Sessioni Redis attive</div>
                  <div>✓ 2FA operativo</div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">🗄️ Database Health</h3>
                <p className="text-sm text-gray-600 mb-2">Connessioni e performance database</p>
                <div className="text-xs space-y-1">
                  <div>✓ Connessione attiva</div>
                  <div>✓ Query time ottimali</div>
                  <div>✓ Connection pool sano</div>
                  <div>✓ Spazio disco sufficiente</div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">🔔 Notification System</h3>
                <p className="text-sm text-gray-600 mb-2">Sistema notifiche email e real-time</p>
                <div className="text-xs space-y-1">
                  <div>✓ Email service attivo</div>
                  <div>✓ WebSocket connesso</div>
                  <div>✓ Template disponibili</div>
                  <div>✓ Queue funzionante</div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">💾 Backup System</h3>
                <p className="text-sm text-gray-600 mb-2">Backup automatici database</p>
                <div className="text-xs space-y-1">
                  <div>✓ Ultimo backup recente</div>
                  <div>✓ Spazio storage disponibile</div>
                  <div>✓ Backup verificati</div>
                  <div>✓ Retention policy attiva</div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">💬 Chat System</h3>
                <p className="text-sm text-gray-600 mb-2">Messaggistica real-time</p>
                <div className="text-xs space-y-1">
                  <div>✓ WebSocket attivo</div>
                  <div>✓ Message delivery OK</div>
                  <div>✓ Storia messaggi accessibile</div>
                  <div>✓ Typing indicators funzionanti</div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">💳 Payment System</h3>
                <p className="text-sm text-gray-600 mb-2">Integrazione pagamenti Stripe</p>
                <div className="text-xs space-y-1">
                  <div>✓ Stripe API connessa</div>
                  <div>✓ Webhook attivi</div>
                  <div>✓ Payment processing OK</div>
                  <div>✓ Invoice generation attiva</div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">🤖 AI System</h3>
                <p className="text-sm text-gray-600 mb-2">Integrazione OpenAI</p>
                <div className="text-xs space-y-1">
                  <div>✓ OpenAI API connessa</div>
                  <div>✓ Token disponibili</div>
                  <div>✓ Response time accettabile</div>
                  <div>✓ Context management OK</div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">📋 Request System</h3>
                <p className="text-sm text-gray-600 mb-2">Gestione richieste assistenza</p>
                <div className="text-xs space-y-1">
                  <div>✓ CRUD operations OK</div>
                  <div>✓ Assignment logic attivo</div>
                  <div>✓ Status tracking funzionante</div>
                  <div>✓ Notification triggers OK</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'remediation' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <WrenchScrewdriverIcon className="h-8 w-8 text-purple-500 mr-3" />
                Sistema di Auto-Riparazione
              </h2>
              <p className="text-gray-700 mb-4">
                Il sistema può risolvere automaticamente molti problemi comuni senza intervento umano.
              </p>
            </div>

            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6">
              <h3 className="font-semibold text-purple-900 mb-2">🔧 Come Funziona</h3>
              <p className="text-sm text-purple-800 mb-3">
                Quando viene rilevato un problema, il sistema:
              </p>
              <ol className="space-y-2 text-sm text-purple-800">
                <li>1. Identifica il tipo di problema</li>
                <li>2. Cerca una regola di remediation corrispondente</li>
                <li>3. Esegue le azioni correttive configurate</li>
                <li>4. Ri-controlla il modulo per verificare la risoluzione</li>
                <li>5. Notifica il risultato agli amministratori</li>
              </ol>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-3">📋 Regole di Auto-Riparazione Disponibili</h3>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Clear Redis Cache</h4>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">ATTIVA</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Pulisce la cache quando la memoria è piena</p>
                <div className="text-xs bg-gray-50 rounded p-2 font-mono">
                Condizione: Memory usage &gt; 85% OR Cache errors
                Azione: Clear Redis cache + Restart cache service
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Restart Services</h4>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">ATTIVA</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Riavvia servizi che non rispondono</p>
                <div className="text-xs bg-gray-50 rounded p-2 font-mono">
                  Condizione: Service unreachable OR ECONNREFUSED
                  Azione: Restart service + Notify admin
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Database Cleanup</h4>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">ATTIVA</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Ottimizza database quando rallenta</p>
                <div className="text-xs bg-gray-50 rounded p-2 font-mono">
                Condizione: Query time &gt; 500ms OR Score &lt; 60
                Azione: VACUUM ANALYZE + Clear old records
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Session Cleanup</h4>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">ATTIVA</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Rimuove sessioni scadute</p>
                <div className="text-xs bg-gray-50 rounded p-2 font-mono">
                  Condizione: Too many sessions OR Auth errors
                  Azione: Clear expired sessions + Compact Redis
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Queue Reset</h4>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">DISATTIVA</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Resetta code bloccate</p>
                <div className="text-xs bg-gray-50 rounded p-2 font-mono">
                  Condizione: Queue stuck OR Jobs failing
                  Azione: Clear stuck jobs + Restart workers
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Limitazioni</h3>
              <ul className="space-y-1 text-sm text-yellow-800">
                <li>• Max 3 tentativi per regola ogni 30 minuti</li>
                <li>• Alcune azioni richiedono conferma manuale</li>
                <li>• Non può risolvere problemi hardware o di rete</li>
                <li>• I problemi critici di sicurezza richiedono intervento umano</li>
              </ul>
            </div>
          </div>
        )}

        {activeSection === 'reports' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-indigo-500 mr-3" />
                Report Automatici
              </h2>
              <p className="text-gray-700 mb-4">
                Il sistema genera automaticamente report dettagliati per tenere traccia della salute del sistema nel tempo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-indigo-50 rounded-lg p-4">
                <h3 className="font-semibold text-indigo-900 mb-3">📅 Report Settimanale</h3>
                <p className="text-sm text-indigo-800 mb-3">
                  Generato automaticamente ogni <strong>lunedì alle 9:00</strong>
                </p>
                <div className="space-y-2 text-sm text-indigo-700">
                  <div>📊 Executive Summary</div>
                  <div>📈 Health Score Trends (7 giorni)</div>
                  <div>⚠️ Incidenti critici della settimana</div>
                  <div>🔧 Auto-riparazioni eseguite</div>
                  <div>💡 Raccomandazioni per miglioramenti</div>
                  <div>📉 Confronto con settimana precedente</div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-3">📄 Report Custom</h3>
                <p className="text-sm text-green-800 mb-3">
                  Genera report per qualsiasi periodo
                </p>
                <div className="space-y-2 text-sm text-green-700">
                  <div>✓ Scegli date inizio e fine</div>
                  <div>✓ Formato PDF, CSV o JSON</div>
                  <div>✓ Filtra per modulo specifico</div>
                  <div>✓ Include grafici e statistiche</div>
                  <div>✓ Export dati grezzi disponibile</div>
                  <div>✓ Invio via email opzionale</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">📊 Contenuto dei Report</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Metriche Chiave</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Uptime sistema</li>
                    <li>• Health score medio</li>
                    <li>• Numero incidenti</li>
                    <li>• Tempo risoluzione</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Analisi Dettagliata</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Performance per modulo</li>
                    <li>• Trend temporali</li>
                    <li>• Pattern ricorrenti</li>
                    <li>• Anomalie rilevate</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Azioni & Suggerimenti</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Azioni correttive eseguite</li>
                    <li>• Problemi irrisolti</li>
                    <li>• Raccomandazioni</li>
                    <li>• Prossimi passi</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'faq' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <QuestionMarkCircleIcon className="h-8 w-8 text-gray-500 mr-3" />
                Domande Frequenti
              </h2>
            </div>

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Quanto spesso vengono eseguiti i controlli?
                </h3>
                <p className="text-sm text-gray-600">
                  Dipende dal modulo. I moduli critici come il database vengono controllati ogni 5 minuti, 
                  mentre moduli meno critici come i backup ogni 6 ore. Puoi personalizzare la frequenza 
                  nella sezione Scheduler.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Posso disattivare temporaneamente il sistema?
                </h3>
                <p className="text-sm text-gray-600">
                  Sì, puoi fermare il sistema usando il pulsante "Ferma Sistema" nella dashboard. 
                  Questo disattiverà tutti i controlli automatici finché non lo riavvierai manualmente.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Come posso aggiungere nuove regole di auto-riparazione?
                </h3>
                <p className="text-sm text-gray-600">
                  Vai nella sezione "Auto-Remediation" e clicca su "Aggiungi Regola". Dovrai specificare 
                  la condizione che attiva la regola e le azioni da eseguire. Solo gli utenti SUPER_ADMIN 
                  possono aggiungere nuove regole.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Cosa significa il punteggio di salute?
                </h3>
                <p className="text-sm text-gray-600">
                  Il punteggio va da 0 a 100: <strong>80-100</strong> significa che tutto funziona bene (verde), 
                  <strong>60-79</strong> indica problemi minori (giallo), sotto <strong>60</strong> indica 
                  problemi critici (rosso). Il punteggio è calcolato in base a vari fattori specifici per ogni modulo.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Riceverò troppe notifiche?
                </h3>
                <p className="text-sm text-gray-600">
                  No, il sistema è intelligente. Invia notifiche solo per problemi nuovi o peggiorati. 
                  Non riceverai notifiche ripetute per lo stesso problema. Puoi anche configurare le soglie 
                  di notifica nella sezione Scheduler.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Quanto storico viene mantenuto?
                </h3>
                <p className="text-sm text-gray-600">
                  Di default, il sistema mantiene 30 giorni di dati dettagliati. I dati più vecchi vengono 
                  compressi e archiviati. I report settimanali vengono conservati per 1 anno. Puoi modificare 
                  questi valori nella configurazione.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Cosa succede se l'auto-riparazione fallisce?
                </h3>
                <p className="text-sm text-gray-600">
                  Se l'auto-riparazione fallisce dopo 3 tentativi, il sistema invia un alert critico agli 
                  amministratori e disabilita temporaneamente quella regola per 30 minuti per evitare loop infiniti. 
                  L'intervento manuale sarà necessario.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Posso eseguire controlli manuali?
                </h3>
                <p className="text-sm text-gray-600">
                  Certamente! Usa il pulsante "Check Manuale" nella dashboard per eseguire un controllo 
                  immediato di tutti i moduli o di un modulo specifico. Questo non interferisce con i 
                  controlli schedulati.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mt-6">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <strong>Bisogno di aiuto?</strong>
                  <p className="mt-1">
                    Per ulteriori informazioni o assistenza, contatta il team di supporto tecnico 
                    o consulta la documentazione completa del sistema.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}