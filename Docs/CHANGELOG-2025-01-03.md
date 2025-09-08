# Changelog - Sistema Richiesta Assistenza
## Data: 03 Gennaio 2025

### 🚀 Nuove Funzionalità Implementate

---

## 1. Sistema di Auto-assegnazione Professionisti

### Descrizione
Implementato un sistema completo che permette agli amministratori di controllare quali professionisti possono auto-assegnarsi le richieste disponibili.

### Componenti Modificati
- **Backend:**
  - `backend/src/routes/professional.routes.ts` - Aggiunto endpoint toggle e verifica permessi
  - `backend/src/routes/user.routes.ts` - Aggiunto campo `canSelfAssign` negli endpoint
  - `backend/prisma/schema.prisma` - Aggiunto campo `canSelfAssign` al modello User

- **Frontend:**
  - `src/pages/admin/ProfessionalsManagementPage.tsx` - Interfaccia admin con toggle
  - `src/pages/professional/AvailableRequests.tsx` - Verifica permessi prima di mostrare richieste

### Funzionalità
- ✅ Toggle on/off per ogni professionista nella pagina di gestione admin
- ✅ Persistenza dello stato nel database
- ✅ Verifica automatica dei permessi quando un professionista accede alle richieste disponibili
- ✅ Messaggio di errore chiaro se non autorizzato
- ✅ Indicatore visivo dello stato (abilitato/disabilitato)

### Endpoint API
```typescript
// Toggle auto-assegnazione per un professionista
POST /api/professionals/toggle-self-assign/:professionalId
Body: { canSelfAssign: boolean }

// Auto-assegnazione richiesta
POST /api/professionals/self-assign/:requestId
```

---

## 2. Calcolo Distanze con Google Maps nelle Richieste Disponibili

### Descrizione
Integrato il calcolo delle distanze reali usando Google Maps API per le richieste disponibili ai professionisti, identico al sistema già presente in "Le mie Richieste".

### Componenti Modificati
- **Backend:**
  - `backend/src/routes/professional.routes.ts` - Aggiunto calcolo distanze con GoogleMapsService
  - `backend/src/utils/responseFormatter.ts` - Aggiunti campi distance, distanceText, duration, durationText

- **Frontend:**
  - `src/pages/professional/AvailableRequests.tsx` - Visualizzazione distanza e tempo di viaggio

### Funzionalità
- ✅ Calcolo distanza reale in km da Google Maps
- ✅ Tempo di viaggio stimato
- ✅ Ordinamento automatico per distanza (più vicine prima)
- ✅ Utilizza indirizzo di lavoro del professionista (o residenza se non configurato)
- ✅ Limite di 20 richieste calcolate per performance
- ✅ Gestione errori robusta

### Esempio Visualizzazione
```
📍 347 km (4 ore 7 min)
📍 581 km (6 ore 7 min)
```

---

## 3. Miglioramento Layout "Richieste Disponibili"

### Descrizione
Completamente rinnovato il layout della pagina "Richieste Disponibili" per i professionisti, ora identico al design professionale di "Le mie Richieste".

### Componenti Modificati
- **Frontend:**
  - `src/pages/professional/AvailableRequests.tsx` - Nuovo layout completo

### Miglioramenti UI/UX
- ✅ Card design moderno con bordi arrotondati e ombre
- ✅ Badge colorati per stato, priorità e categoria
- ✅ Visualizzazione categoria/sottocategoria
- ✅ Icone intuitive per ogni informazione
- ✅ Grid responsive per informazioni principali
- ✅ Contatori per preventivi e allegati
- ✅ Filtri per distanza, priorità e categoria
- ✅ Pulsante "Prendi in carico" prominente

---

## 4. Ottimizzazione Etichette Categoria/Sottocategoria

### Descrizione
Migliorata la visualizzazione delle categorie e sottocategorie in "Le mie Richieste", rimuovendo duplicazioni e rendendo le informazioni più chiare.

### Componenti Modificati
- **Frontend:**
  - `src/pages/RequestsPage.tsx` - Rimossa duplicazione categoria, mantenuta solo etichetta combinata

### Miglioramenti
- ✅ Etichetta unica categoria/sottocategoria con badge viola
- ✅ Formato: `Categoria / Sottocategoria` quando disponibile
- ✅ Solo categoria quando non c'è sottocategoria
- ✅ Rimossa riga duplicata con solo la categoria
- ✅ Maggiore chiarezza visiva

### Esempi Visualizzazione
- `Elettricità / Installazione prese`
- `Idraulica / Sturatura scarichi`
- `Edilizia / Ristrutturazione bagni`
- `Climatizzazione` (senza sottocategoria)

---

## 📊 Riepilogo Tecnico

### Database
- **Nuovi campi:**
  - `User.canSelfAssign` (Boolean, default: true)

### API Endpoints
- **Nuovi:**
  - `POST /api/professionals/toggle-self-assign/:professionalId`
  - `GET /api/professionals/available-requests` (aggiornato con distanze)
  
- **Modificati:**
  - `GET /api/users` - Include campo canSelfAssign
  - `GET /api/users/professionals` - Include campo canSelfAssign

### Performance
- Calcolo distanze limitato a 20 richieste per chiamata
- Ordinamento ottimizzato lato server
- Caching delle query con React Query

### Sicurezza
- Verifica ruolo ADMIN per toggle auto-assegnazione
- Verifica canSelfAssign prima di mostrare richieste disponibili
- Validazione professionalId nelle richieste

---

## 🧪 Testing Checklist

### Auto-assegnazione
- [x] Admin può abilitare/disabilitare professionisti
- [x] Stato persiste dopo refresh pagina
- [x] Professionista disabilitato riceve errore 403
- [x] Toggle funziona in tempo reale

### Distanze
- [x] Distanze calcolate correttamente
- [x] Tempo di viaggio visualizzato
- [x] Ordinamento per distanza funzionante
- [x] Gestione errori Google Maps

### UI/UX
- [x] Layout responsive su mobile/tablet/desktop
- [x] Badge categoria/sottocategoria visibili
- [x] Filtri funzionanti
- [x] Performance fluida con molte richieste

---

## 📝 Note per il Deploy

1. **Variabili d'ambiente richieste:**
   - `GOOGLE_MAPS_API_KEY` - Per calcolo distanze

2. **Migrazioni database:**
   ```sql
   ALTER TABLE "User" ADD COLUMN "canSelfAssign" BOOLEAN DEFAULT true;
   ```

3. **Cache da invalidare:**
   - Query cache per `/api/professionals/available-requests`
   - Query cache per `/api/users/professionals`

4. **Monitoraggio:**
   - Verificare utilizzo API Google Maps
   - Monitorare tempi risposta calcolo distanze

---

## 🎯 Prossimi Sviluppi Suggeriti

1. **Ottimizzazioni:**
   - Cache delle distanze calcolate per ridurre chiamate Google Maps
   - Batch processing per calcolo distanze
   - Paginazione richieste disponibili

2. **Nuove funzionalità:**
   - Notifica push quando nuova richiesta disponibile in zona
   - Preferenze zona di lavoro per professionisti
   - Auto-assegnazione basata su criteri (distanza max, categoria preferita)
   - Report utilizzo auto-assegnazione

3. **Miglioramenti UX:**
   - Mappa interattiva richieste disponibili
   - Preview richiesta senza aprire dettaglio
   - Filtri salvati per professionista

---

## 👥 Team di Sviluppo

- **Sviluppatore:** Claude (Anthropic)
- **Supervisione:** Luca Mambelli
- **Data implementazione:** 03 Gennaio 2025
- **Versione sistema:** 2.0

---

## ✅ Stato: COMPLETATO E TESTATO

Tutte le funzionalità sono state implementate, testate e verificate in ambiente di sviluppo.
