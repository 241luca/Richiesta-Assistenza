# 📊 Pagina Test Sistema - Guida per l'Amministratore

## Cosa è la Pagina Test Sistema?

La **Pagina Test Sistema** è uno strumento potente che ti permette di verificare che tutto il sistema funzioni correttamente. È come fare un "check-up completo" del software per assicurarsi che ogni parte funzioni bene.

## Chi può accedervi?

Solo il **SUPER ADMIN** può accedere a questa pagina per motivi di sicurezza.

## Come accedere

1. **Fai il login** come Super Admin
2. Nel **menu laterale** a sinistra, cerca la sezione "Amministrazione"
3. Clicca su **"Test Sistema"** (icona provetta 🧪)

## Cosa vedi nella pagina

### 1. **Header con pulsante principale**
- **Titolo**: "Test Sistema"
- **Pulsante "Esegui Test"**: Il pulsante principale per avviare i test
- **Ultimo test**: Mostra quando sono stati eseguiti i test l'ultima volta

### 2. **Statistiche in alto** (5 card colorate)
- **Test Totali**: Numero totale di test disponibili
- **Passati** (verde): Test che funzionano correttamente
- **Falliti** (rosso): Test che hanno trovato problemi
- **Success Rate**: Percentuale di successo (idealmente 100%)
- **Durata**: Quanto tempo ci hanno messo i test

### 3. **Tabs per categorie di test**
- **Tutti i Test**: Mostra tutti i test insieme
- **Test Autenticazione**: Verifica login, logout, password
- **Test API**: Controlla che le chiamate al server funzionino
- **Test WebSocket**: Verifica le notifiche in tempo reale
- **Test Integrazione**: Controlla che tutto funzioni insieme

### 4. **Lista dei risultati**
Ogni test appare con:
- **Icona colorata**:
  - ✅ Verde = Test passato
  - ❌ Rosso = Test fallito
  - 🔄 Giallo = Test in corso
  - ⏭️ Grigio = Test saltato
- **Nome del test**: Cosa sta testando
- **Categoria**: A quale gruppo appartiene
- **Durata**: Quanto tempo ha impiegato

### 5. **Report Coverage** (in basso)
Mostra quanto codice è coperto dai test:
- **Barra di progresso**: 
  - Verde (>80%) = Ottimo
  - Giallo (60-80%) = Buono
  - Rosso (<60%) = Da migliorare
- **Target minimo**: 80% è l'obiettivo

## Come usare i test

### Eseguire tutti i test
1. Clicca sul pulsante **"Esegui Test"**
2. I test inizieranno automaticamente
3. Vedrai i risultati apparire in tempo reale
4. Al termine, le statistiche si aggiorneranno

### Eseguire test specifici
1. Clicca su uno dei **tab** (es. "Test Autenticazione")
2. Clicca **"Esegui Test"**
3. Verranno eseguiti solo i test di quella categoria

### Interpretare i risultati

#### ✅ **Tutto verde?** 
Perfetto! Il sistema funziona correttamente.

#### ❌ **Ci sono test rossi?**
1. Clicca sul test fallito per vedere l'errore
2. Annota il messaggio di errore
3. Contatta lo sviluppatore con queste informazioni

#### 📊 **Coverage bassa?**
Se la coverage è sotto l'80%, significa che alcune parti del codice non sono testate. Non è critico ma andrebbe migliorato.

## Quando eseguire i test?

### Consigliato eseguire i test:
- **Dopo ogni aggiornamento** del sistema
- **Prima di modifiche importanti**
- **Se ci sono problemi** segnalati dagli utenti
- **Una volta a settimana** come controllo di routine

## Cosa fare se i test falliscono?

1. **Non preoccuparti!** I test servono proprio a trovare problemi prima che li trovino gli utenti
2. **Fai uno screenshot** della pagina con i test falliti
3. **Annota**:
   - Quale test è fallito
   - Il messaggio di errore (se visibile)
   - L'ora e la data
4. **Contatta** il supporto tecnico o lo sviluppatore
5. **Nel frattempo**, il sistema potrebbe funzionare comunque, ma con qualche limitazione

## Funzionalità avanzate

### Streaming in tempo reale
I risultati appaiono man mano che i test vengono eseguiti, non devi aspettare la fine per vedere cosa succede.

### Salvataggio automatico
I risultati vengono salvati automaticamente, così puoi vedere lo storico dell'ultimo test anche se ricarichi la pagina.

### Filtri intelligenti
Usa i tab per concentrarti su specifiche aree del sistema che vuoi testare.

## Domande frequenti

**D: Quanto tempo ci mettono i test?**
R: Di solito 1-3 minuti per tutti i test, dipende dal numero di test e dalla velocità del server.

**D: Posso interrompere i test mentre sono in corso?**
R: No, una volta avviati devono completare. Ma puoi chiudere la pagina e tornarci dopo.

**D: I test rallentano il sistema?**
R: Potrebbero rallentare leggermente il sistema mentre sono in esecuzione. Meglio eseguirli quando ci sono pochi utenti online.

**D: Cosa significa "skipped"?**
R: Alcuni test vengono saltati se mancano le condizioni per eseguirli (es. test di pagamento se Stripe non è configurato).

## Sicurezza

- Solo il SUPER ADMIN può accedere a questa pagina
- I test non modificano dati reali
- I test usano dati di prova separati
- Non vengono esposte informazioni sensibili

## Supporto

Per assistenza con i test, contatta:
- **Email**: supporto@assistenza.it
- **Documentazione tecnica**: `/Docs/TEST-AUTOMATICI.md`

---

*Questa pagina è stata creata per garantire la qualità e l'affidabilità del Sistema di Richiesta Assistenza.*
