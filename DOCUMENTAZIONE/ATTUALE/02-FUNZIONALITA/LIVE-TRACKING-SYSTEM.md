# 📍 LIVE TRACKING SYSTEM - Tracking Real-time Professionisti

**Data**: 5 Ottobre 2025  
**Versione**: 1.0.0  
**Stato**: ✅ Completamente Implementato  
**Autore**: Sistema Richiesta Assistenza

---

## 🎯 PANORAMICA

Il **Live Tracking System** permette ai clienti di monitorare in tempo reale la posizione del professionista che sta per raggiungerli, con calcolo automatico dell'ETA e notifiche smart.

### 🚀 Funzionalità Principali

- 📍 **Tracking real-time** posizione professionista
- ⏱️ **ETA dinamico** con Google Maps Distance Matrix API
- 🔔 **Notifiche automatiche** "sta arrivando" e "nelle vicinanze"
- 🗺️ **Mappa interattiva** con percorso ottimale
- 📱 **Azioni rapide** chat e chiamata
- 🔒 **Privacy-first** tracking solo durante interventi attivi

---

## 🏗️ ARCHITETTURA SISTEMA

### Backend Components

```
LocationService
├── updateProfessionalLocation()  → Aggiorna posizione
├── calculateETA()               → Calcolo distanza/tempo  
├── getCurrentLocation()         → Posizione corrente
├── clearProfessionalLocation()  → Vai offline
└── getStats()                   → Statistiche sistema

LocationRoutes (/api/location)
├── POST /update                 → Aggiorna posizione (PROFESSIONAL)
├── GET /professional/:id        → Posizione professionista
├── GET /request/:id/tracking    → Tracking completo richiesta
├── GET /active                  → Lista professionisti attivi (ADMIN)
├── DELETE /clear                → Disattiva tracking (PROFESSIONAL)
└── GET /stats                   → Statistiche (ADMIN)
```

### Frontend Components

```
LiveTrackingMap
├── ProfessionalMarker          → Marker animato professionista
├── DestinationMarker           → Marker destinazione
├── WebSocket Listeners         → Real-time updates
├── ETA Card                    → Display tempo arrivo
├── Status Overlay              → Stato connessione
└── Quick Actions               → Chat/chiamata
```

---

## 📡 API REFERENCE

### POST /api/location/update
Aggiorna la posizione del professionista (solo professionisti autenticati).

**Payload**:
```json
{
  "latitude": 45.4642,
  "longitude": 9.1900,
  "accuracy": 10,
  "heading": 90,
  "speed": 5.5
}
```

**Response**:
```json
{
  "success": true,
  "message": "Posizione aggiornata con successo",
  "data": {
    "latitude": 45.4642,
    "longitude": 9.1900,
    "accuracy": 10,
    "timestamp": "2025-10-05T14:30:00.000Z"
  }
}
```

### GET /api/location/professional/:professionalId
Ottiene la posizione corrente di un professionista.

**Autorizzazioni**:
- Il professionista stesso
- Clienti con richieste attive con quel professionista  
- Admin

**Response**:
```json
{
  "success": true,
  "data": {
    "latitude": 45.4642,
    "longitude": 9.1900,
    "accuracy": 10,
    "heading": 90,
    "speed": 5.5,
    "timestamp": "2025-10-05T14:30:00.000Z"
  }
}
```

### GET /api/location/request/:requestId/tracking
Dati completi di tracking per una richiesta specifica.

**Response**:
```json
{
  "success": true,
  "data": {
    "requestId": "uuid",
    "request": {
      "title": "Riparazione caldaia",
      "status": "IN_PROGRESS",
      "address": "Via Roma 123, Milano",
      "latitude": 45.4642,
      "longitude": 9.1900
    },
    "professional": {
      "id": "uuid",
      "firstName": "Mario",
      "lastName": "Rossi"
    },
    "professionalLocation": {
      "latitude": 45.4500,
      "longitude": 9.1800,
      "accuracy": 8,
      "timestamp": "2025-10-05T14:30:00.000Z"
    },
    "eta": {
      "distance": 1200,
      "duration": 480,
      "durationText": "8 min",
      "distanceText": "1.2 km"
    },
    "isTrackingActive": true,
    "lastUpdate": "2025-10-05T14:30:00.000Z"
  }
}
```

### DELETE /api/location/clear
Il professionista disattiva il proprio tracking.

**Response**:
```json
{
  "success": true,
  "data": {
    "cleared": true,
    "timestamp": "2025-10-05T14:30:00.000Z",
    "notifiedClients": 2
  }
}
```

---

## 🔌 WEBSOCKET EVENTS

### professional:location
Aggiornamento posizione real-time inviato al cliente.

```json
{
  "requestId": "uuid",
  "professionalId": "uuid", 
  "professionalName": "Mario Rossi",
  "location": {
    "latitude": 45.4642,
    "longitude": 9.1900,
    "accuracy": 10,
    "timestamp": "2025-10-05T14:30:00.000Z"
  },
  "eta": {
    "distance": 800,
    "duration": 300,
    "durationText": "5 min"
  }
}
```

### professional:arriving
Notifica quando il professionista sta arrivando (ETA < 5 min).

```json
{
  "requestId": "uuid",
  "professionalId": "uuid",
  "professionalName": "Mario Rossi", 
  "estimatedMinutes": 4,
  "message": "Mario sta arrivando! Tempo stimato: 4 minuti"
}
```

### professional:nearby
Notifica quando il professionista è nelle vicinanze (< 100m).

```json
{
  "requestId": "uuid",
  "professionalId": "uuid",
  "professionalName": "Mario Rossi",
  "distance": 50,
  "message": "Mario è arrivato nelle vicinanze!"
}
```

### professional:offline
Notifica quando il professionista va offline.

```json
{
  "requestId": "uuid",
  "professionalId": "uuid",
  "message": "Il professionista ha disattivato il tracking"
}
```

---

## 🎮 UTILIZZO PRATICO

### Implementazione Frontend

```tsx
import { LiveTrackingMap } from '../components/maps/LiveTrackingMap';

function RequestTrackingPage({ request }) {
  const handleCallProfessional = () => {
    window.open(`tel:${request.professional.phone}`);
  };

  const handleOpenChat = () => {
    navigate(`/chat/${request.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Tracking: {request.professional.firstName} sta arrivando
      </h1>
      
      <LiveTrackingMap
        requestId={request.id}
        professionalId={request.professionalId}
        destinationLat={request.latitude}
        destinationLng={request.longitude}
        destinationAddress={request.address}
        onCallProfessional={handleCallProfessional}
        onOpenChat={handleOpenChat}
        className="mb-6"
      />
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-blue-800">
          💡 La posizione viene aggiornata in tempo reale. 
          Riceverai una notifica quando il professionista starà arrivando.
        </p>
      </div>
    </div>
  );
}
```

### Aggiornamento Posizione (App Mobile)

```typescript
// Hook per tracking automatico
export const useLocationTracking = (enabled: boolean) => {
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy, heading, speed } = position.coords;
        
        try {
          await api.post('/location/update', {
            latitude,
            longitude,
            accuracy,
            heading: heading || undefined,
            speed: speed || undefined
          });
          console.log('📍 Posizione aggiornata:', { latitude, longitude });
        } catch (error) {
          console.error('❌ Errore aggiornamento posizione:', error);
        }
      },
      (error) => {
        console.error('❌ Errore geolocalizzazione:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000 // Cache 5 secondi
      }
    );

    setWatchId(id);

    return () => {
      if (id) {
        navigator.geolocation.clearWatch(id);
      }
    };
  }, [enabled]);

  return { watchId };
};

// Utilizzo nel componente professionista
function ProfessionalApp() {
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  useLocationTracking(trackingEnabled);

  const handleToggleTracking = async () => {
    if (trackingEnabled) {
      await api.delete('/location/clear');
      setTrackingEnabled(false);
    } else {
      setTrackingEnabled(true);
    }
  };

  return (
    <div>
      <button 
        onClick={handleToggleTracking}
        className={`px-4 py-2 rounded-lg ${
          trackingEnabled 
            ? 'bg-red-600 text-white' 
            : 'bg-green-600 text-white'
        }`}
      >
        {trackingEnabled ? '📵 Disattiva Tracking' : '📍 Attiva Tracking'}
      </button>
    </div>
  );
}
```

---

## 🔒 SICUREZZA E PRIVACY

### Autorizzazioni

| Ruolo | Endpoint | Accesso |
|-------|----------|---------|
| **PROFESSIONAL** | `POST /update` | ✅ Solo propria posizione |
| **PROFESSIONAL** | `DELETE /clear` | ✅ Solo proprio tracking |
| **CLIENT** | `GET /professional/:id` | ✅ Solo se ha richieste attive |
| **CLIENT** | `GET /request/:id/tracking` | ✅ Solo proprie richieste |
| **ADMIN** | `GET /active` | ✅ Tutti i professionisti |
| **ADMIN** | `GET /stats` | ✅ Statistiche complete |

### Privacy Safeguards

- 🔐 **Tracking limitato**: Solo durante interventi attivi
- ⏰ **Timeout automatico**: Posizioni più vecchie di 10 min vengono rimosse
- 🚫 **Consenso richiesto**: Professionista deve attivare esplicitamente
- 📊 **Audit completo**: Tutte le operazioni tracciate
- 🔄 **Cache cleanup**: Cleanup automatico ogni 5 minuti

---

## ⚡ PERFORMANCE E SCALABILITÀ

### Ottimizzazioni

- **Cache ETA**: 2 minuti per evitare troppe API call a Google Maps
- **Rate Limiting**: 60 aggiornamenti/minuto per professionista
- **Cleanup automatico**: Rimuove posizioni obsolete ogni 5 minuti
- **WebSocket clustering**: Supporto multi-istanza

### Metriche Performance

```typescript
// Statistiche disponibili via GET /api/location/stats
{
  "activeLocations": 25,        // Professionisti con tracking attivo
  "cacheSize": 30,              // Posizioni in cache
  "etaCacheSize": 45,           // ETA calcolati in cache
  "activeRequests": 18,         // Richieste in corso
  "systemHealth": {
    "cacheEfficiency": "83.3%", // Hit rate cache
    "memoryUsage": "75 objects", // Utilizzo memoria
    "isHealthy": true            // Stato generale
  }
}
```

### Limiti Raccomandati

- **Professionisti attivi**: < 1000 simultanei
- **Cache size**: < 2000 oggetti
- **Update frequency**: Max 1 al secondo per professionista
- **ETA cache**: 2 minuti per posizione

---

## 🧪 TESTING

### Test di Integrazione

```bash
# Test endpoint base
curl -X GET http://localhost:3200/api/location/stats \
  -H "Authorization: Bearer <admin_token>"

# Test aggiornamento posizione  
curl -X POST http://localhost:3200/api/location/update \
  -H "Authorization: Bearer <professional_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 45.4642,
    "longitude": 9.1900,
    "accuracy": 10
  }'
```

### Test WebSocket

```javascript
// Test connessione WebSocket
const socket = io('http://localhost:3200', {
  auth: { token: 'your_token_here' }
});

socket.on('professional:location', (data) => {
  console.log('📍 Posizione ricevuta:', data);
});

socket.on('professional:arriving', (data) => {
  console.log('🚗 Professionista in arrivo:', data);
});
```

---

## 🚀 ROADMAP FUTURE

### Miglioramenti Previsti

1. **Previsioni Traffico ML**: Algoritmi avanzati per ETA più precisi
2. **Zone Coverage Dinamiche**: Aree operative che si adattano al traffico
3. **Mobile App Professionale**: App dedicata con tracking automatico
4. **Voice Notifications**: Supporto utenti ipovedenti
5. **Wearable Integration**: Supporto smartwatch e fitness tracker
6. **Fleet Management**: Dashboard per aziende con molti professionisti

### Integrazioni Pianificate

- **Apple MapKit**: Alternativa a Google Maps per iOS
- **HERE Maps**: Provider aggiuntivo per ridondanza
- **Telegram Bot**: Notifiche via bot Telegram
- **WhatsApp Business**: Notifiche via WhatsApp ufficiale

---

## 📞 SUPPORTO

### Troubleshooting Comune

**Q: Il tracking non funziona su mobile**  
A: Verificare permessi geolocalizzazione e connessione internet

**Q: ETA non viene calcolato**  
A: Controllare Google Maps API key e quota disponibile

**Q: WebSocket si disconnette spesso**  
A: Verificare configurazione proxy e firewall

**Q: Posizione non si aggiorna**  
A: Controllare che il professionista abbia richieste attive

### Contatti
- **Tech Lead**: Luca Mambelli
- **Email**: lucamambelli@lmtecnologie.it
- **Documentazione**: `/DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/`

---

**Documento Tecnico v1.0**  
**Sistema Live Tracking - Ready for Production ✅**
