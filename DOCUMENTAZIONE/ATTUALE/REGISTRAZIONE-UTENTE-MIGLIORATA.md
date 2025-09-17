# 📋 PIANO IMPLEMENTAZIONE - Sistema Registrazione Migliorato
**Data**: 11 Settembre 2025  
**Versione**: 1.0  
**Stato**: IN CORSO

---

## 🎯 OBIETTIVO

Migliorare il sistema di registrazione separando completamente il flusso per:
1. **Utenti/Clienti** - Form semplificato
2. **Professionisti** - Form completo con dati aziendali

---

## 📊 ANALISI RICHIESTE

### 🔵 REGISTRAZIONE UTENTE/CLIENTE

#### Dati Personali
- ✅ Nome
- ✅ Cognome  
- ✅ Email
- ✅ Telefono
- ✅ Data di nascita (NUOVO)
- ✅ Codice fiscale (OPZIONALE)

#### Indirizzo
- ✅ Via e numero civico
- ✅ Città
- ✅ CAP
- ✅ Provincia
- 🆕 **Autocompletamento Google Maps**

#### Privacy
- ✅ Check privacy (obbligatorio)
- ✅ Check condizioni utilizzo (obbligatorio)
- ✅ Check privacy marketing (opzionale)

#### Percorso Post-Registrazione
1. Conferma email
2. Accesso immediato area cliente
3. Possibilità di creare richieste

---

### 🟢 REGISTRAZIONE PROFESSIONISTA

#### Dati Personali
- ✅ Nome
- ✅ Cognome
- ✅ Email
- ✅ Telefono  
- ✅ Data di nascita (NUOVO)
- ✅ Codice fiscale (OBBLIGATORIO)
- 🆕 **Competenza principale** (da lista professioni)

#### Dati Aziendali
- 🆕 Ragione sociale
- 🆕 Indirizzo aziendale (con autocompletamento)
- 🆕 Partita IVA (OBBLIGATORIO)
- 🆕 Codice fiscale aziendale
- 🆕 Telefono aziendale
- 🆕 Email aziendale
- 🆕 PEC
- 🆕 Codice SDI

#### Privacy
- ✅ Check privacy (obbligatorio)
- ✅ Check condizioni utilizzo (obbligatorio)
- ✅ Check privacy marketing (opzionale)

#### Percorso Post-Registrazione
1. Conferma email
2. Accesso area professionista
3. Selezione competenze/sottocategorie
4. Richiesta approvazione a SuperAdmin
5. Attesa abilitazione categorie
6. Possibilità richiesta altre competenze

---

## 🔧 MODIFICHE TECNICHE NECESSARIE

### 1. DATABASE (Prisma Schema)

#### Modifiche al modello User
```prisma
model User {
  // Campi esistenti...
  
  // NUOVI CAMPI
  dateOfBirth        DateTime?     // Data di nascita
  privacyAccepted    Boolean       @default(false)
  termsAccepted      Boolean       @default(false)
  marketingAccepted  Boolean       @default(false)
  privacyAcceptedAt  DateTime?
  termsAcceptedAt    DateTime?
  
  // CAMPI PROFESSIONISTA AZIENDALI
  businessName       String?       // Ragione sociale
  businessAddress    String?       // Via aziendale
  businessCity       String?       // Città aziendale
  businessProvince   String?       // Provincia aziendale
  businessPostalCode String?       // CAP aziendale
  businessPhone      String?       // Telefono aziendale
  businessEmail      String?       // Email aziendale
  businessPec        String?       // PEC
  businessSdi        String?       // Codice SDI
  businessCF         String?       // CF aziendale
  
  // STATO APPROVAZIONE
  approvalStatus     String?       @default("PENDING") // PENDING, APPROVED, REJECTED
  approvedAt         DateTime?
  approvedBy         String?
  rejectionReason    String?
}
```

### 2. BACKEND ROUTES

#### Modifiche auth.routes.ts
- Separare schema validazione per CLIENT e PROFESSIONAL
- Aggiungere validazioni specifiche per tipo utente
- Gestire salvataggio dati aziendali

### 3. FRONTEND COMPONENTS

#### Nuovi componenti
1. `RegisterClientPage.tsx` - Form registrazione clienti
2. `RegisterProfessionalPage.tsx` - Form registrazione professionisti
3. `AddressAutocomplete.tsx` - Componente autocompletamento indirizzi
4. `PrivacyCheckboxes.tsx` - Componente checkbox privacy riutilizzabile

### 4. INTEGRAZIONI

#### Google Maps Autocomplete
- Configurare API Google Places
- Implementare componente autocomplete
- Gestire geocoding indirizzi

---

## 📋 CHECKLIST IMPLEMENTAZIONE

### Phase 1: Database
- [ ] Backup schema.prisma
- [ ] Aggiungere nuovi campi al modello User
- [ ] Creare migration
- [ ] Testare migration

### Phase 2: Backend
- [ ] Backup auth.routes.ts
- [ ] Creare schema validazione CLIENT
- [ ] Creare schema validazione PROFESSIONAL
- [ ] Aggiornare endpoint registrazione
- [ ] Aggiungere logica approvazione

### Phase 3: Frontend
- [ ] Backup pagine esistenti
- [ ] Creare RegisterClientPage
- [ ] Creare RegisterProfessionalPage
- [ ] Implementare AddressAutocomplete
- [ ] Aggiungere routing separato
- [ ] Testare form

### Phase 4: Testing
- [ ] Test registrazione cliente
- [ ] Test registrazione professionista
- [ ] Test autocompletamento
- [ ] Test flusso approvazione
- [ ] Test notifiche

### Phase 5: Documentazione
- [ ] Aggiornare API docs
- [ ] Aggiornare user guide
- [ ] Creare report sessione
- [ ] Aggiornare CHANGELOG

---

## 🚨 RISCHI E MITIGAZIONI

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| Breaking changes DB | Media | Alto | Backup completo + test migration |
| Conflitti validazione | Bassa | Medio | Test estensivi form |
| API Google quota | Bassa | Basso | Implementare cache indirizzi |
| Regressioni auth | Media | Alto | Test completi autenticazione |

---

## 📊 STATO AVANZAMENTO

- [x] Analisi requisiti
- [x] Piano implementazione
- [x] Backup sistema
- [ ] Implementazione DB
- [ ] Implementazione Backend
- [ ] Implementazione Frontend
- [ ] Testing
- [ ] Deploy

---

## 📝 NOTE IMPLEMENTAZIONE

### Decisioni Prese
1. Mantenere retrocompatibilità con registrazioni esistenti
2. I campi nuovi sono opzionali per utenti esistenti
3. Validazione progressiva per professionisti

### Da Decidere
1. Limite tentativi registrazione
2. Tempo scadenza link conferma
3. Template email personalizzati per tipo utente

---

## 🔗 RIFERIMENTI

- Schema Prisma: `/backend/prisma/schema.prisma`
- Auth Routes: `/backend/src/routes/auth.routes.ts`
- Register Page: `/src/pages/RegisterPage.tsx`
- Google Maps Docs: https://developers.google.com/maps/documentation/places/web-service

---

**Ultimo aggiornamento**: 11 Settembre 2025 - 18:51
