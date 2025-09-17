# 📋 PIANO COMPLETO INSERIMENTO RESPONSE FORMATTER

## 🎯 OBIETTIVO
Inserire il ResponseFormatter in TUTTE le routes, services e controller del progetto per garantire:
- Risposte sempre consistenti tra backend e frontend
- Formattazione corretta di date, prezzi e enum
- Gestione corretta delle relazioni Prisma

## 📁 ANALISI SITUAZIONE ATTUALE

### ✅ Services che GIÀ usano ResponseFormatter:
- `category.service.ts` - ✅ Usa formatCategory e formatCategoryList
- `subcategory.service.ts` - ✅ Usa formatSubcategory e formatSubcategoryList

### ❌ Services che NON usano ResponseFormatter:
- `quote.service.ts` - ❌ Non usa formatQuote
- `request.service.ts` - ❌ Non usa formatAssistanceRequest  
- `apiKey.service.ts` - ❌ Non formatta le risposte
- `notification.service.ts` - ❌ Non usa formatNotification
- `email.service.ts` - ✅ Probabilmente OK (service interno)
- `file.service.ts` - ❌ Non usa formatAttachment
- `geocoding.service.ts` - ✅ Probabilmente OK (service interno)
- `pdf.service.ts` - ✅ Probabilmente OK (service interno)
- `websocket.service.ts` - ❌ Potrebbe beneficiare dei formatter

### 📋 Routes da verificare:
- `auth.routes.ts` - Da verificare se usa formatUser
- `quote.routes.ts` - Da verificare se usa formatQuote
- `request.routes.ts` - Da verificare se usa formatAssistanceRequest
- `user.routes.ts` - Da verificare se usa formatUser
- `admin.routes.ts` - Da verificare se usa i formatter appropriati
- `notification.routes.ts` - Da verificare se usa formatNotification
- `attachment.routes.ts` - Da verificare se usa formatAttachment

### 🎮 Controller da verificare:
- `testController.ts` - Da verificare

## 🔧 PIANO DI LAVORO

### FASE 1: Services Priority (ALTA)
1. **quote.service.ts** - CRITICO per preventivi
2. **request.service.ts** - CRITICO per richieste assistenza
3. **notification.service.ts** - IMPORTANTE per notifiche
4. **file.service.ts** - IMPORTANTE per allegati

### FASE 2: Routes Priority (ALTA)
1. **quote.routes.ts** - CRITICO
2. **request.routes.ts** - CRITICO  
3. **auth.routes.ts** - CRITICO per login/registrazione
4. **user.routes.ts** - IMPORTANTE

### FASE 3: Altri file (MEDIA)
1. **admin.routes.ts**
2. **notification.routes.ts**
3. **attachment.routes.ts**
4. **websocket.service.ts**
5. **testController.ts**

## 📝 TEMPLATE DI IMPLEMENTAZIONE

### Per Services:
```typescript
// All'inizio del file
import { 
  formatQuote, 
  formatQuoteList,
  formatAssistanceRequest 
} from '../utils/responseFormatter';

// In ogni metodo che restituisce dati
async getQuote(id: string) {
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { /* relazioni */ }
  });
  
  if (!quote) return null;
  
  // USA SEMPRE IL FORMATTER!
  return formatQuote(quote);
}
```

### Per Routes:
```typescript
// All'inizio del file
import { 
  formatQuote, 
  formatQuoteList 
} from '../utils/responseFormatter';

// In ogni endpoint
app.get('/quotes/:id', async (req, res) => {
  try {
    const quote = await quoteService.getQuote(req.params.id);
    
    if (!quote) {
      return res.status(404).json({ 
        success: false, 
        message: 'Quote not found' 
      });
    }
    
    // Se il service già formatta, non riformattare
    // Se il service NON formatta, formattare qui
    res.json({
      success: true,
      data: quote // Già formattato dal service
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});
```

## ⚠️ REGOLE IMPORTANTI

1. **NON DOPPIA FORMATTAZIONE**: Se il service già formatta, la route NON deve riformattare
2. **CONSISTENZA**: Usare sempre gli stessi formatter per la stessa entità
3. **INCLUDE CORRETTI**: Assicurarsi che i query Prisma includano tutte le relazioni necessarie
4. **GESTIONE ERRORI**: Mantenere la gestione errori esistente
5. **BACKUP**: Fatto backup di tutto prima di iniziare

## 📋 CHECKLIST COMPLETAMENTO

### Services
- [ ] quote.service.ts - Inserito formatQuote/formatQuoteList
- [ ] request.service.ts - Inserito formatAssistanceRequest/formatAssistanceRequestList  
- [ ] notification.service.ts - Inserito formatNotification/formatNotificationList
- [ ] file.service.ts - Inserito formatAttachment/formatAttachmentList
- [ ] websocket.service.ts - Verificato e aggiornato se necessario

### Routes  
- [ ] quote.routes.ts - Verificato uso corretto formatter
- [ ] request.routes.ts - Verificato uso corretto formatter
- [ ] auth.routes.ts - Inserito formatUser dove necessario
- [ ] user.routes.ts - Verificato uso formatUser
- [ ] admin.routes.ts - Inseriti formatter appropriati
- [ ] notification.routes.ts - Inserito formatNotification
- [ ] attachment.routes.ts - Inserito formatAttachment

### Controller
- [ ] testController.ts - Verificato e aggiornato

### Test
- [ ] Testato funzionamento generale
- [ ] Verificato che le risposte siano consistenti
- [ ] Controllato che non ci siano errori di compilazione

## 🚨 ATTENZIONE
Durante l'implementazione, verificare sempre:
1. Che i nomi delle relazioni Prisma siano corretti
2. Che non si rompa la compatibilità con il frontend esistente  
3. Che gli enum siano nella forma corretta (UPPERCASE per Quote status, lowercase per Request status)
4. Che i prezzi restino in centesimi come atteso dal frontend
