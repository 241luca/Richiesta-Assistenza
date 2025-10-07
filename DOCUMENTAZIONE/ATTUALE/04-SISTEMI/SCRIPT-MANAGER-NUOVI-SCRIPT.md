# 📋 DOCUMENTAZIONE NUOVI SCRIPT - Script Manager

**Data Creazione**: 11 Settembre 2025  
**Versione**: 1.0.0  
**Autore**: Sistema Richiesta Assistenza

---

## 🆕 NUOVI SCRIPT AGGIUNTI

### 1. TypeScript Errors Check

**ID**: `typescript-errors-check`  
**Categoria**: Testing  
**Percorso**: `/backend/src/scripts/testing/typescript-errors-check.ts`  
**Rischio**: Basso  
**Ruolo Minimo**: ADMIN  

#### 📝 Descrizione
Questo script analizza tutti gli errori TypeScript presenti nel progetto, sia nel backend che nel frontend, e li presenta ordinati dal file con più errori a quello con meno errori.

#### 🎯 Funzionalità
- ✅ Scansiona tutti i file TypeScript del backend (`/backend`)
- ✅ Scansiona tutti i file TypeScript del frontend (`/src`)
- ✅ Raggruppa gli errori per file
- ✅ Ordina i file per numero di errori (decrescente)
- ✅ Mostra dettagli degli errori con numero di riga e messaggio
- ✅ Fornisce un riepilogo totale con statistiche
- ✅ Offre suggerimenti per la correzione

#### ⚙️ Parametri
| Nome | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `area` | select | `all` | Area da controllare: `all`, `backend`, `frontend` |
| `showDetails` | boolean | `true` | Mostra i dettagli degli errori per ogni file |
| `limit` | number | `20` | Numero massimo di file da mostrare per area |

#### 📊 Output Esempio
```
🔧 BACKEND - Top files con errori:
1. /src/services/request.service.ts
   📍 Errori: 15
   • Riga 45:12 - TS2345: Argument of type 'string' is not assignable...
   • Riga 67:8 - TS7006: Parameter 'req' implicitly has an 'any' type...

🎨 FRONTEND - Top files con errori:
1. /src/components/RequestForm.tsx
   📍 Errori: 8
   • Riga 23:15 - TS2339: Property 'data' does not exist on type...

📊 RIEPILOGO TOTALE
🔧 Backend:  43 errori in 12 file
🎨 Frontend: 21 errori in 7 file
📈 Totale:   64 errori in 19 file
```

#### 💡 Utilizzo Consigliato
- Eseguire regolarmente per mantenere il codice pulito
- Iniziare sempre dai file con più errori
- Molti errori sono correlati: risolverne uno può eliminarne altri

---

### 2. Check ResponseFormatter Usage

**ID**: `check-response-formatter`  
**Categoria**: Testing  
**Percorso**: `/backend/src/scripts/testing/check-response-formatter.ts`  
**Rischio**: Basso  
**Ruolo Minimo**: ADMIN  

#### 📝 Descrizione
Verifica che tutte le routes utilizzino correttamente `ResponseFormatter` per le risposte e che i services NON lo utilizzino (pattern architetturale del progetto).

#### 🎯 Funzionalità
- ✅ Scansiona tutti i file `.routes.ts` nel backend
- ✅ Verifica che usino `ResponseFormatter` per tutte le risposte
- ✅ Scansiona tutti i file `.service.ts` nel backend
- ✅ Verifica che NON usino `ResponseFormatter` (devono ritornare solo dati)
- ✅ Identifica violazioni con numero di riga e codice
- ✅ Ordina i file per numero di violazioni
- ✅ Fornisce esempi di correzione

#### ⚙️ Parametri
| Nome | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `showCode` | boolean | `true` | Mostra il codice delle violazioni trovate |
| `checkServices` | boolean | `true` | Controlla anche che i services NON usino ResponseFormatter |

#### 📊 Output Esempio
```
🔴 ROUTES CHE NON USANO RESPONSEFORMATTER:
1. /src/routes/user.routes.ts
   📍 Violazioni: 3
   • Riga 45: ⚠️ Route non usa ResponseFormatter
     res.json({ data: users });
   • Riga 67: ⚠️ Route non usa ResponseFormatter
     res.status(400).json({ error: 'Invalid request' });

🔴 SERVICES CHE USANO RESPONSEFORMATTER (ERRORE):
1. /src/services/auth.service.ts
   📍 Violazioni: 2
   • Riga 23: ❌ Service usa ResponseFormatter (dovrebbe ritornare solo dati)
     return ResponseFormatter.success(user, 'Login successful');

📈 RIEPILOGO
📂 File controllati: 45
   • Route files: 25
   • Service files: 20
⚠️ Violazioni trovate: 5
📁 File con violazioni: 2
```

#### 💡 Come Correggere
**Per le ROUTES**:
```typescript
// ❌ SBAGLIATO
res.json({ data })

// ✅ CORRETTO
res.json(ResponseFormatter.success(data, "Success"))
```

**Per i SERVICES**:
```typescript
// ❌ SBAGLIATO
return ResponseFormatter.success(data)

// ✅ CORRETTO
return data  // Solo i dati, senza formatter
```

---

## 🚀 COME USARE GLI SCRIPT

### Via Script Manager UI

1. **Accedi al pannello admin**: http://localhost:5193/admin
2. **Vai a Script Manager** nel menu laterale (http://localhost:5193/admin/scripts)
3. **Trova lo script** nella categoria "Testing"
4. **Clicca su "Esegui"** (pulsante Play verde)
5. **Configura i parametri** (opzionale)
6. **Clicca "Avvia Script"**
7. **Visualizza l'output** in tempo reale nella console

**Nota**: Se non vedi gli script, ricarica la pagina con F5

### Via Terminale (metodo alternativo)

```bash
# Dalla cartella backend
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Esegui TypeScript Errors Check
npx ts-node src/scripts/testing/typescript-errors-check.ts

# Esegui ResponseFormatter Check
npx ts-node src/scripts/testing/check-response-formatter.ts
```

---

## 📈 BENEFICI

### TypeScript Errors Check
- **Qualità del Codice**: Identifica rapidamente problemi di tipo
- **Prioritizzazione**: Mostra quali file necessitano più attenzione
- **Efficienza**: Risolvi prima i file con più errori per massimo impatto
- **Prevenzione Bug**: Gli errori TypeScript spesso indicano bug potenziali

### ResponseFormatter Check
- **Consistenza**: Garantisce risposte API uniformi
- **Architettura Pulita**: Mantiene separazione tra routes e services
- **Manutenibilità**: Facilita il debugging e la manutenzione
- **Best Practices**: Applica automaticamente i pattern del progetto

---

## 🔧 TROUBLESHOOTING

### Problemi Comuni

#### Lo script non trova errori TypeScript ma so che ci sono
- Verifica che TypeScript sia installato: `npm list typescript`
- Prova a eseguire manualmente: `cd backend && npx tsc --noEmit`
- Controlla il file `tsconfig.json` sia presente

#### ResponseFormatter check non trova alcuni file
- Verifica che i file seguano la naming convention: `.routes.ts` e `.service.ts`
- Controlla che i file siano nella cartella corretta: `/backend/src/routes` o `/backend/src/services`

#### Script timeout
- Aumenta il timeout nel registry.json se necessario
- Per progetti grandi, esegui su aree specifiche (solo backend o frontend)

---

## 🔄 MANUTENZIONE

### Aggiornamenti Consigliati
- **Settimanale**: Eseguire TypeScript check per mantenere codice pulito
- **Prima di ogni release**: Eseguire ResponseFormatter check
- **Dopo refactoring**: Eseguire entrambi gli script

### Estensioni Future
- Aggiungere check per altri pattern (es. error handling)
- Integrare con CI/CD pipeline
- Generare report automatici
- Inviare notifiche su violazioni critiche

---

## 📝 NOTE TECNICHE

### Dipendenze
Entrambi gli script utilizzano solo dipendenze già presenti nel progetto:
- Node.js built-in modules (fs, path, child_process)
- TypeScript compiler (già installato)
- Logger del progetto

### Performance
- **TypeScript Check**: ~30-60 secondi per progetto completo
- **ResponseFormatter Check**: ~5-10 secondi

### Compatibilità
- Node.js 18+
- TypeScript 5.x
- Compatibile con struttura progetto standard

---

**Fine Documentazione**

Per domande o problemi, consultare ISTRUZIONI-PROGETTO.md o contattare il team di sviluppo.