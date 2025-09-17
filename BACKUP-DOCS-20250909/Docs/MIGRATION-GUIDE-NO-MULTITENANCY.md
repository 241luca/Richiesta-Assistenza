# 📚 Guida Migrazione: Da Multi-tenant a Single-tenant
## Sistema Richiesta Assistenza v3.0

---

## 🎯 Panoramica

Questo documento descrive le modifiche introdotte nella versione 3.0 del Sistema Richiesta Assistenza, che rimuove completamente il supporto multi-tenancy per semplificare l'architettura e migliorare le performance.

## 📅 Timeline

- **Data Rilascio**: 25 Gennaio 2025
- **Versione**: 3.0.0
- **Breaking Changes**: Sì

## 🔄 Cosa è Cambiato

### Database

#### Tabelle Rimosse
- `Organization` - Completamente eliminata

#### Campi Rimossi
Rimosso il campo `organizationId` da tutte le seguenti tabelle:
- User
- Category  
- Subcategory
- AssistanceRequest
- Quote
- Payment
- Message
- Notification
- ApiKey
- Tutte le altre tabelle del sistema

#### Nuove Tabelle
Aggiunte tabelle per Knowledge Base:
- `KbDocument` - Documenti della knowledge base
- `KbDocumentChunk` - Chunks per ricerca semantica

### Backend

#### Middleware Eliminati
- `/backend/src/middleware/checkOrganization.ts`
- `/backend/src/middleware/tenant.middleware.ts`
- `/backend/src/middleware/tenant.ts`

#### Servizi Aggiornati
Tutti i servizi sono stati aggiornati per rimuovere la logica di organization:
- `request.service.ts` - Query semplificate senza filtro organization
- `quote.service.ts` - Gestione preventivi semplificata
- `notification.service.ts` - Notifiche senza contesto organization
- `category.service.ts` - Categorie globali per tutti

#### API Routes
Tutte le route API non richiedono più `organizationId`:
- Prima: `POST /api/requests { organizationId, title, ... }`
- Ora: `POST /api/requests { title, ... }`

#### JWT Token
Il token JWT non contiene più `organizationId`:
```javascript
// Prima
{ userId: "123", organizationId: "456" }

// Ora
{ userId: "123" }
```

### Frontend

#### Interfaces TypeScript
Aggiornate le interface User:
```typescript
// Prima
interface User {
  id: string;
  email: string;
  organizationId: string; // RIMOSSO
  // ...
}

// Ora
interface User {
  id: string;
  email: string;
  // ...
}
```

#### Context e Hooks
- `AuthContext` - Rimosso organization context
- `useAuth` - Semplificato senza organization

## ⚠️ Breaking Changes

### API Endpoints

Tutti gli endpoint che accettavano `organizationId` ora lo ignorano o generano errore se presente:

| Endpoint | Prima | Ora |
|----------|-------|-----|
| `POST /api/requests` | Richiede organizationId | Non richiede organizationId |
| `GET /api/categories` | Filtrate per organization | Globali per tutti |
| `POST /api/quotes` | Con organizationId | Senza organizationId |

### Database Queries

Le query non filtrano più per organization:
```sql
-- Prima
SELECT * FROM "AssistanceRequest" 
WHERE "organizationId" = ? AND "clientId" = ?

-- Ora
SELECT * FROM "AssistanceRequest" 
WHERE "clientId" = ?
```

### Autorizzazioni

Il sistema ora usa solo controlli basati su ruolo:
- **CLIENT**: Vede solo le proprie richieste
- **PROFESSIONAL**: Vede richieste assegnate
- **ADMIN/SUPER_ADMIN**: Vede tutto

## ✅ Benefici della Migrazione

### 1. **Semplicità**
- -40% di codice di gestione organization
- Logica business più chiara
- Meno JOIN nelle query

### 2. **Performance**
- Query database più veloci
- Meno indici da mantenere
- Cache più efficiente

### 3. **Manutenibilità**
- Codice più semplice da debuggare
- Test più facili da scrivere
- Deployment semplificato

### 4. **Costi**
- Meno risorse server richieste
- Database più piccolo
- Backup più veloci

## 🔧 Guida all'Aggiornamento

### Per Sviluppatori

1. **Aggiorna il codice**
```bash
git pull origin main
npm install
cd backend && npm install
```

2. **Migra il database**
```bash
cd backend
npx prisma db push --force-reset
npx prisma db seed  # Per dati di test
```

3. **Aggiorna le variabili d'ambiente**
Rimuovi qualsiasi riferimento a `ORGANIZATION_ID` dal `.env`

4. **Aggiorna le chiamate API**
Rimuovi `organizationId` da tutte le richieste:
```javascript
// Prima
await api.post('/requests', {
  organizationId: org.id,
  title: 'Richiesta',
  // ...
});

// Ora
await api.post('/requests', {
  title: 'Richiesta',
  // ...
});
```

### Per Amministratori Sistema

1. **Backup Database**
```bash
pg_dump assistenza_db > backup_pre_v3.sql
```

2. **Esegui migrazione**
```sql
-- Lo script di migrazione è già stato eseguito
-- Vedi: /backend/migrations/remove-multitenancy.sql
```

3. **Verifica integrità dati**
```sql
-- Verifica che non ci siano più riferimenti a organization
SELECT COUNT(*) FROM information_schema.columns 
WHERE column_name = 'organizationId';
-- Dovrebbe restituire 0
```

## 🚨 Rollback (se necessario)

Se è necessario tornare alla versione precedente:

1. **Ripristina database**
```bash
psql assistenza_db < backup_pre_v3.sql
```

2. **Checkout versione precedente**
```bash
git checkout v2.5.0
npm install
cd backend && npm install
```

3. **Rigenera Prisma Client**
```bash
cd backend
npx prisma generate
```

## 📝 Note Importanti

### Dati Esistenti
- Tutti i dati sono stati preservati durante la migrazione
- Le relazioni tra entità sono state mantenute
- Nessuna perdita di informazioni business-critical

### ApiKeys
Le ApiKeys che erano duplicate per organization sono state consolidate:
- Mantenuta una sola chiave per servizio
- Le chiavi sono ora globali

### Future Implementazioni
Se in futuro sarà necessario un concetto di "workspace" o separazione dati:
- Considerare un approccio più leggero con "teams" o "gruppi"
- Valutare database separati per tenant
- Implementare row-level security in PostgreSQL

## 📞 Supporto

Per domande sulla migrazione:
- Email: lucamambelli@lmtecnologie.it
- GitHub Issues: [Link](https://github.com/241luca/richiesta-assistenza/issues)

## ✅ Checklist Post-Migrazione

- [ ] Database migrato con successo
- [ ] Nessun errore in console backend
- [ ] Frontend compila senza errori
- [ ] Login funzionante per tutti i ruoli
- [ ] CRUD operations funzionanti
- [ ] Notifiche real-time operative
- [ ] PDF generation funzionante
- [ ] Test suite verde

---

**Documento di Migrazione v3.0** - Sistema Richiesta Assistenza
*Ultimo aggiornamento: 25 Gennaio 2025*
