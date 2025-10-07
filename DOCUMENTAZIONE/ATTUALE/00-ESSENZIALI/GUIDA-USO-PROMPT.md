# 🎯 GUIDA USO PROMPT - Piano Implementazione

**Versione**: 1.0  
**Data**: 05 Ottobre 2025

---

## 📋 FORMATO PROMPT STANDARDIZZATO

Ogni step del piano implementazione usa questo formato:

```
┌──────────────── INIZIO PROMPT DA COPIARE ────────────────┐
│                                                           │
│  [TUTTO IL CONTENUTO DEL PROMPT]                         │
│                                                           │
└──────────────── FINE PROMPT DA COPIARE ──────────────────┘
```

---

## ✅ COME USARE I PROMPT

### 1️⃣ Trova lo Step
Apri `PIANO-IMPLEMENTAZIONE-STEP-BY-STEP.md` e cerca lo step che vuoi implementare.

### 2️⃣ Copia il Prompt
Seleziona **TUTTO** il testo tra i delimitatori:
- Da `┌──────────────── INIZIO PROMPT`
- Fino a `└──────────────── FINE PROMPT`

### 3️⃣ Incolla a Claude
Apri una nuova chat con Claude e incolla il prompt copiato.

### 4️⃣ Segui le Istruzioni
Il prompt contiene:
- ✅ Cosa fare
- ✅ Codice da implementare
- ✅ File da creare
- ✅ Test da eseguire

### 5️⃣ Completa la Checklist
Dopo l'implementazione, torna al documento e spunta la checklist dello step.

---

## 📝 ESEMPIO PRATICO

**Step 1: Sistema Recensioni**

1. Apri `PIANO-IMPLEMENTAZIONE-STEP-BY-STEP.md`
2. Vai allo "STEP 1: Sistema Recensioni Base"
3. Copia tutto tra i box delimitatori
4. Incolla in una chat Claude
5. Claude ti guiderà passo-passo
6. Quando finito, spunta la checklist Step 1
7. Crea report in `REPORT-SESSIONI/`

---

## ⚠️ REGOLE IMPORTANTI

### ✅ DA FARE
- Copia TUTTO il contenuto tra i delimitatori
- Leggi ISTRUZIONI-PROGETTO.md prima di iniziare
- Fai backup prima di modificare
- Spunta checklist dopo ogni task
- Crea report sessione alla fine

### ❌ NON FARE
- Non copiare solo una parte del prompt
- Non saltare i backup
- Non ignorare la checklist
- Non dimenticare il report finale

---

## 🔄 DOPO OGNI STEP

1. **Aggiorna Dashboard**
   ```
   FASE 1 - QUICK WINS: 1/8  ✅⬜⬜⬜⬜⬜⬜⬜
   ```

2. **Crea Report**
   File: `DOCUMENTAZIONE/REPORT-SESSIONI/2025-10-[DD]-step-[N]-[nome].md`

3. **Commit Git**
   ```bash
   git add .
   git commit -m "feat: Step N completato - [Titolo]"
   git push origin main
   ```

---

## 💡 TIPS

- **Leggi prima tutto il prompt** per capire lo scope
- **Fai domande a Claude** se qualcosa non è chiaro
- **Testa sempre** prima di considerare completo
- **Documenta** ogni modifica importante
- **Fai commit** piccoli e frequenti

---

## 🆘 PROBLEMI COMUNI

### Prompt troppo lungo?
Se il prompt è molto lungo, Claude potrebbe dividerlo in più parti. Va bene! Segui tutte le parti.

### Codice non funziona?
1. Controlla di aver copiato tutto
2. Verifica i prerequisiti (dipendenze installate?)
3. Chiedi a Claude di debuggare

### Checklist non chiara?
Ogni task della checklist deve essere verificabile. Se hai dubbi, chiedi a Claude conferma.

---

## 📚 RISORSE

- **Piano Completo**: `PIANO-IMPLEMENTAZIONE-STEP-BY-STEP.md`
- **Regole Tecniche**: `ISTRUZIONI-PROGETTO.md`
- **Funzionalità**: `CHECKLIST-FUNZIONALITA-SISTEMA.md`
- **Report**: `DOCUMENTAZIONE/REPORT-SESSIONI/`

---

**Buon lavoro! 🚀**
