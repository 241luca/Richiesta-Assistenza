# 📋 IMPLEMENTAZIONE SISTEMA INTERVENTI MULTIPLI CON CONFERMA

**Data**: 2025-01-07  
**Stato**: 🚧 IN CORSO

## ✅ **FASE 1: DATABASE** (Completata)

### Schema Creato:
```sql
scheduled_interventions
├── id
├── requestId (richiesta collegata)
├── professionalId (chi propone)
├── proposedDate (data/ora proposta)
├── confirmedDate (data finale confermata)
├── status (PROPOSED, ACCEPTED, REJECTED, COMPLETED, CANCELLED)
├── interventionNumber (1°, 2°, 3°...)
├── description (cosa si farà)
├── estimatedDuration (minuti previsti)
├── acceptedBy (chi ha confermato)
├── acceptedAt (quando confermato)
├── reportId (rapporto quando completato)
```

### Relazioni:
- Ogni richiesta → N interventi programmati
- Ogni intervento → 1 rapporto (quando completato)
- Tracking completo conferme cliente

## 🔄 **FASE 2: BACKEND API** (Da fare)

### Endpoints necessari:
```
POST   /api/scheduled-interventions          (proponi intervento/i)
GET    /api/scheduled-interventions/:requestId (lista per richiesta)
PUT    /api/scheduled-interventions/:id/accept (cliente accetta)
PUT    /api/scheduled-interventions/:id/reject (cliente rifiuta)
DELETE /api/scheduled-interventions/:id     (cancella proposta)
```

## 🎨 **FASE 3: FRONTEND** (Da fare)

### Per Professionista:
1. Form "Proponi Interventi" nel dettaglio richiesta
2. Possibilità di proporre N interventi insieme
3. Vista stato conferme

### Per Cliente:
1. Notifica nuove proposte
2. Pulsanti [Accetta] [Discuti in Chat]
3. Vista calendario interventi confermati

### Chat Integration:
- Messaggi automatici quando si propongono date
- Link rapidi per confermare dalla chat

## 📊 **STATO ATTUALE**

✅ Tabella database creata
✅ Schema Prisma aggiornato
⏳ API backend da implementare
⏳ UI frontend da creare
⏳ Integrazione chat
⏳ Sistema notifiche

---

**Prossimi passi:**
1. Creare API routes
2. Implementare UI professionista
3. Implementare UI cliente
4. Test end-to-end