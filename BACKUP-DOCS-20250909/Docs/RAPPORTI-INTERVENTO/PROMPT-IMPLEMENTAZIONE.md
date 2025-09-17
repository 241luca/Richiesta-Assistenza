# 🎯 PROMPT PRONTI PER IMPLEMENTAZIONE RAPPORTI INTERVENTO

## IMPORTANTE
Questi sono i prompt ESATTI da copiare e incollare per ogni fase di implementazione.

---

## 📋 PROMPT FASE 1 - DATABASE

### PROMPT 1.1 - INIZIO FASE DATABASE
```
Ciao, devo implementare la FASE 1 (DATABASE) del Sistema Rapporti di Intervento.

DOCUMENTI DA LEGGERE PRIMA:
1. /Docs/RAPPORTI-INTERVENTO/00-MASTER-PLAN.md
2. /Docs/RAPPORTI-INTERVENTO/01-DATABASE-IMPLEMENTATION.md
3. /Docs/RAPPORTI-INTERVENTO/PROGRESS-TRACKER.md
4. ISTRUZIONI-PROGETTO.md

REGOLE FONDAMENTALI:
- Seguire SEMPRE ISTRUZIONI-PROGETTO.md
- TUTTO deve essere tabellato (niente hardcoded)
- Fare backup prima di modifiche importanti
- Aggiornare PROGRESS-TRACKER.md dopo ogni step

Iniziamo dallo STEP 1.1 - BACKUP E PREPARAZIONE come descritto nel documento 01-DATABASE-IMPLEMENTATION.md
```

### PROMPT 1.2 - CONTROLLO AVANZAMENTO FASE 1
```
Controlla il file /Docs/RAPPORTI-INTERVENTO/PROGRESS-TRACKER.md e dimmi:
1. Quali step della FASE 1 sono stati completati
2. Cosa manca da fare nella FASE 1
3. Eventuali problemi bloccanti

Poi continuiamo dal prossimo step della FASE 1 seguendo 01-DATABASE-IMPLEMENTATION.md
```

### PROMPT 1.3 - COMPLETAMENTO FASE 1
```
Abbiamo completato tutti gli step della FASE 1. Ora:
1. Verifica che tutte le tabelle siano state create correttamente con Prisma Studio
2. Esegui il seed dei dati iniziali
3. Aggiorna PROGRESS-TRACKER.md segnando la FASE 1 come completata
4. Crea un report di sessione in REPORT-SESSIONI-CLAUDE con i dettagli del lavoro svolto
```

---

## 📋 PROMPT FASE 2 - API BASE

### PROMPT 2.1 - INIZIO FASE API
```
Ciao, devo implementare la FASE 2 (API BASE) del Sistema Rapporti di Intervento.

PREREQUISITI DA VERIFICARE:
- La FASE 1 (Database) deve essere completata
- Le tabelle devono essere migrate e funzionanti

DOCUMENTI DA LEGGERE:
1. /Docs/RAPPORTI-INTERVENTO/00-MASTER-PLAN.md
2. /Docs/RAPPORTI-INTERVENTO/02-API-BASE-IMPLEMENTATION.md
3. /Docs/RAPPORTI-INTERVENTO/PROGRESS-TRACKER.md
4. ISTRUZIONI-PROGETTO.md

REGOLE CRITICHE:
- SEMPRE usare ResponseFormatter in TUTTE le routes
- MAI usare ResponseFormatter nei services
- Validare tutti gli input
- Gestire permessi per ruolo

Iniziamo dallo STEP 2.1 - SETUP SERVICES BASE
```

### PROMPT 2.2 - TEST API FASE 2
```
Dobbiamo testare le API create nella FASE 2:
1. Avvia il backend con npm run dev
2. Usa Postman o curl per testare ogni endpoint
3. Verifica che TUTTI usino ResponseFormatter
4. Controlla i log per eventuali errori
5. Aggiorna PROGRESS-TRACKER.md con i risultati dei test
```

---

## 📋 PROMPT FASE 3 - ADMIN PANEL

### PROMPT 3.1 - INIZIO ADMIN PANEL
```
Ciao, devo implementare la FASE 3 (ADMIN PANEL) del Sistema Rapporti di Intervento.

PREREQUISITI:
- FASE 1 (Database) completata ✅
- FASE 2 (API) completata e testata ✅

DOCUMENTI DA LEGGERE:
1. /Docs/RAPPORTI-INTERVENTO/00-MASTER-PLAN.md
2. /Docs/RAPPORTI-INTERVENTO/03-ADMIN-PANEL-IMPLEMENTATION.md
3. /Docs/RAPPORTI-INTERVENTO/PROGRESS-TRACKER.md

TECNOLOGIE DA USARE:
- React con TypeScript
- Tailwind CSS per styling
- Heroicons per icone
- React Query per chiamate API
- React Hook Form per form

Iniziamo creando la struttura delle pagine admin per la gestione rapporti
```

### PROMPT 3.2 - EDITOR TEMPLATE
```
Ora implementiamo l'editor drag-and-drop per i template:
1. Usa react-beautiful-dnd o simile
2. Permetti drag-drop dei campi
3. Configurazione inline dei campi
4. Anteprima live del template
5. Salvataggio via API

Segui il design descritto in 03-ADMIN-PANEL-IMPLEMENTATION.md
```

---

## 📋 PROMPT FASE 4 - AREA PROFESSIONISTA

### PROMPT 4.1 - INIZIO AREA PROFESSIONISTA
```
Ciao, devo implementare la FASE 4 (AREA PROFESSIONISTA) del Sistema Rapporti di Intervento.

FOCUS: Personalizzazioni del professionista per i rapporti

DOCUMENTI:
1. /Docs/RAPPORTI-INTERVENTO/00-MASTER-PLAN.md
2. /Docs/RAPPORTI-INTERVENTO/04-PROFESSIONAL-AREA-IMPLEMENTATION.md
3. /Docs/RAPPORTI-INTERVENTO/PROGRESS-TRACKER.md

FUNZIONALITÀ DA IMPLEMENTARE:
- Dashboard rapporti professionista
- Gestione template personali
- Frasi ricorrenti (speed text)
- Materiali personali con prezzi
- Impostazioni e firma digitale

Iniziamo dalla dashboard professionista
```

---

## 📋 PROMPT FASE 5 - FORM DINAMICO

### PROMPT 5.1 - INIZIO FORM DINAMICO
```
Ciao, devo implementare la FASE 5 (FORM DINAMICO) del Sistema Rapporti di Intervento.

OBIETTIVO: Form che si genera dinamicamente dal template

DOCUMENTI:
1. /Docs/RAPPORTI-INTERVENTO/00-MASTER-PLAN.md
2. /Docs/RAPPORTI-INTERVENTO/05-DYNAMIC-FORM-IMPLEMENTATION.md

FEATURES RICHIESTE:
- Rendering dinamico campi da template
- Validazioni dinamiche (required, min/max, etc)
- Dipendenze tra campi (show/hide condizionale)
- Upload foto opzionale
- Timer start/stop per durata
- Firma digitale con canvas
- Calcoli automatici

Usa React Hook Form con resolver Zod dinamico
```

### PROMPT 5.2 - FIRMA DIGITALE
```
Implementiamo il componente SignaturePad per la firma digitale:
1. Usa react-signature-canvas o simile
2. Supporto touch per mobile
3. Clear e undo
4. Salvataggio come base64
5. Validazione firma non vuota

Il componente deve integrarsi nel form dinamico
```

---

## 📋 PROMPT FASE 6 - AREA CLIENTE

### PROMPT 6.1 - INIZIO AREA CLIENTE
```
Ciao, devo implementare la FASE 6 (AREA CLIENTE) del Sistema Rapporti di Intervento.

ULTIMA FASE! Focus su visualizzazione e interazione cliente

DOCUMENTI:
1. /Docs/RAPPORTI-INTERVENTO/00-MASTER-PLAN.md
2. /Docs/RAPPORTI-INTERVENTO/06-CLIENT-AREA-IMPLEMENTATION.md

FUNZIONALITÀ:
- Visualizzazione bella del rapporto
- Download PDF
- Firma online del cliente
- Valutazione con stelle
- Notifiche real-time
- Storico rapporti

L'interfaccia deve essere semplice e intuitiva per il cliente
```

---

## 📋 PROMPT TESTING E COMPLETAMENTO

### PROMPT TEST END-TO-END
```
Eseguiamo un test completo end-to-end del sistema rapporti:

1. ADMIN: Crea template per elettricisti
2. PROFESSIONISTA: Personalizza template
3. PROFESSIONISTA: Crea rapporto da richiesta
4. PROFESSIONISTA: Compila e firma
5. CLIENTE: Riceve notifica
6. CLIENTE: Visualizza e firma
7. SISTEMA: Genera PDF

Verifica ogni passaggio e segnala problemi in PROGRESS-TRACKER.md
```

### PROMPT DOCUMENTAZIONE FINALE
```
Sistema Rapporti completato! Ora creiamo la documentazione:

1. README specifico in /Docs/RAPPORTI-INTERVENTO/README.md
2. Guida utente per professionisti
3. Guida configurazione per admin
4. API documentation
5. Troubleshooting guide

Aggiorna anche il README principale del progetto
```

### PROMPT REPORT FINALE
```
Crea il report finale del progetto Sistema Rapporti:

1. Aggiorna PROGRESS-TRACKER.md con stato COMPLETATO
2. Crea report dettagliato in REPORT-SESSIONI-CLAUDE
3. Elenca tutti i file creati/modificati
4. Statistiche finali (ore, righe codice, etc)
5. Note per manutenzione futura
6. Possibili miglioramenti futuri

Il sistema è pronto per il deploy!
```

---

## 🚀 PROMPT RAPIDI PER PROBLEMI COMUNI

### ERRORE TYPESCRIPT
```
Ho un errore TypeScript in [file]. L'errore è:
[incolla errore]

Verifica:
1. Schema Prisma è aggiornato?
2. Client Prisma rigenerato?
3. Types corretti importati?

Sistema e correggi seguendo ISTRUZIONI-PROGETTO.md
```

### RESPONSEFORMATTER MANCANTE
```
Verifica che TUTTE le routes dei rapporti usino ResponseFormatter:
1. Cerca in /backend/src/routes/intervention*.ts
2. Ogni res.json deve usare ResponseFormatter.success
3. Ogni res.status().json deve usare ResponseFormatter.error
4. Correggi dove manca
```

### PROBLEMA MIGRAZIONE
```
La migration Prisma fallisce con errore:
[incolla errore]

1. Fai backup del database
2. Analizza l'errore
3. Se necessario, resetta con: npx prisma migrate reset
4. Ricrea migration
5. Esegui seed
```

---

## 📝 NOTE PER L'IMPLEMENTATORE

1. **SEMPRE** leggere i documenti di riferimento PRIMA di iniziare
2. **MAI** procedere senza aver completato i prerequisiti
3. **SEMPRE** fare backup prima di modifiche critiche
4. **SEMPRE** aggiornare PROGRESS-TRACKER.md
5. **MAI** hardcodare valori - tutto da tabelle
6. **SEMPRE** ResponseFormatter nelle routes
7. **SEMPRE** testare ogni funzionalità completata

---

Ultimo aggiornamento: ${new Date().toISOString()}
