# 🔧 FIX RELAZIONI PRISMA - PIANO DI SISTEMAZIONE
**Data**: 8 Settembre 2025
**Problema**: Relazioni senza @relation esplicito che causano nomi auto-generati

## ⚠️ PRIMA DI INIZIARE
```bash
# Backup già fatto:
# backend/prisma/schema.backup-[timestamp].prisma
```

## 📋 MODIFICHE DA FARE

### 1️⃣ MODELLO: AssistanceRequest

**SITUAZIONE ATTUALE:**
```prisma
User_AssistanceRequest_assignedByToUser     User?    @relation("AssistanceRequest_assignedByToUser", fields: [assignedBy], references: [id])
User_AssistanceRequest_clientIdToUser       User     @relation("AssistanceRequest_clientIdToUser", fields: [clientId], references: [id])
User_AssistanceRequest_professionalIdToUser User?    @relation("AssistanceRequest_professionalIdToUser", fields: [professionalId], references: [id])
```

**DA CAMBIARE IN:**
```prisma
assignedByUser  User?  @relation("RequestAssignedBy", fields: [assignedBy], references: [id])
client          User   @relation("ClientRequests", fields: [clientId], references: [id])
professional    User?  @relation("ProfessionalRequests", fields: [professionalId], references: [id])
```

---

### 2️⃣ MODELLO: InterventionReport

**SITUAZIONE ATTUALE:**
```prisma
User_InterventionReport_clientIdToUser       User  @relation("InterventionReport_clientIdToUser", fields: [clientId], references: [id])
User_InterventionReport_professionalIdToUser User  @relation("InterventionReport_professionalIdToUser", fields: [professionalId], references: [id])
```

**DA CAMBIARE IN:**
```prisma
client       User  @relation("ClientReports", fields: [clientId], references: [id])
professional User  @relation("ProfessionalReports", fields: [professionalId], references: [id])
```

---

### 3️⃣ MODELLO: InterventionReportTemplate

**SITUAZIONE ATTUALE:**
```prisma
User_InterventionReportTemplate_approvedByToUser User? @relation("InterventionReportTemplate_approvedByToUser", fields: [approvedBy], references: [id])
User_InterventionReportTemplate_createdByToUser  User? @relation("InterventionReportTemplate_createdByToUser", fields: [createdBy], references: [id])
```

**DA CAMBIARE IN:**
```prisma
approvedByUser User? @relation("TemplatesApproved", fields: [approvedBy], references: [id])
createdByUser  User? @relation("TemplatesCreated", fields: [createdBy], references: [id])
```

---

### 4️⃣ MODELLO: Message

**SITUAZIONE ATTUALE:**
```prisma
User_Message_recipientIdToUser User @relation("Message_recipientIdToUser", fields: [recipientId], references: [id])
User_Message_senderIdToUser    User @relation("Message_senderIdToUser", fields: [senderId], references: [id])
```

**DA CAMBIARE IN:**
```prisma
recipient User @relation("MessagesReceived", fields: [recipientId], references: [id])
sender    User @relation("MessagesSent", fields: [senderId], references: [id])
```

---

### 5️⃣ MODELLO: Notification

**SITUAZIONE ATTUALE:**
```prisma
User_Notification_recipientIdToUser User  @relation("Notification_recipientIdToUser", fields: [recipientId], references: [id])
User_Notification_senderIdToUser    User? @relation("Notification_senderIdToUser", fields: [senderId], references: [id])
```

**DA CAMBIARE IN:**
```prisma
recipient User  @relation("NotificationsReceived", fields: [recipientId], references: [id])
sender    User? @relation("NotificationsSent", fields: [senderId], references: [id])
```

---

### 6️⃣ MODELLO: ScheduledIntervention

**SITUAZIONE ATTUALE:**
```prisma
User_ScheduledIntervention_createdByToUser      User? @relation("ScheduledIntervention_createdByToUser", fields: [createdBy], references: [id])
User_ScheduledIntervention_professionalIdToUser User  @relation("ScheduledIntervention_professionalIdToUser", fields: [professionalId], references: [id])
```

**DA CAMBIARE IN:**
```prisma
createdByUser User? @relation("InterventionsCreated", fields: [createdBy], references: [id])
professional  User  @relation("ProfessionalInterventions", fields: [professionalId], references: [id])
```

---

### 7️⃣ MODELLO: User (LATO OPPOSTO DELLE RELAZIONI)

**SITUAZIONE ATTUALE (estratto):**
```prisma
AssistanceRequest_AssistanceRequest_assignedByToUser                   AssistanceRequest[]  @relation("AssistanceRequest_assignedByToUser")
AssistanceRequest_AssistanceRequest_clientIdToUser                     AssistanceRequest[]  @relation("AssistanceRequest_clientIdToUser")
AssistanceRequest_AssistanceRequest_professionalIdToUser               AssistanceRequest[]  @relation("AssistanceRequest_professionalIdToUser")
// ... e molte altre con nomi brutti
```

**DA CAMBIARE IN:**
```prisma
// AssistanceRequest relations
assignedRequests      AssistanceRequest[]  @relation("RequestAssignedBy")
clientRequests        AssistanceRequest[]  @relation("ClientRequests")
professionalRequests  AssistanceRequest[]  @relation("ProfessionalRequests")

// InterventionReport relations
clientReports         InterventionReport[] @relation("ClientReports")
professionalReports   InterventionReport[] @relation("ProfessionalReports")

// InterventionReportTemplate relations
approvedTemplates     InterventionReportTemplate[] @relation("TemplatesApproved")
createdTemplates      InterventionReportTemplate[] @relation("TemplatesCreated")

// Message relations
messagesReceived      Message[] @relation("MessagesReceived")
messagesSent          Message[] @relation("MessagesSent")

// Notification relations
notificationsReceived Notification[] @relation("NotificationsReceived")
notificationsSent     Notification[] @relation("NotificationsSent")

// ScheduledIntervention relations
interventionsCreated       ScheduledIntervention[] @relation("InterventionsCreated")
professionalInterventions  ScheduledIntervention[] @relation("ProfessionalInterventions")
```

---

## 🚀 PROCEDURA DI APPLICAZIONE

### STEP 1: Backup (già fatto)
```bash
cp backend/prisma/schema.prisma backend/prisma/schema.backup-$(date +%Y%m%d-%H%M%S).prisma
```

### STEP 2: Modificare lo schema
Applicare tutte le modifiche sopra elencate nel file `schema.prisma`

### STEP 3: Validare lo schema
```bash
cd backend
npx prisma validate
```

### STEP 4: Generare il client Prisma
```bash
npx prisma generate
```

### STEP 5: Verificare TypeScript
```bash
npx tsc --noEmit
```

### STEP 6: Aggiornare il codice
Dopo la generazione, dovrai aggiornare il codice TypeScript che usa le vecchie relazioni:

**Esempi di modifiche nel codice:**

```typescript
// PRIMA:
const request = await prisma.assistanceRequest.findUnique({
  include: {
    User_AssistanceRequest_clientIdToUser: true,
    User_AssistanceRequest_professionalIdToUser: true
  }
});

// DOPO:
const request = await prisma.assistanceRequest.findUnique({
  include: {
    client: true,
    professional: true
  }
});
```

### STEP 7: Test completo
```bash
npm test
./scripts/test-finale.sh
```

---

## ⚠️ ATTENZIONE IMPORTANTE

1. **NON fare push del database** fino a quando tutto il codice non è aggiornato
2. **Controllare TUTTI i file** che fanno query Prisma:
   - `/backend/src/services/*.ts`
   - `/backend/src/routes/*.ts`
   - Qualsiasi altro file che usa Prisma

3. **Cercare nel codice** i vecchi nomi:
```bash
# Cerca i vecchi nomi brutti
grep -r "User_AssistanceRequest" backend/src/
grep -r "User_InterventionReport" backend/src/
grep -r "User_Message" backend/src/
grep -r "User_Notification" backend/src/
grep -r "User_ScheduledIntervention" backend/src/
```

---

## 📊 RIEPILOGO FINALE

- **Totale relazioni da sistemare**: ~15
- **Modelli interessati**: 7
- **Impatto principale**: Modello User (38 relazioni totali)
- **Benefici**: 
  - Nomi più leggibili e mantenibili
  - Nessun problema di rigenerazione
  - Codice più pulito

---

## 📝 NOTE

Dopo aver applicato tutte queste modifiche:
1. Lo schema sarà molto più pulito
2. I nomi delle relazioni saranno stabili
3. Non ci saranno più problemi di rigenerazione
4. Il codice sarà più leggibile

**File creato da**: Claude Assistant
**Data**: 8 Settembre 2025
