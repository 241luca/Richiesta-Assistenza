# REQUEST ID TRACKING - DOCUMENTAZIONE COMPLETA

## PANORAMICA

Il sistema di Request ID Tracking è stato implementato per migliorare il debugging e la tracciabilità delle richieste attraverso tutto il sistema.

## COME FUNZIONA

### 1. Generazione Automatica
- Ogni richiesta HTTP riceve automaticamente un UUID univoco
- Il middleware `requestIdMiddleware` è il PRIMO dopo i middleware di sicurezza
- Formato: UUID v4 (es: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

### 2. Propagazione
Il Request ID viene propagato in:
- **Request Object**: `req.requestId`
- **Response Headers**: `X-Request-ID`
- **Response Body**: Aggiunto automaticamente a tutte le risposte con timestamp
- **Logs**: Incluso in TUTTI i log per correlazione

### 3. Correlazione Log
Tutti i log della stessa richiesta avranno lo stesso requestId:
```
2025-01-06 10:30:45 [info]: Incoming request {"requestId":"abc123","method":"GET","path":"/api/users"}
2025-01-06 10:30:45 [info]: User authenticated {"requestId":"abc123","userId":"123"}
2025-01-06 10:30:45 [info]: Database query executed {"requestId":"abc123","query":"SELECT..."}
2025-01-06 10:30:45 [info]: Response sent {"requestId":"abc123","status":200}
```

## IMPLICAZIONI E COMPATIBILITÀ

### ✅ COSA NON CAMBIA (Backward Compatible)
1. **Tutte le API esistenti** continuano a funzionare identicamente
2. **Il frontend esistente** non deve essere modificato
3. **I test esistenti** continuano a funzionare
4. **Le risposte** mantengono la stessa struttura (con requestId aggiunto)

### 🆕 COSA VIENE AGGIUNTO
1. **Header aggiuntivo** `X-Request-ID` in tutte le risposte
2. **Campo aggiuntivo** `requestId` nel body delle risposte (quando c'è timestamp)
3. **Log arricchiti** con requestId per debugging migliore
4. **Possibilità di tracking** end-to-end delle richieste

### ⚠️ COSA FARE ATTENZIONE
1. **Performance**: Minimo overhead (~0.1ms per richiesta)
2. **Log size**: I log aumentano leggermente di dimensione
3. **Privacy**: Il requestId NON contiene dati sensibili

## USO NEI CONTROLLERS/ROUTES

### Metodo 1: Helper Functions (CONSIGLIATO)
```typescript
import { logInfo, logError, getRequestId } from '../middleware/requestId';

router.get('/example', async (req, res) => {
  // Log con requestId automatico
  logInfo(req, 'Processing example request', { additionalData: 'value' });
  
  try {
    const result = await someOperation();
    logInfo(req, 'Operation successful');
    
    return res.json(ResponseFormatter.success(result));
  } catch (error) {
    logError(req, 'Operation failed', { error: error.message });
    return res.status(500).json(ResponseFormatter.error('Failed'));
  }
});
```

### Metodo 2: Accesso Diretto
```typescript
router.get('/example', async (req, res) => {
  const requestId = req.requestId;
  
  logger.info('Custom log', { requestId, data: 'value' });
  
  // ...
});
```

## USO NEI SERVICES

I services possono ricevere il requestId come parametro opzionale:

```typescript
// service.ts
export async function getUserById(userId: string, requestId?: string) {
  logger.info('Fetching user', { requestId, userId });
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user) {
    logger.warn('User not found', { requestId, userId });
    throw new Error('User not found');
  }
  
  return user;
}

// route.ts
router.get('/users/:id', async (req, res) => {
  const user = await getUserById(req.params.id, req.requestId);
  // ...
});
```

## TESTING

### Endpoints di Test (SOLO in development)
```bash
# Test base - verifica requestId
curl http://localhost:3200/api/test/request-id

# Test errore con requestId
curl http://localhost:3200/api/test/request-id/error

# Test correlazione log
curl http://localhost:3200/api/test/request-id/correlation

# Test headers
curl -i http://localhost:3200/api/test/request-id/headers
```

### Verifica nei Log
```bash
# Vedere tutti i log di una specifica richiesta
grep "requestId\":\"abc123" logs/combined-*.log
```

### Verifica Response Headers
```bash
curl -i http://localhost:3200/api/users
# Cerca: X-Request-ID: <uuid>
```

## DEBUGGING CON REQUEST ID

### Scenario 1: Errore riportato da utente
1. Chiedere all'utente il requestId (visibile negli strumenti sviluppatore)
2. Cercare nei log: `grep "requestId\":\"<id>" logs/*.log`
3. Vedere l'intera sequenza di operazioni per quella richiesta

### Scenario 2: Errore nei log
1. Trovare il requestId dell'errore nei log
2. Cercare tutti i log correlati con lo stesso requestId
3. Ricostruire l'intera catena di eventi

### Scenario 3: Performance debugging
1. Cercare tutti i log di una richiesta lenta
2. Analizzare i timestamp per identificare il bottleneck
3. Il requestId collega tutti i passaggi

## BEST PRACTICES

### ✅ DO
- Usare sempre gli helper `logInfo`, `logError`, etc. nei controllers
- Passare requestId ai services per operazioni critiche
- Includere requestId negli errori custom per debugging

### ❌ DON'T
- Non loggare il requestId nei messaggi utente (solo nei log tecnici)
- Non usare il requestId per logica di business
- Non salvare il requestId nel database (è solo per sessione)

## MONITORAGGIO

### Metriche Utili
- Numero di richieste per minuto/ora
- Richieste con stesso requestId (dovrebbe essere sempre 1)
- Richieste senza requestId (dovrebbe essere 0)

### Alert Consigliati
- Log error senza requestId
- Richieste duplicate con stesso requestId
- Response time elevato per specifici requestId

## ROLLBACK (Se Necessario)

Per disabilitare temporaneamente:
1. Commentare `app.use(requestIdMiddleware)` in server.ts
2. Il sistema continuerà a funzionare normalmente
3. I log non avranno più requestId ma tutto il resto funziona

## TROUBLESHOOTING

### Problema: requestId undefined nei log
**Soluzione**: Verificare che il middleware sia prima di tutte le route

### Problema: requestId diversi per stessa richiesta
**Soluzione**: Verificare di non chiamare il middleware più volte

### Problema: Performance degradata
**Soluzione**: UUID generation è veloce, verificare altri middleware

## CONCLUSIONE

Il Request ID Tracking è:
- ✅ **Non invasivo**: Non rompe nulla di esistente
- ✅ **Utile**: Migliora drasticamente il debugging
- ✅ **Standard**: Segue best practices industry
- ✅ **Opzionale**: Può essere disabilitato facilmente
- ✅ **Performante**: Overhead trascurabile

Il sistema è pronto per produzione e migliora la qualità del servizio senza impatti negativi.
