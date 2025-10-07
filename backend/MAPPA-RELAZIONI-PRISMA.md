# 📚 MAPPA RELAZIONI PRISMA

## ⚠️ IMPORTANTE: Nomi delle Relazioni nel Codice

Quando lavori con le query Prisma, usa QUESTI nomi:

### AssistanceRequest (Richieste)
- `User_AssistanceRequest_clientIdToUser` → il cliente
- `User_AssistanceRequest_professionalIdToUser` → il professionista  
- `Category` → la categoria (C maiuscola!)
- `Quote` → i preventivi

### Quote (Preventivi)
- `User` → il professionista che ha fatto il preventivo
- `AssistanceRequest` → la richiesta associata

### User (Utenti)
- `AssistanceRequest_AssistanceRequest_clientIdToUser` → richieste come cliente
- `AssistanceRequest_AssistanceRequest_professionalIdToUser` → richieste come professionista
- `Quote` → preventivi creati

## 💡 Esempi di Query Corrette

```typescript
// ✅ CORRETTO - Prendere una richiesta con il cliente
const request = await prisma.assistanceRequest.findFirst({
  include: {
    User_AssistanceRequest_clientIdToUser: true,  // NON "client"
    User_AssistanceRequest_professionalIdToUser: true,  // NON "professional"
    Category: true  // NON "category" (c minuscola)
  }
});

// ✅ CORRETTO - Prendere un preventivo
const quote = await prisma.quote.findFirst({
  include: {
    User: true,  // Il professionista
    AssistanceRequest: true  // NON "request"
  }
});
```

## 🔧 Come Controllare i Nomi

1. Apri il file `schema.prisma`
2. Cerca il modello che ti interessa
3. Guarda i nomi ESATTI delle relazioni
4. Usa quegli stessi nomi nel codice

## 🚨 Errori Comuni

❌ `request.client` → Non esiste!
✅ `request.User_AssistanceRequest_clientIdToUser` → Corretto!

❌ `quote.request` → Non esiste!
✅ `quote.AssistanceRequest` → Corretto!
