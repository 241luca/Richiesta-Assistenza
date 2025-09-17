# 🗺️ Google Maps Integration

## Panoramica

Il sistema integra Google Maps per fornire funzionalità di geolocalizzazione, visualizzazione mappe e autocompletamento indirizzi.

## Componenti Principali

### 1. Backend Services

#### GeocodingService (`backend/src/services/geocoding.service.ts`)
- **Geocoding**: Conversione indirizzo → coordinate
- **Reverse Geocoding**: Conversione coordinate → indirizzo
- **Distance Calculation**: Calcolo distanze e tempi di percorrenza
- **Route Optimization**: Ottimizzazione percorsi multi-punto
- **Cache Redis**: TTL 30 giorni per geocoding, 24 ore per distanze

### 2. Frontend Components

#### GoogleMapsContext (`src/contexts/GoogleMapsContext.tsx`)
- Provider globale per Google Maps
- Caricamento librerie: places, geometry, drawing
- Configurazione lingua italiana e regione IT

#### RequestMap (`src/components/maps/RequestMap.tsx`)
- Visualizzazione richieste su mappa
- Clustering automatico per zone dense
- Filtri per stato, categoria, priorità
- InfoWindow con dettagli richiesta
- Icone colorate per stato

#### AddressAutocomplete (`src/components/maps/AddressAutocomplete.tsx`)
- Autocompletamento indirizzi con Google Places
- Restrizione a indirizzi italiani
- Estrazione componenti indirizzo (via, città, CAP, provincia)
- Validazione automatica

#### ProfessionalZoneMap (`src/components/maps/ProfessionalZoneMap.tsx`)
- Disegno zone di copertura (poligoni, cerchi, rettangoli)
- Calcolo area automatico in km²
- Modifica e cancellazione zone
- Esportazione KML per Google Earth

## API Endpoints

### POST `/api/geocode/address`
Converte un indirizzo in coordinate geografiche.

**Request:**
```json
{
  "address": "Via Roma 1",
  "city": "Milano",
  "province": "MI",
  "postalCode": "20100"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "lat": 45.4642,
    "lng": 9.1900
  }
}
```

### POST `/api/geocode/reverse`
Converte coordinate in indirizzo.

**Request:**
```json
{
  "lat": 45.4642,
  "lng": 9.1900
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "Via Roma 1, 20100 Milano MI, Italia"
  }
}
```

### POST `/api/geocode/distance`
Calcola distanza tra due punti.

**Request:**
```json
{
  "origin": { "lat": 45.4642, "lng": 9.1900 },
  "destination": { "lat": 41.9028, "lng": 12.4964 }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "distance": 572.5,  // km
    "duration": 330     // minuti
  }
}
```

### POST `/api/geocode/nearby-professionals`
Trova professionisti vicini.

**Request:**
```json
{
  "lat": 45.4642,
  "lng": 9.1900,
  "maxDistanceKm": 50,
  "categoryId": "uuid-categoria"
}
```

### POST `/api/geocode/optimize-route`
Ottimizza percorso multi-punto.

## Configurazione

### 1. Google Cloud Console

1. Accedere a [Google Cloud Console](https://console.cloud.google.com/)
2. Creare un nuovo progetto o selezionarne uno esistente
3. Abilitare le seguenti APIs:
   - Maps JavaScript API
   - Geocoding API
   - Places API
   - Distance Matrix API (opzionale)
   - Directions API (opzionale)

### 2. API Key

1. Creare una nuova API key
2. Configurare restrizioni:
   - **HTTP referrers** per frontend:
     - `http://localhost:5193/*`
     - `https://tuodominio.com/*`
   - **IP addresses** per backend (opzionale)
3. Impostare quote giornaliere per controllo costi

### 3. Variabili Ambiente

**Frontend (.env):**
```env
VITE_GOOGLE_MAPS_API_KEY=AIza...
```

**Backend (backend/.env):**
```env
GOOGLE_MAPS_API_KEY=AIza...
```

## Cache Strategy

### Redis Caching
- **Geocoding Results**: TTL 30 giorni
- **Distance Calculations**: TTL 24 ore
- **Reverse Geocoding**: TTL 30 giorni
- **Key Pattern**: `geocode:*`, `distance:*`

### Cache Invalidation
```bash
# Pulire cache manualmente (admin only)
DELETE /api/geocode/cache
```

## Rate Limiting

- **Address Geocoding**: 100 richieste/ora per utente
- **Distance Calculation**: 100 richieste/ora per utente
- **Nearby Professionals**: 50 richieste/ora per utente
- **Route Optimization**: 20 richieste/ora per utente

## Database Schema

### AssistanceRequest Model
```prisma
model AssistanceRequest {
  // ... altri campi
  
  // Location
  address     String?
  city        String?
  province    String?
  postalCode  String?
  latitude    Float?    // Aggiunto per geocoding
  longitude   Float?    // Aggiunto per geocoding
}
```

## Best Practices

### 1. Geocoding
- Sempre geocodare in background (queue)
- Cachare risultati per ridurre costi
- Validare indirizzi italiani prima di geocoding
- Gestire fallimenti gracefully

### 2. Maps Display
- Usare clustering per molti marker
- Lazy loading per performance
- Limitare zoom levels se necessario
- Customizzare stili per branding

### 3. Autocomplete
- Limitare a tipi specifici (address)
- Restringere a paese (IT)
- Debounce input utente
- Mostrare loading states

### 4. Zone Management
- Limitare numero zone per professionista
- Validare overlapping zones
- Calcolare aree per pricing
- Permettere export/import

## Monitoraggio e Analytics

### Metriche da Tracciare
- Numero geocoding al giorno
- Cache hit rate
- Errori API Google
- Tempo medio risposta
- Costi API mensili

### Dashboard Consigliata
```javascript
// Esempio query monitoring
SELECT 
  DATE(created_at) as day,
  COUNT(*) as geocoding_requests,
  AVG(response_time) as avg_time,
  SUM(CASE WHEN cached THEN 1 ELSE 0 END) as cache_hits
FROM geocoding_logs
GROUP BY DATE(created_at)
ORDER BY day DESC;
```

## Troubleshooting

### Errori Comuni

#### "API key not valid"
- Verificare key in .env
- Controllare restrizioni in Google Cloud Console
- Verificare che APIs siano abilitate

#### "Quota exceeded"
- Controllare limiti giornalieri
- Implementare caching più aggressivo
- Considerare upgrade piano Google

#### "Address not found"
- Verificare formato indirizzo italiano
- Aggiungere "Italia" all'indirizzo
- Provare con CAP e provincia

#### "CORS error"
- Aggiungere dominio a HTTP referrers
- Verificare configurazione API key
- Controllare headers CORS backend

## Costi Stimati

### Google Maps Pricing (2024)
- **Geocoding API**: $5 per 1000 richieste
- **Places Autocomplete**: $2.83 per 1000 sessioni
- **Maps JavaScript**: $7 per 1000 caricamenti
- **Distance Matrix**: $5 per 1000 elementi

### Ottimizzazione Costi
1. Implementare cache aggressiva
2. Batch geocoding quando possibile
3. Limitare autocomplete sessions
4. Usare static maps dove possibile
5. Monitorare usage in Google Console

## Esempi di Utilizzo

### Geocoding Automatico su Creazione Richiesta
```typescript
// Nel service di creazione richiesta
const coordinates = await geocodingService.geocodeRequest(
  data.address,
  data.city,
  data.province,
  data.postalCode
);

if (coordinates) {
  data.latitude = coordinates.lat;
  data.longitude = coordinates.lng;
}
```

### Ricerca Professionisti Vicini
```typescript
const nearbyProfessionals = await api.post('/geocode/nearby-professionals', {
  lat: request.latitude,
  lng: request.longitude,
  maxDistanceKm: 30,
  categoryId: request.categoryId
});
```

### Utilizzo Mappa in React
```tsx
import { GoogleMapsProvider } from '@/contexts/GoogleMapsContext';
import { RequestMap } from '@/components/maps/RequestMap';

function App() {
  return (
    <GoogleMapsProvider>
      <RequestMap 
        requests={requests}
        showFilters={true}
        onRequestClick={handleRequestClick}
      />
    </GoogleMapsProvider>
  );
}
```

## Roadmap Futura

- [ ] Heatmap densità richieste
- [ ] Routing multi-stop per professionisti
- [ ] Geofencing per notifiche
- [ ] Street View integration
- [ ] Offline maps support
- [ ] Real-time tracking professionisti
