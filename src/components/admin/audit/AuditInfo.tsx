// src/components/admin/audit/AuditInfo.tsx
import React from 'react';
import { 
  InformationCircleIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  ClockIcon,
  CursorArrowRaysIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function AuditInfo() {
  return (
    <div className="space-y-6">
      {/* Introduzione */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start">
          <ShieldCheckIcon className="h-8 w-8 text-blue-600 mr-4 flex-shrink-0" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Sistema di Audit Log - Versione 2.0
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Il sistema di Audit Log registra automaticamente tutte le attività che avvengono nell'applicazione,
              fornendo una traccia completa e immutabile delle operazioni eseguite. Questo è fondamentale per la
              sicurezza, la conformità normativa (GDPR) e il debugging di eventuali problemi.
            </p>
            <div className="mt-3 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>✨ Nuovo:</strong> Sistema aggiornato il 07/01/2025 con funzionalità avanzate di filtering,
                export migliorato e tracking completo dei rapporti di intervento.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Nuove Funzionalità */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <SparklesIcon className="h-6 w-6 text-blue-600 mr-2" />
          Nuove Funzionalità (Gennaio 2025)
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
              <CursorArrowRaysIcon className="h-5 w-5 mr-2" />
              Box Statistiche Interattivi
            </h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Clicca su "Operazioni Fallite" per filtrarle</li>
              <li>• Clicca su "Utenti Attivi" per vedere i loro log</li>
              <li>• Navigazione rapida dai box alle liste filtrate</li>
              <li>• Hover effect per indicare interattività</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Visualizzazione Utente Migliorata
            </h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Nome completo invece che solo email</li>
              <li>• Ruolo tradotto in italiano</li>
              <li>• Distinzione chiara: Cliente/Professionista/Staff</li>
              <li>• Informazioni complete nel dettaglio log</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Export CSV Avanzato
            </h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Export completo in formato Excel/CSV</li>
              <li>• Include nome utente e ruolo</li>
              <li>• Tutti i metadata esportati</li>
              <li>• Compatibile con Excel e Google Sheets</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Tracking Rapporti Intervento
            </h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Log automatico creazione rapporti</li>
              <li>• Tracking modifiche rapporti</li>
              <li>• Alert per eliminazioni (WARNING)</li>
              <li>• Metadata completi per ogni operazione</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Cosa viene tracciato */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <DocumentTextIcon className="h-6 w-6 text-green-600 mr-2" />
          Cosa Viene Tracciato
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Operazioni di Autenticazione</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Login (riusciti e falliti)</li>
              <li>• Logout</li>
              <li>• Registrazioni nuovi utenti</li>
              <li>• Cambio password</li>
              <li>• Attivazione/disattivazione 2FA</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Operazioni CRUD</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Creazione richieste assistenza</li>
              <li>• Modifica/cancellazione dati</li>
              <li>• Creazione preventivi</li>
              <li>• Gestione pagamenti</li>
              <li>• Modifiche profili utente</li>
            </ul>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">Operazioni Amministrative</h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Gestione utenti e permessi</li>
              <li>• Modifiche configurazioni sistema</li>
              <li>• Backup e restore</li>
              <li>• Gestione API keys</li>
              <li>• Operazioni di manutenzione</li>
            </ul>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="font-medium text-orange-900 mb-2">Rapporti Intervento 🆕</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• Creazione nuovi rapporti</li>
              <li>• Modifiche e aggiornamenti</li>
              <li>• Eliminazione rapporti</li>
              <li>• Template e configurazioni</li>
              <li>• Materiali utilizzati</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Informazioni Registrate */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ChartBarIcon className="h-6 w-6 text-indigo-600 mr-2" />
          Informazioni Registrate per Ogni Evento
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Dati Utente Completi 🆕</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Nome e cognome utente</li>
              <li>• Email utente</li>
              <li>• Ruolo (Cliente/Professionista/Admin)</li>
              <li>• Indirizzo IP</li>
              <li>• User Agent (browser)</li>
              <li>• Session ID</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Dettagli Operazione</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Tipo di azione eseguita</li>
              <li>• Entità coinvolta</li>
              <li>• ID dell'entità modificata</li>
              <li>• Endpoint API chiamato</li>
              <li>• Metodo HTTP (GET, POST, etc.)</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Risultato e Performance</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Successo/Fallimento</li>
              <li>• Codice di stato HTTP</li>
              <li>• Tempo di risposta (ms)</li>
              <li>• Messaggi di errore</li>
              <li>• Timestamp preciso</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Livelli di Severità */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-2" />
          Livelli di Severità
        </h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-3">
              DEBUG
            </span>
            <p className="text-sm text-gray-600">
              Informazioni dettagliate per debugging, normalmente non visibili in produzione
            </p>
          </div>
          
          <div className="flex items-start">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-3">
              INFO
            </span>
            <p className="text-sm text-gray-600">
              Operazioni normali del sistema, login riusciti, creazioni/modifiche standard
            </p>
          </div>
          
          <div className="flex items-start">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-3">
              WARNING
            </span>
            <p className="text-sm text-gray-600">
              Eventi che richiedono attenzione: login falliti, tentativi di accesso non autorizzato, eliminazioni
            </p>
          </div>
          
          <div className="flex items-start">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-3">
              ERROR
            </span>
            <p className="text-sm text-gray-600">
              Errori di sistema che impediscono il completamento di un'operazione
            </p>
          </div>
          
          <div className="flex items-start">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-200 text-red-900 mr-3">
              CRITICAL
            </span>
            <p className="text-sm text-gray-600">
              Errori critici che richiedono intervento immediato: violazioni di sicurezza, crash di sistema
            </p>
          </div>
        </div>
      </div>

      {/* Guida Rapida Nuove Funzionalità */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CursorArrowRaysIcon className="h-6 w-6 text-yellow-600 mr-2" />
          Guida Rapida alle Nuove Funzionalità
        </h3>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">🖱️ Box Statistiche Cliccabili</h4>
            <p className="text-gray-700">
              I box delle statistiche nella dashboard sono ora interattivi. Clicca su "Operazioni Fallite" 
              per vedere solo gli errori, o su "Utenti Attivi" per filtrare i log degli utenti. 
              Il sistema passerà automaticamente al tab "Audit Logs" con i filtri applicati.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-1">👤 Visualizzazione Utente Migliorata</h4>
            <p className="text-gray-700">
              Nella tabella ora vedi il nome completo dell'utente (es: "Mario Rossi") invece che solo l'email,
              e il ruolo tradotto in italiano (Cliente, Professionista, Amministratore, Super Admin).
              Questo rende molto più facile capire chi ha fatto cosa.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-1">📊 Export CSV Completo</h4>
            <p className="text-gray-700">
              Il pulsante "Esporta CSV" ora genera un file completo con tutti i dati, inclusi nome utente 
              e ruolo. Il file può essere aperto direttamente in Excel o Google Sheets per analisi avanzate.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-1">📝 Tracking Rapporti Intervento</h4>
            <p className="text-gray-700">
              Tutte le operazioni sui rapporti di intervento sono ora tracciate automaticamente. 
              Creazione, modifica ed eliminazione vengono registrate con tutti i metadata necessari.
              Le eliminazioni hanno severity WARNING per maggiore visibilità.
            </p>
          </div>
        </div>
      </div>

      {/* Conformità e Sicurezza */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <LockClosedIcon className="h-6 w-6 text-red-600 mr-2" />
          Conformità e Sicurezza
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Conformità GDPR</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Tracciamento accessi ai dati personali</li>
              <li>• Log delle modifiche ai dati utente</li>
              <li>• Registro delle cancellazioni dati</li>
              <li>• Audit trail per dimostrare conformità</li>
              <li>• Export dati per diritto di accesso</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Sicurezza</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Rilevamento tentativi di accesso non autorizzato</li>
              <li>• Monitoraggio attività sospette</li>
              <li>• Tracciamento modifiche critiche</li>
              <li>• Log immutabili e non modificabili</li>
              <li>• Identificazione completa utenti</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Retention Policy */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ClockIcon className="h-6 w-6 text-gray-600 mr-2" />
          Politiche di Conservazione
        </h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-3">
            I log vengono conservati secondo le seguenti politiche:
          </p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>
              <span className="font-medium">Log di sicurezza (SECURITY):</span> 2 anni
            </li>
            <li>
              <span className="font-medium">Log di business (BUSINESS):</span> 1 anno
              <span className="text-xs text-gray-500 ml-1">(include rapporti intervento)</span>
            </li>
            <li>
              <span className="font-medium">Log di sistema (SYSTEM):</span> 6 mesi
            </li>
            <li>
              <span className="font-medium">Log API:</span> 3 mesi
            </li>
            <li>
              <span className="font-medium">Log di debug:</span> 7 giorni
            </li>
          </ul>
          <p className="text-xs text-gray-500 mt-3">
            * I log relativi a controversie legali o indagini vengono conservati fino alla risoluzione del caso
          </p>
        </div>
      </div>

      {/* Come Usare i Filtri */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <InformationCircleIcon className="h-6 w-6 text-blue-600 mr-2" />
          Come Utilizzare il Sistema
        </h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <span className="font-medium text-gray-700">Filtri Rapidi:</span> Usa i box statistiche per filtrare velocemente operazioni fallite o utenti attivi
          </div>
          <div>
            <span className="font-medium text-gray-700">Azione:</span> Filtra per tipo di operazione (LOGIN, CREATE, UPDATE, DELETE, etc.)
          </div>
          <div>
            <span className="font-medium text-gray-700">Tipo Entità:</span> Filtra per tipo di oggetto (User, Request, Quote, InterventionReport, etc.)
          </div>
          <div>
            <span className="font-medium text-gray-700">Categoria:</span> Raggruppa per area funzionale (SECURITY, BUSINESS, SYSTEM, etc.)
          </div>
          <div>
            <span className="font-medium text-gray-700">Severità:</span> Mostra solo log di un certo livello di importanza
          </div>
          <div>
            <span className="font-medium text-gray-700">Risultato:</span> Visualizza solo operazioni riuscite o fallite
          </div>
          <div>
            <span className="font-medium text-gray-700">Data:</span> Cerca log in un intervallo temporale specifico
          </div>
          <div>
            <span className="font-medium text-gray-700">Export:</span> Esporta i risultati filtrati in CSV per analisi esterne
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Suggerimento:</strong> Clicca su qualsiasi riga della tabella per vedere tutti i dettagli completi del log,
            inclusi metadata, valori modificati e informazioni tecniche aggiuntive. I nomi utente e ruoli sono ora 
            visualizzati in modo chiaro e comprensibile.
          </p>
        </div>
      </div>

      {/* Footer con versione */}
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-xs text-gray-500">
          Sistema Audit Log v2.0 - Ultimo aggiornamento: 07 Gennaio 2025
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Sviluppato da LM Tecnologie - Sistema Richiesta Assistenza
        </p>
      </div>
    </div>
  );
}
