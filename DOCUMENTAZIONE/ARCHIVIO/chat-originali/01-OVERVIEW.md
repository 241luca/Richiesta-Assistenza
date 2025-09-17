# Sistema Chat - Panoramica Generale

## Descrizione
Il Sistema di Chat integrato permette la comunicazione in tempo reale tra tutti i partecipanti di una richiesta di assistenza (clienti, professionisti e staff amministrativo).

## Caratteristiche Principali

### ✅ Funzionalità Implementate
- **Messaggistica real-time**: Invio e ricezione messaggi istantanei
- **Multi-ruolo**: Supporto per CLIENT, PROFESSIONAL, ADMIN, SUPER_ADMIN
- **Controllo accessi**: Verifica automatica dei permessi per ruolo
- **Chiusura automatica**: Chat si disabilita quando richiesta completata/cancellata
- **Notifiche integrate**: Sistema notifiche per nuovi messaggi
- **Interfaccia responsive**: UI ottimizzata per desktop e mobile
- **Indicatori visivi**: Badge colorati per identificare ruoli utenti
- **Timestamp**: Orario visualizzato per ogni messaggio

### 🚧 Funzionalità da Completare
- **Upload allegati**: Invio foto e documenti nella chat
- **Stampa chat**: Export conversazione in PDF
- **Indicatore digitazione**: "Sta scrivendo..." in tempo reale
- **Modifica/elimina messaggi**: Gestione post-invio
- **Ricerca messaggi**: Funzione ricerca nel thread
- **Emoji reactions**: Reazioni rapide ai messaggi

## Architettura Tecnica

### Stack Tecnologico
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL con Prisma ORM
- **Frontend**: React + TypeScript + TanStack Query
- **WebSocket**: Socket.io (predisposto, da completare)
- **UI Components**: Tailwind CSS + Heroicons

### Struttura Database
```sql
RequestChatMessage {
  id: String (UUID)
  requestId: String
  userId: String
  message: String
  messageType: TEXT | IMAGE | DOCUMENT | SYSTEM
  attachments: JSON
  isEdited: Boolean
  isDeleted: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

## Flusso Operativo

1. **Apertura Chat**: Cliente/Professionista/Admin clicca sul pulsante Chat
2. **Verifica Accessi**: Sistema verifica permessi utente
3. **Caricamento Storico**: Recupero messaggi precedenti dal database
4. **Invio Messaggio**: Utente scrive e invia messaggio
5. **Salvataggio**: Messaggio salvato nel database
6. **Notifiche**: Invio notifiche agli altri partecipanti
7. **Visualizzazione**: Aggiornamento UI in tempo reale

## Ruoli e Permessi

| Ruolo | Accesso Chat | Quando |
|-------|--------------|--------|
| **CLIENT** | ✅ Sì | Sempre per le proprie richieste |
| **PROFESSIONAL** | ✅ Sì | Solo quando assegnato alla richiesta |
| **ADMIN/SUPER_ADMIN** | ✅ Sì | Sempre, per tutte le richieste |

## Stati Richiesta e Chat

| Stato Richiesta | Chat Attiva | Motivo |
|-----------------|-------------|--------|
| PENDING | ✅ Sì | In attesa assegnazione |
| ASSIGNED | ✅ Sì | Professionista assegnato |
| IN_PROGRESS | ✅ Sì | Lavoro in corso |
| COMPLETED | ❌ No | Lavoro completato |
| CANCELLED | ❌ No | Richiesta cancellata |
