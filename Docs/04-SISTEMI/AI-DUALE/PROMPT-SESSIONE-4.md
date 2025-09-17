# 🤖 PROMPT PER CLAUDE - SESSIONE 4 SISTEMA AI DUALE

## PROMPT PRINCIPALE (Copia e incolla questo in Claude):

---

Ciao Claude! Devo completare l'implementazione del sistema AI Duale per professionisti nel progetto Richiesta-Assistenza. Il sistema è attualmente all'80% e devo completare la Sessione 4 (ultima sessione).

**PROGETTO**: `/Users/lucamambelli/Desktop/Richiesta-Assistenza`

**PRIMA DI INIZIARE, LEGGI QUESTI FILE NELL'ORDINE**:
1. `/ISTRUZIONI-PROGETTO.md` - Regole tecniche obbligatorie del progetto
2. `/Docs/04-SISTEMI/AI-DUALE/ISTRUZIONI-SESSIONE-4.md` - Istruzioni dettagliate per questa sessione
3. `/Docs/04-SISTEMI/AI-DUALE/AI-DUALE-PROGRESS.md` - Per vedere il lavoro già completato (80%)

**OBIETTIVO SESSIONE**: Completare al 100% il sistema AI Duale con frontend dashboard e integrazione finale

**COSA DEVI FARE** (in ordine di priorità):
1. Completare integrazione in `whatsapp.service.ts` (funzione processIncomingMessage)
2. Creare 5 componenti React per il dashboard amministrativo
3. Creare la pagina principale del dashboard
4. Aggiungere helper service per AI
5. Aggiungere route al dashboard
6. Testare tutto il sistema

**FILE GIÀ ESISTENTI** (creati nella sessione 3, NON ricreare):
- `/backend/src/services/dual-mode-detector.service.ts` - Detection service ✅
- `/backend/src/services/dual-kb.service.ts` - KB duale service ✅
- `/backend/src/services/response-sanitizer.service.ts` - Sanitizer ✅
- `/backend/src/routes/professional-whatsapp.routes.ts` - Routes con 12 endpoints ✅
- `/backend/src/types/professional-whatsapp.types.ts` - TypeScript types ✅

**REGOLE IMPORTANTI**:
- Segui ESATTAMENTE le istruzioni in ISTRUZIONI-SESSIONE-4.md
- USA React Query per TUTTE le API calls (NO fetch diretto)
- USA Tailwind CSS per styling (NO CSS custom)
- USA @heroicons/react per icone (NO altre librerie)
- ResponseFormatter SOLO nelle routes (MAI nei services)
- Il client API ha già `/api` nel baseURL - NON duplicare

**INIZIA CON**:
```bash
# 1. Verifica lo stato attuale (dovrebbe essere 80%)
cat /Users/lucamambelli/Desktop/Richiesta-Assistenza/Docs/04-SISTEMI/AI-DUALE/AI-DUALE-PROGRESS.md | grep "Overall Progress"

# 2. Leggi le istruzioni complete
cat /Users/lucamambelli/Desktop/Richiesta-Assistenza/Docs/04-SISTEMI/AI-DUALE/ISTRUZIONI-SESSIONE-4.md

# 3. Inizia con l'integrazione WhatsApp
# Modifica processIncomingMessage in whatsapp.service.ts
```

Per favore procedi seguendo le istruzioni passo-passo. Alla fine aggiorna il progress tracking al 100%.

---

## 📌 RISPOSTE A POSSIBILI DOMANDE DI CLAUDE:

### Se Claude chiede "Dove inserire il codice nell'integrazione WhatsApp?":
"Dopo il salvataggio del messaggio nel database, circa riga 650 in processIncomingMessage. Il codice esatto è nelle istruzioni ISTRUZIONI-SESSIONE-4.md"

### Se Claude chiede "Quali componenti UI usare?":
"Usa i componenti esistenti in src/components/ui (Card, Button, Switch, Tabs). Sono già configurati con Tailwind."

### Se Claude chiede "Come strutturare i componenti React?":
"Segui la struttura degli altri componenti admin esistenti. Usa sempre React Query per API calls, Tailwind per styling."

### Se Claude ha dubbi su import o path:
"Controlla i file esistenti simili nel progetto per vedere i pattern di import corretti."

---

## 🎯 RISULTATO ATTESO:

Alla fine della sessione 4 dovresti avere:
- ✅ Sistema AI Duale 100% completo e funzionante
- ✅ Dashboard amministrativo per gestione
- ✅ Integrazione completa con WhatsApp
- ✅ Test funzionanti
- ✅ Documentazione aggiornata

---

## 🚨 IMPORTANTE - NON DIMENTICARE:

1. **Backup files** prima di modifiche importanti
2. **Test ogni componente** mentre lo crei
3. **Aggiorna progress** alla fine
4. **Crea report sessione** per documentare il lavoro

---

## 💡 SUGGERIMENTO FINALE:

Se Claude sembra confuso o bloccato, ricordagli di:
1. Leggere prima ISTRUZIONI-SESSIONE-4.md che ha tutto il codice
2. Controllare AI-DUALE-PROGRESS.md per capire cosa è già fatto
3. NON ricreare file già esistenti dalla sessione 3

Buon lavoro! 🚀
