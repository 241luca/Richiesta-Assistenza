# 🤖 PROMPT PER NUOVA SESSIONE CLAUDE - SISTEMA AI DUALE

## PROMPT DA COPIARE E INCOLLARE:

---

Ciao Claude! Devo continuare l'implementazione del sistema AI Duale per professionisti nel progetto Richiesta-Assistenza. Il sistema è attualmente completato al 60% e devo completare la Sessione 3.

**PROGETTO**: `/Users/lucamambelli/Desktop/Richiesta-Assistenza`

**PRIMA DI INIZIARE, LEGGI QUESTI FILE NELL'ORDINE**:
1. `/ISTRUZIONI-PROGETTO.md` - Regole tecniche obbligatorie del progetto
2. `/Docs/04-SISTEMI/AI-DUALE/ISTRUZIONI-SESSIONE-3.md` - Istruzioni dettagliate per questa sessione
3. `/Docs/04-SISTEMI/AI-DUALE/AI-DUALE-PROGRESS.md` - Per vedere cosa è già stato fatto

**OBIETTIVO SESSIONE**: Completare l'implementazione del sistema AI Duale seguendo le istruzioni nel file ISTRUZIONI-SESSIONE-3.md

**COSA DEVI FARE**:
1. Creare il Dual KB Service (`dual-kb.service.ts`)
2. Creare il Response Sanitizer Service (`response-sanitizer.service.ts`) 
3. Aggiungere 4 nuovi API endpoints per gestione KB duale
4. Integrare tutto con il WhatsApp service esistente
5. Implementare test base
6. Aggiornare il progress tracking al termine

**FILE GIÀ ESISTENTI DA NON MODIFICARE** (solo consultare):
- `/backend/src/services/dual-mode-detector.service.ts` - Detection service già completo
- `/backend/src/types/professional-whatsapp.types.ts` - TypeScript types già definiti
- `/backend/prisma/schema.prisma` - Schema database già integrato

**REGOLE IMPORTANTI**:
- Segui ESATTAMENTE le istruzioni in ISTRUZIONI-SESSIONE-3.md
- USA sempre ResponseFormatter nelle routes (MAI nei services)
- Il client API ha già `/api` nel baseURL - NON duplicare
- Fai BACKUP prima di modificare file esistenti
- La modalità CLIENT è il default per sicurezza

**INIZIA CON**:
```bash
# 1. Verifica lo stato attuale
cat /Users/lucamambelli/Desktop/Richiesta-Assistenza/Docs/04-SISTEMI/AI-DUALE/ISTRUZIONI-SESSIONE-3.md

# 2. Controlla il progress
cat /Users/lucamambelli/Desktop/Richiesta-Assistenza/Docs/04-SISTEMI/AI-DUALE/AI-DUALE-PROGRESS.md | grep "Overall Progress"

# 3. Inizia creando il Dual KB Service come descritto nelle istruzioni
```

Per favore, procedi seguendo le istruzioni passo-passo e aggiorna il progress tracking man mano che completi ogni componente.

---

## 📌 NOTE AGGIUNTIVE PER CHI USA IL PROMPT:

### Se Claude chiede chiarimenti, rispondi:
- "Segui le istruzioni nel file ISTRUZIONI-SESSIONE-3.md"
- "Il sistema deve avere 2 AI separate: una tecnica per professionisti, una semplificata per clienti"
- "La detection è già fatta, devi solo completare KB service e sanitizer"

### Verifica finale:
Alla fine della sessione dovresti avere:
- ✅ 2 nuovi service files creati
- ✅ 4 nuovi endpoints aggiunti
- ✅ Integrazione con WhatsApp service
- ✅ Progress aggiornato a ~80%

### Se ci sono errori:
1. Controlla di aver letto ISTRUZIONI-PROGETTO.md
2. Verifica che i path siano corretti
3. Assicurati di usare i TypeScript types già definiti
4. NON modificare la logica di detection esistente

---

## 🔄 PROMPT ALTERNATIVO (PIÙ SEMPLICE):

Se il prompt sopra è troppo lungo, usa questo:

---

Continua l'implementazione del sistema AI Duale nel progetto Richiesta-Assistenza seguendo le istruzioni dettagliate nel file:

`/Users/lucamambelli/Desktop/Richiesta-Assistenza/Docs/04-SISTEMI/AI-DUALE/ISTRUZIONI-SESSIONE-3.md`

Il sistema è al 60% e devi completare:
1. Dual KB Service
2. Response Sanitizer 
3. 4 nuovi API endpoints
4. Integrazione con WhatsApp

Inizia leggendo il file delle istruzioni che contiene tutto il codice da implementare.

---