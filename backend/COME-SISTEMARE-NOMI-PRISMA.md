# 🚨 COME SISTEMARE I NOMI PRISMA DEFINITIVAMENTE

## ⚠️ ATTENZIONE: PROCEDURA DELICATA

Questa procedura cambierà i nomi delle relazioni Prisma. Fai un BACKUP completo prima!

## 📝 PASSO 1: Backup Completo

```bash
# 1. Backup del database
pg_dump $DATABASE_URL > backup_database_$(date +%Y%m%d_%H%M%S).sql

# 2. Backup del codice
cp -r backend backend_backup_$(date +%Y%m%d_%H%M%S)

# 3. Commit tutto su Git
git add .
git commit -m "Backup prima di modificare schema Prisma"
git push
```

## 🔧 PASSO 2: Modificare schema.prisma

Nel file `/backend/prisma/schema.prisma`, cambia queste righe:

```prisma
# VECCHIO (righe 58-59 circa)
User_AssistanceRequest_clientIdToUser       User     @relation("AssistanceRequest_clientIdToUser", fields: [clientId], references: [id])
User_AssistanceRequest_professionalIdToUser User?    @relation("AssistanceRequest_professionalIdToUser", fields: [professionalId], references: [id])

# NUOVO - Rinomina in:
client       User     @relation("ClientRequests", fields: [clientId], references: [id])
professional User?    @relation("ProfessionalRequests", fields: [professionalId], references: [id])
```

Poi nel modello User (in fondo al file), cambia:

```prisma
# VECCHIO
AssistanceRequest_AssistanceRequest_clientIdToUser       AssistanceRequest[]  @relation("AssistanceRequest_clientIdToUser")
AssistanceRequest_AssistanceRequest_professionalIdToUser AssistanceRequest[]  @relation("AssistanceRequest_professionalIdToUser")

# NUOVO
clientRequests       AssistanceRequest[]  @relation("ClientRequests")
professionalRequests AssistanceRequest[]  @relation("ProfessionalRequests")
```

## 🚀 PASSO 3: Applicare le Modifiche

```bash
# 1. Genera il nuovo client Prisma
npx prisma generate

# 2. NON fare db push! Cambia solo i nomi nel codice, non nel database
```

## 📝 PASSO 4: Aggiornare TUTTO il Codice

Ora devi cambiare TUTTI i riferimenti nel codice:

### File: `/backend/src/routes/dashboard/user-dashboard.routes.ts`

```typescript
// CERCA E SOSTITUISCI:
User_AssistanceRequest_clientIdToUser → client
User_AssistanceRequest_professionalIdToUser → professional

// Esempio:
// VECCHIO
include: {
  User_AssistanceRequest_clientIdToUser: {
    select: { firstName: true, lastName: true }
  }
}

// NUOVO
include: {
  client: {
    select: { firstName: true, lastName: true }
  }
}
```

## ⚠️ OPPURE: Lasciare Tutto Com'è (Opzione Più Sicura)

Se ti sembra troppo complicato, **puoi lasciare tutto com'è**! 

Il sistema funziona già perfettamente con i nomi lunghi. L'importante è:

1. **Sapere** che i nomi sono lunghi
2. **Usare sempre** i nomi corretti nel codice
3. **Consultare** il file MAPPA-RELAZIONI-PRISMA.md quando hai dubbi

## 💡 Consiglio Finale

**Per ora, lascia tutto com'è!** Il sistema funziona. 

Quando avrai più esperienza con Prisma, potrai:
1. Creare un nuovo progetto con nomi migliori dall'inizio
2. Fare un refactoring completo con calma

Ricorda: **"Se funziona, non toccarlo!"** 😊
