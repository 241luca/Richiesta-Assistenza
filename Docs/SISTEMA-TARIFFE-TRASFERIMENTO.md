# Sistema Tariffe Trasferimento - Documentazione Completa
**Data ultimo aggiornamento: 31/08/2025**

## 📋 Indice
1. [Panoramica](#panoramica)
2. [Architettura](#architettura)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Frontend Components](#frontend-components)
6. [Guida Utilizzo](#guida-utilizzo)
7. [Configurazione](#configurazione)

---

## 🎯 Panoramica

Il Sistema di Tariffe Trasferimento permette ai professionisti di configurare e gestire i costi di viaggio per gli interventi presso i clienti. Il sistema calcola automaticamente i costi basandosi su:
- Distanza calcolata via Google Maps
- Scaglioni chilometrici personalizzabili
- Supplementi per situazioni speciali (weekend, notturno, urgente, festivi)

### Caratteristiche Principali
- ✅ Configurazione tariffe personalizzate per professionista
- ✅ Calcolo automatico integrato con Google Maps
- ✅ Scaglioni chilometrici flessibili
- ✅ Supplementi configurabili
- ✅ Visualizzazione trasparente per i clienti
- ✅ Integrazione con sistema preventivi

---

## 🏗️ Architettura

### Stack Tecnologico
- **Backend**: Node.js + TypeScript + Express
- **Database**: PostgreSQL
- **Frontend**: React + TypeScript + TailwindCSS
- **Integrazioni**: Google Maps API per calcolo distanze

### Flusso Dati
```
1. Professionista → Configura Tariffe → Database
2. Cliente → Crea Richiesta → Calcolo Distanza (Google Maps)
3. Sistema → Applica Tariffe → Calcolo Costo Totale
4. Preventivo → Include Costi Trasferimento → Cliente
```

---

## 💾 Database Schema

### Tabella: `travel_cost_settings`
Impostazioni principali per ogni professionista.

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| id | UUID | Primary key |
| professional_id | UUID | FK to users table |
| base_cost | INTEGER | Costo base in centesimi |
| free_distance_km | INTEGER | Km gratuiti iniziali |
| is_active | BOOLEAN | Stato attivazione |
| created_at | TIMESTAMP | Data creazione |
| updated_at | TIMESTAMP | Ultimo aggiornamento |

### Tabella: `travel_cost_ranges`
Scaglioni chilometrici con tariffe differenziate.

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| id | UUID | Primary key |
| settings_id | UUID | FK to travel_cost_settings |
| from_km | INTEGER | Km iniziali scaglione |
| to_km | INTEGER | Km finali (NULL = infinito) |
| cost_per_km | INTEGER | Costo per km in centesimi |
| order_index | INTEGER | Ordine visualizzazione |

### Tabella: `travel_supplements`
Supplementi opzionali per situazioni speciali.

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| id | UUID | Primary key |
| settings_id | UUID | FK to travel_cost_settings |
| supplement_type | VARCHAR(20) | WEEKEND/NIGHT/HOLIDAY/URGENT |
| percentage | INTEGER | Percentuale supplemento |
| fixed_amount | INTEGER | Importo fisso in centesimi |
| is_active | BOOLEAN | Stato attivazione |

---

## 🌐 API Endpoints

### GET `/api/travel/cost-settings`
Recupera le impostazioni tariffe del professionista autenticato.

**Headers Required**: Authorization Bearer Token

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "professionalId": "uuid",
    "baseCost": 1000,
    "freeDistanceKm": 0,
    "isActive": true,
    "costRanges": [
      {
        "fromKm": 0,
        "toKm": 10,
        "costPerKm": 100
      }
    ],
    "supplements": [
      {
        "supplementType": "WEEKEND",
        "percentage": 20,
        "fixedAmount": 0,
        "isActive": true
      }
    ]
  }
}
```

### POST `/api/travel/cost-settings`
Salva o aggiorna le impostazioni tariffe.

**Request Body**:
```json
{
  "baseCost": 1000,
  "freeDistanceKm": 5,
  "isActive": true,
  "costRanges": [...],
  "supplements": [...]
}
```

### GET `/api/travel/professional/:id/cost-settings`
Endpoint pubblico per visualizzare le tariffe di un professionista.

**No Authentication Required**

### POST `/api/travel/calculate-cost`
Calcola il costo totale per una distanza specifica.

**Request Body**:
```json
{
  "professionalId": "uuid",
  "distanceKm": 15.5,
  "options": {
    "isWeekend": false,
    "isNight": false,
    "isHoliday": false,
    "isUrgent": true
  }
}
```

---

## 🎨 Frontend Components

### TravelCostSettings
Componente principale per la gestione delle tariffe.

**Location**: `/src/components/travel/TravelCostSettings.tsx`

**Features**:
- Form configurazione tariffe
- Gestione scaglioni dinamici
- Attivazione supplementi
- Esempio calcolo in tempo reale

### TravelCostDisplay
Visualizzazione pubblica delle tariffe.

**Location**: `/src/components/travel/TravelCostDisplay.tsx`

**Variants**:
- `compact`: Versione ridotta per card
- `full`: Versione completa con tabella

### Integrazione nelle Pagine

#### ProfilePage
```tsx
import { TravelCostSettings } from '../components/travel/TravelCostSettings';

// Nel profilo professionista
<TravelCostSettings />
```

#### ProfessionalSkillsPage
```tsx
import { TravelCostSettings, TravelCostDisplay } from '../components/travel';

// Tab per gestione e anteprima
```

---

## 📖 Guida Utilizzo

### Per Professionisti

#### 1. Configurazione Iniziale
1. Accedi al tuo profilo
2. Vai alla sezione "Viaggi e Distanze"
3. Clicca sul tab "Tariffe Trasferimento"
4. Configura:
   - **Costo Base**: Importo fisso per ogni intervento
   - **Km Gratuiti**: Distanza non addebitata
   - **Scaglioni**: Tariffe differenziate per distanza
   - **Supplementi**: Maggiorazioni opzionali

#### 2. Gestione Scaglioni
- Clicca "Aggiungi Scaglione" per nuovi range
- Configura km iniziali/finali e tariffa
- L'ultimo scaglione ha sempre "fino a ∞"

#### 3. Supplementi
- Attiva solo quelli che utilizzi
- Configura percentuale E/O importo fisso
- Esempi comuni:
  - Weekend: +20%
  - Notturno: +30%
  - Festivi: +50%
  - Urgente: +€20 fisso

### Per Clienti

Le tariffe vengono mostrate:
- Nel profilo pubblico del professionista
- Durante la creazione del preventivo
- Nel dettaglio del preventivo ricevuto

---

## ⚙️ Configurazione

### Variabili d'Ambiente
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Google Maps (per calcolo distanze)
GOOGLE_MAPS_API_KEY=your_api_key
```

### Installazione Database

1. Esegui la migrazione:
```bash
./create-travel-tables.sh
```

2. Verifica le tabelle:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'travel_%';
```

### Test del Sistema

1. **Test configurazione**:
```bash
curl -X GET http://localhost:3200/api/travel/cost-settings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

2. **Test calcolo**:
```bash
curl -X POST http://localhost:3200/api/travel/calculate-cost \
  -H "Content-Type: application/json" \
  -d '{
    "professionalId": "uuid",
    "distanceKm": 25,
    "options": {
      "isWeekend": true
    }
  }'
```

---

## 🔧 Troubleshooting

### Errore 404 su GET cost-settings
- Verifica che le tabelle siano create nel database
- Controlla che l'utente sia autenticato come PROFESSIONAL

### Calcolo costi non corretto
- Verifica ordine scaglioni (devono essere contigui)
- Controlla che is_active sia true nelle impostazioni

### Supplementi non applicati
- Verifica che il supplemento sia attivo
- Controlla che le opzioni siano passate correttamente

---

## 📈 Future Enhancements

- [ ] Report mensili costi trasferimento
- [ ] Ottimizzazione percorsi multipli
- [ ] Integrazione con calendario per supplementi automatici
- [ ] API pubblica per integrazioni esterne
- [ ] Export dati per commercialista

---

## 📞 Supporto

Per problemi o domande sul sistema tariffe:
- Consultare i log: `/backend/logs/`
- Verificare la console browser per errori frontend
- Controllare lo stato delle API: `GET /health`

---

**Sistema Tariffe Trasferimento v1.0** - Richiesta Assistenza Platform