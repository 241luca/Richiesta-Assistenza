# Script di Debug per verificare le distanze

## 1. Apri la Console del Browser (F12)

## 2. Copia e incolla questo codice per verificare i dati della dashboard:

```javascript
// Verifica cosa restituisce la dashboard
fetch('http://localhost:3200/api/dashboard', {
  credentials: 'include'
})
.then(res => res.json())
.then(data => {
  console.log('=== DATI DASHBOARD ===');
  console.log('Stats:', data.data?.stats);
  console.log('Recent Requests:', data.data?.recentRequests);
  
  // Verifica se ci sono indirizzi
  if (data.data?.recentRequests) {
    data.data.recentRequests.forEach((req, i) => {
      console.log(`Richiesta ${i + 1}:`, {
        title: req.title,
        address: req.address,
        city: req.city,
        province: req.province,
        professionalAddress: req.professionalAddress
      });
    });
  }
});
```

## 3. Test calcolo distanza manuale:

```javascript
// Test diretto dell'endpoint distanza
fetch('http://localhost:3200/api/maps/calculate-distance', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
  },
  body: JSON.stringify({
    origin: 'Via Roma 1, Milano',
    destination: 'Via Dante 5, Milano'
  })
})
.then(res => res.json())
.then(data => {
  console.log('=== TEST DISTANZA ===');
  console.log('Risposta:', data);
  if (data.success && data.data) {
    console.log('Distanza:', data.data.distanceText);
    console.log('Durata:', data.data.durationText);
  }
})
.catch(err => console.error('Errore:', err));
```

## 4. Verifica configurazione Google Maps:

```javascript
// Verifica se l'API key è configurata
fetch('http://localhost:3200/api/maps/config', {
  credentials: 'include'
})
.then(res => res.json())
.then(data => {
  console.log('=== CONFIG MAPS ===');
  console.log('Configurata?', data.data?.isConfigured);
  console.log('API Key presente?', data.data?.apiKey ? 'SI' : 'NO');
});
```

## 5. Per creare una richiesta di test con indirizzo:

```javascript
// Crea una richiesta con indirizzo per testare
fetch('http://localhost:3200/api/requests', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
  },
  body: JSON.stringify({
    title: 'Test richiesta con indirizzo',
    description: 'Richiesta di test per verificare distanze',
    categoryId: 1, // Metti un ID categoria valido
    address: 'Via del Corso 10',
    city: 'Roma',
    province: 'RM',
    postalCode: '00186',
    priority: 'MEDIUM'
  })
})
.then(res => res.json())
.then(data => {
  console.log('=== RICHIESTA CREATA ===');
  console.log('Risultato:', data);
});
```

## RISULTATI ATTESI:

1. **Se vedi tutti gli indirizzi null/undefined**: Le richieste non hanno indirizzi nel database
2. **Se il test distanza fallisce con "API_KEY_NOT_FOUND"**: Google Maps non è configurato
3. **Se il test distanza funziona ma non vedi distanze**: Il componente DistanceBadge ha problemi

Copia questi comandi nella console e dimmi cosa vedi!
