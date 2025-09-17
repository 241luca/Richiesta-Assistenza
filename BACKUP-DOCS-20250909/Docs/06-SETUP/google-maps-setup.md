# 📍 Google Maps Setup Guide

## Prerequisiti

- Account Google con billing attivo
- Carta di credito per attivazione (Google offre $200 di credito gratuito)
- Accesso a Google Cloud Console

## Step 1: Creazione Progetto Google Cloud

### 1.1 Accesso a Google Cloud Console

1. Navigare su [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Effettuare il login con account Google
3. Accettare i termini di servizio se è il primo accesso

### 1.2 Creare Nuovo Progetto

1. Click sul selettore progetto in alto
2. Click su "Nuovo Progetto"
3. Inserire:
   - **Nome progetto**: `Richiesta-Assistenza`
   - **ID progetto**: verrà generato automaticamente
   - **Organizzazione**: lasciare vuoto o selezionare se disponibile
4. Click su "Crea"
5. Attendere la creazione (circa 30 secondi)

![Nuovo Progetto](https://via.placeholder.com/800x400.png?text=Screenshot+Nuovo+Progetto)

## Step 2: Attivazione Billing

### 2.1 Configurare Billing Account

1. Nel menu laterale, selezionare "Billing"
2. Se non hai un account di fatturazione:
   - Click su "Collega un account di fatturazione"
   - Seguire la procedura guidata
   - Inserire dati carta di credito
3. Collegare il progetto all'account di fatturazione

> ⚠️ **Nota**: Google offre $200 di credito gratuito per nuovi account che durano generalmente 90 giorni.

## Step 3: Abilitazione APIs

### 3.1 Navigare alla Libreria API

1. Menu laterale → "APIs e servizi" → "Libreria"
2. Cercare e abilitare le seguenti APIs:

### 3.2 Maps JavaScript API (OBBLIGATORIA)

1. Cercare "Maps JavaScript API"
2. Click sul risultato
3. Click su "ABILITA"
4. Attendere l'attivazione

### 3.3 Geocoding API (OBBLIGATORIA)

1. Cercare "Geocoding API"
2. Click sul risultato
3. Click su "ABILITA"

### 3.4 Places API (OBBLIGATORIA)

1. Cercare "Places API"
2. Click sul risultato
3. Click su "ABILITA"

### 3.5 APIs Opzionali ma Consigliate

- **Distance Matrix API**: Per calcolo distanze precise
- **Directions API**: Per routing e navigazione
- **Roads API**: Per snap-to-road features

![APIs Abilitate](https://via.placeholder.com/800x400.png?text=Screenshot+APIs+Abilitate)

## Step 4: Creazione API Key

### 4.1 Generare API Key

1. Menu laterale → "APIs e servizi" → "Credenziali"
2. Click su "+ CREA CREDENZIALI"
3. Selezionare "Chiave API"
4. La chiave verrà creata immediatamente
5. **COPIARE LA CHIAVE** (esempio: `AIzaSyBxxxxxxxxxxxxxxxxxx`)

### 4.2 Rinominare API Key

1. Click sul nome della chiave appena creata
2. Rinominarla in: `Richiesta Assistenza API Key`

## Step 5: Configurazione Restrizioni (IMPORTANTE!)

### 5.1 Restrizioni Applicazione

1. Nella pagina della API key, sezione "Restrizioni dell'applicazione"
2. Selezionare: **"Siti web HTTP (URL di riferimento)"**
3. Aggiungere i seguenti referrer:

```
http://localhost:5193/*
http://localhost:3200/*
http://127.0.0.1:5193/*
https://tuodominio.com/*
https://www.tuodominio.com/*
```

> 📝 **Nota**: Sostituire `tuodominio.com` con il dominio reale in produzione

### 5.2 Restrizioni API

1. Sezione "Restrizioni API"
2. Selezionare: **"Limita chiave"**
3. Selezionare solo le APIs necessarie:
   - Maps JavaScript API
   - Geocoding API
   - Places API
   - Distance Matrix API (se abilitata)
   - Directions API (se abilitata)

### 5.3 Salvare Configurazione

1. Click su "SALVA"
2. Attendere la propagazione (può richiedere fino a 5 minuti)

![Restrizioni API Key](https://via.placeholder.com/800x400.png?text=Screenshot+Restrizioni)

## Step 6: Configurazione Quote e Limiti

### 6.1 Impostare Quote Giornaliere

1. Menu → "APIs e servizi" → "APIs abilitate"
2. Per ogni API abilitata:
   - Click sul nome dell'API
   - Tab "Quote e limiti"
   - Configurare limiti giornalieri consigliati:

**Limiti Consigliati per Development:**
- Maps JavaScript API: 1,000 richieste/giorno
- Geocoding API: 500 richieste/giorno
- Places API: 500 richieste/giorno

**Limiti Consigliati per Production:**
- Maps JavaScript API: 10,000 richieste/giorno
- Geocoding API: 2,500 richieste/giorno
- Places API: 2,500 richieste/giorno

### 6.2 Budget Alerts

1. Menu → "Billing" → "Budget e avvisi"
2. Click su "CREA BUDGET"
3. Configurare:
   - Nome: `Richiesta Assistenza Maps Budget`
   - Importo: €50/mese (o secondo necessità)
   - Soglie avviso: 50%, 90%, 100%
   - Email notifiche

## Step 7: Integrazione nel Progetto

### 7.1 Frontend Configuration

Modificare il file `.env` nel frontend:

```env
# Google Maps Configuration
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxx
```

### 7.2 Backend Configuration

Modificare il file `backend/.env`:

```env
# Google Maps API (stessa key del frontend)
GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxx
```

### 7.3 Test Integrazione

1. Avviare il frontend:
```bash
npm run dev
```

2. Avviare il backend:
```bash
cd backend && npm run dev
```

3. Testare le funzionalità:
   - Aprire browser su http://localhost:5193
   - Navigare a una pagina con mappa
   - Verificare che la mappa si carichi correttamente
   - Testare l'autocomplete indirizzi

## Step 8: Verifica e Monitoring

### 8.1 Verificare Funzionamento

Console del browser (F12) non deve mostrare errori tipo:
- ❌ "Google Maps JavaScript API error: InvalidKeyMapError"
- ❌ "RefererNotAllowedMapError"
- ❌ "ApiNotActivatedMapError"

### 8.2 Monitoring Usage

1. Google Cloud Console → "APIs e servizi" → "Metriche"
2. Visualizzare:
   - Richieste per API
   - Errori
   - Latenza
   - Quote utilizzate

### 8.3 Monitoring Costi

1. Google Cloud Console → "Billing" → "Rapporti sui costi"
2. Filtrare per servizio "Maps"
3. Analizzare trend giornalieri/mensili

## Troubleshooting Comuni

### Errore: "InvalidKeyMapError"
**Causa**: API key non valida o mal configurata
**Soluzione**: 
- Verificare che la key sia copiata correttamente in .env
- Riavviare il server dopo modifica .env

### Errore: "RefererNotAllowedMapError"
**Causa**: Il dominio non è nelle restrizioni HTTP referrer
**Soluzione**:
- Aggiungere l'URL corrente nelle restrizioni
- Attendere 5 minuti per la propagazione

### Errore: "ApiNotActivatedMapError"
**Causa**: Una o più APIs richieste non sono abilitate
**Soluzione**:
- Verificare che tutte le APIs siano abilitate nel progetto
- Maps JavaScript API, Geocoding API, Places API

### Errore: "OVER_QUERY_LIMIT"
**Causa**: Superato il limite di richieste
**Soluzione**:
- Controllare le quote in Google Cloud Console
- Implementare caching più aggressivo
- Aumentare i limiti se necessario

### La mappa mostra "For development purposes only"
**Causa**: Billing non configurato correttamente
**Soluzione**:
- Verificare che il billing sia attivo
- Controllare che il progetto sia collegato all'account di fatturazione

## Best Practices di Sicurezza

### 1. MAI committare API keys
```bash
# .gitignore
.env
.env.local
.env.*.local
```

### 2. Usare variabili ambiente
```javascript
// ✅ CORRETTO
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// ❌ SBAGLIATO
const apiKey = 'AIzaSyBxxxxxxxxxxxxxxxxxx';
```

### 3. Restrizioni sempre attive
- Sempre configurare HTTP referrers per frontend
- Limitare APIs solo a quelle necessarie
- Impostare quote giornaliere

### 4. Monitoring continuo
- Configurare alert su usage anomalo
- Controllare regolarmente i costi
- Verificare logs per tentativi di abuso

## Costi Stimati

### Utilizzo Tipico Mensile (1000 utenti attivi)
- Map loads: ~5,000 → $35
- Geocoding: ~2,000 → $10
- Autocomplete: ~3,000 sessions → $8.50
- Distance Matrix: ~1,000 → $5
- **TOTALE**: ~$58.50/mese

### Con Ottimizzazioni (Cache + Batch)
- Map loads: ~3,000 → $21
- Geocoding: ~500 (cached) → $2.50
- Autocomplete: ~2,000 sessions → $5.66
- Distance Matrix: ~200 (cached) → $1
- **TOTALE**: ~$30.16/mese

## Checklist Finale

- [ ] Progetto Google Cloud creato
- [ ] Billing configurato e attivo
- [ ] APIs abilitate (Maps JS, Geocoding, Places)
- [ ] API Key creata
- [ ] Restrizioni HTTP referrer configurate
- [ ] Restrizioni API configurate
- [ ] Quote giornaliere impostate
- [ ] Budget alerts configurati
- [ ] API Key in .env (frontend e backend)
- [ ] Test mappa funzionante
- [ ] Test autocomplete funzionante
- [ ] Test geocoding funzionante
- [ ] Monitoring attivo

## Supporto

Per problemi con Google Maps:
- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Google Cloud Support](https://cloud.google.com/support)
- [Stack Overflow - google-maps tag](https://stackoverflow.com/questions/tagged/google-maps)

Per problemi con l'integrazione:
- Verificare i logs del browser (F12)
- Controllare i logs del server backend
- Verificare la documentazione in `/Docs/02-ARCHITETTURA/maps-integration.md`
