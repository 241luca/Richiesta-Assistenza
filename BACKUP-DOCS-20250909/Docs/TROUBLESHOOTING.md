# TROUBLESHOOTING - Sistema Richiesta Assistenza

## Sistema Notifiche

### Problema: Template non visibili nella dashboard
**Sintomi:** La dashboard mostra "Nessun template trovato" ma ci sono template nel database

**Causa:** Bug nel filtro isActive quando il parametro non viene passato

**Soluzione:**
1. Verificare che nel file `backend/src/routes/notificationTemplate.routes.ts` ci sia:
```typescript
isActive: req.query.isActive ? req.query.isActive === 'true' : undefined
```

2. Riavviare il backend dopo la modifica

3. Verificare nel database:
```bash
cd backend
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.notificationTemplate.count().then(c => console.log('Template nel DB:', c))"
```

### Problema: Campanella notifiche non funziona
**Sintomi:** Cliccando sulla campanella non si apre il dropdown

**Soluzione:**
1. Verificare che in `src/components/layout/Layout.tsx` ci sia:
```typescript
import { NotificationCenter } from '../notifications/NotificationCenter';
```

2. E nel JSX:
```jsx
<NotificationCenter />
```

### Problema: Errore "recipientId" nelle notifiche
**Sintomi:** Errore Prisma "Unknown argument userId"

**Soluzione:**
Nel file `backend/src/services/notification.service.ts` cambiare:
```typescript
// Da
where: { userId, isRead: false }
// A
where: { recipientId: userId, isRead: false }
```

## Database

### Come verificare i template nel database
```bash
# Conta template
cd backend
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.notificationTemplate.count().then(c => {console.log('Template:', c); process.exit()})"

# Mostra prime 3 categorie
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.notificationTemplate.findMany({take:3}).then(t => {t.forEach(x => console.log(x.category, x.code)); process.exit()})"
```

### Come ricaricare i template di default
```bash
cd backend
npx ts-node src/scripts/seed-all-notification-templates.ts
```

## Riavvio Servizi

### Backend
```bash
# Fermare con Ctrl+C nel terminale dove gira
# Riavviare con
cd backend
npm run dev
```

### Frontend
```bash
# Fermare con Ctrl+C
# Riavviare con
npm run dev
```

---
Ultimo aggiornamento: 31/08/2025

