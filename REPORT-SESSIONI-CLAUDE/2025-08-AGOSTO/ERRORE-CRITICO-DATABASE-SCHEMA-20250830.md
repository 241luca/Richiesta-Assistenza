# 🔥 REPORT ERRORE CRITICO: DATABASE NON SINCRONIZZATO

**Data**: 30 Agosto 2025  
**Errore**: `Unknown argument 'useResidenceAsWorkAddress'`  
**Causa**: Database non aggiornato con schema Prisma  
**Status**: 🚨 **CRITICO - RICHIEDE AZIONE IMMEDIATA**

---

## 🚨 ERRORE IDENTIFICATO

### **Errore Prisma:**
```
Unknown argument `useResidenceAsWorkAddress`. Available options are marked with ?.
```

### **Causa Root:**
I **campi viaggi esistono nel `schema.prisma`** ma **NON nel database PostgreSQL reale!**

Il database è **out-of-sync** con lo schema del codice.

---

## 🔍 ANALISI PROBLEMA

### ✅ **Schema Prisma (CORRETTO):**
I campi sono presenti in `backend/prisma/schema.prisma`:
```prisma
model User {
  // ... altri campi
  workAddress                    String?
  workCity                       String?
  workProvince                   String?
  workPostalCode                 String?
  workLatitude                   Float?
  workLongitude                  Float?
  useResidenceAsWorkAddress      Boolean  @default(false)
  travelRatePerKm                Decimal? @db.Decimal(10, 2)
  // ... altri campi
}
```

### ❌ **Database PostgreSQL (MANCANTE):**
Il database reale **NON ha questi campi** nella tabella `User`.

### 🎯 **Questo Spiega TUTTI i Problemi:**

1. **Radio Button**: ✅ Funzionavano (frontend OK)
2. **Toast Success**: ✅ Appariva (backend prova a salvare)
3. **Dati Non Persistenti**: ❌ Database rifiuta l'update (campi inesistenti)
4. **Itinerario GPS**: ❌ Usa posizione corrente (coordinate professionista mai salvate)

---

## ✅ SOLUZIONE OBBLIGATORIA

### **COMANDO DA ESEGUIRE:**

```bash
cd /Users/lucamambelli/Desktop/richiesta-assistenza/backend
npx prisma db push
```

### **Cosa Fa `npx prisma db push`:**
- ✅ Legge `schema.prisma`
- ✅ Confronta con database attuale
- ✅ Aggiunge i campi mancanti alla tabella `User`
- ✅ Sincronizza database con schema

### **Output Atteso:**
```
✔ Generated Prisma Client (v6.14.0) in 234ms

The following changes have been detected:
• Added columns to table "User":
  - workAddress (String?)
  - workCity (String?)
  - workProvince (String?)
  - workPostalCode (String?)
  - workLatitude (Float?)
  - workLongitude (Float?)
  - useResidenceAsWorkAddress (Boolean, default: false)
  - travelRatePerKm (Decimal?)

✔ Database schema updated successfully.
```

---

## 🎉 RISULTATO ATTESO POST-FIX

### **Dopo `npx prisma db push`:**

1. **✅ Salvataggio Indirizzi**
   - I campi viaggi esistono nel database
   - Il salvataggio sarà persistente
   - Non più errori Prisma

2. **✅ Itinerario Corretto**
   - Le coordinate professionista verranno salvate
   - L'itinerario userà coordinate reali
   - Non più "La tua posizione"

3. **✅ Calcolo Distanze**
   - Distanze calcolate da indirizzo lavoro
   - Tempi di viaggio realistici
   - Costi trasferta accurati

### **Flow Corretto Post-Fix:**
```
Frontend: Salva indirizzo lavoro
    ↓
Backend: prisma.user.update() 
    ↓  
Database: ✅ Campi esistono → Salvataggio OK
    ↓
Itinerario: Coordinate trovate → Google Maps corretto
```

---

## 🚨 PRIORITÀ MASSIMA

**QUESTO È IL PROBLEMA ROOT di TUTTI i problemi viaggi!**

Una volta eseguito `npx prisma db push`:
- ✅ Radio button: Già funzionanti
- ✅ Salvataggio: Diventerà persistente  
- ✅ Itinerario: Userà coordinate corrette
- ✅ Distanze: Calcolate correttamente

**Non servono altre modifiche al codice - il codice è corretto!**

---

## 📋 CHECKLIST POST-FIX

Dopo `npx prisma db push`:

1. **✅ Verifica Database**
   ```sql
   \d "User"  -- PostgreSQL: mostra struttura tabella
   ```
   Deve mostrare i campi `workAddress`, `useResidenceAsWorkAddress`, etc.

2. **✅ Test Salvataggio**
   - Vai a Profilo → Viaggi
   - Configura indirizzo lavoro
   - Salva → Dovrebbe persistere

3. **✅ Test Itinerario**
   - Vai a richiesta assistenza
   - Clicca "Visualizza Itinerario"
   - Dovrebbe usare indirizzo lavoro, NON GPS

4. **✅ Check Log Backend**
   ```
   Professional abc123 using cached work coordinates: LAT, LNG
   Generated itinerary URL: https://maps.google.com/dir/...
   ```

---

## 🔧 SE `npx prisma db push` FALLISCE

### **Possibili Errori:**

1. **Database Connection**
   ```
   Error: Can't reach database server
   ```
   **Fix**: Verifica che PostgreSQL sia avviato

2. **Permission Issues**
   ```
   Error: permission denied
   ```
   **Fix**: Controlla credenziali DATABASE_URL

3. **Conflicting Data**
   ```
   Error: Migration conflicts
   ```
   **Fix**: Usa `npx prisma db push --force-reset` (⚠️ cancella dati)

---

## 📁 NESSUN FILE DA MODIFICARE

**Il codice è già corretto!** Il problema è solo database out-of-sync.

### **Files Già Corretti:**
- ✅ `backend/prisma/schema.prisma` - Schema con campi viaggi
- ✅ `backend/src/services/travel.service.ts` - Logica corretta  
- ✅ `backend/src/routes/travel.routes.ts` - API corrette
- ✅ `src/components/travel/WorkAddressSettings.tsx` - Frontend corretto

---

**AZIONE RICHIESTA**: Esegui `npx prisma db push` IMMEDIATAMENTE! 🚨

Tutti i problemi viaggi si risolveranno automaticamente.
