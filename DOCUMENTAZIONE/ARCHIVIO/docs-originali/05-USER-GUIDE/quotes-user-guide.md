# Guida Utente - Sistema Preventivi

## Indice
1. [Introduzione](#introduzione)
2. [Per i Professionisti](#per-i-professionisti)
3. [Per i Clienti](#per-i-clienti)
4. [Gestione Versioni](#gestione-versioni)
5. [FAQ](#faq)

---

## Introduzione

Il sistema di gestione preventivi permette di creare, modificare e gestire preventivi professionali per le richieste di assistenza. Include funzionalità avanzate come il versionamento automatico, la tracciabilità delle modifiche e la generazione di PDF.

## Per i Professionisti

### 📝 Creazione Preventivo

1. **Accedere alla lista preventivi**
   - Dal menu principale, cliccare su "Preventivi"
   - Cliccare sul pulsante "Nuovo Preventivo"

2. **Selezionare la richiesta**
   - Scegliere dalla lista delle richieste assegnate
   - Sono visibili solo le richieste in stato "Assegnato" o "In corso"

3. **Compilare i dettagli**
   - **Titolo**: Inserire un titolo descrittivo
   - **Descrizione**: Aggiungere dettagli sul lavoro
   - **Validità**: Impostare la data di scadenza (default 30 giorni)

4. **Aggiungere le voci**
   - Cliccare su "Aggiungi Voce" per ogni item
   - Per ogni voce specificare:
     - Descrizione dettagliata
     - Quantità
     - Prezzo unitario (in euro)
     - Aliquota IVA (default 22%)
   - Il totale viene calcolato automaticamente

5. **Costi di trasferimento** (opzionale)
   - Selezionare la checkbox "Includi costi di trasferimento"
   - Il sistema calcolerà automaticamente i costi basati sulla distanza
   - I costi verranno aggiunti come voce nel preventivo

6. **Note e condizioni**
   - Aggiungere eventuali note per il cliente
   - Specificare termini e condizioni

7. **Salvare il preventivo**
   - Cliccare su "Crea Preventivo"
   - Il preventivo verrà inviato al cliente

### ✏️ Modifica Preventivo ✨ NUOVO

I preventivi possono essere modificati solo se sono in stato **DRAFT** (bozza) o **PENDING** (in attesa).

1. **Accedere al preventivo**
   - Dalla lista preventivi, individuare il preventivo da modificare
   - Cliccare sul pulsante "Modifica" (icona matita)

2. **Effettuare le modifiche**
   - Modificare i campi desiderati
   - Aggiungere o rimuovere voci
   - Aggiornare prezzi o quantità

3. **Inserire il motivo della modifica**
   - Campo opzionale ma consigliato
   - Aiuta a tenere traccia del perché delle modifiche
   - Esempi: "Aggiornamento prezzi", "Correzione quantità", "Aggiunta servizi"

4. **Salvare le modifiche**
   - Cliccare su "Salva Modifiche"
   - Il sistema creerà automaticamente una nuova versione
   - Il cliente riceverà una notifica dell'aggiornamento

### 🗑️ Cancellazione Preventivo ✨ NUOVO

I preventivi possono essere cancellati solo se **NON** sono in stato **ACCEPTED** (accettato).

1. **Individuare il preventivo**
   - Dalla lista preventivi, trovare il preventivo da cancellare
   - Cliccare sul pulsante "Elimina" (icona cestino)

2. **Confermare la cancellazione**
   - Apparirà un messaggio di conferma
   - Cliccare "OK" per procedere

3. **Inserire il motivo** (opzionale)
   - Verrà richiesto il motivo della cancellazione
   - È opzionale ma consigliato per tracciabilità
   - Premere "OK" anche senza motivo per procedere

⚠️ **Attenzione**: La cancellazione è **permanente** e non può essere annullata. Tutti i dati del preventivo vengono salvati nei log di sistema prima della cancellazione per motivi di audit.

### 📊 Visualizzazione Cronologia ✨ NUOVO

Per preventivi modificati più volte:

1. **Accedere alla pagina di modifica**
   - Cliccare su "Modifica" sul preventivo

2. **Visualizzare la cronologia**
   - In alto a destra, cliccare su "Cronologia (X revisioni)"
   - Verrà mostrata la lista di tutte le versioni con:
     - Numero versione
     - Data modifica
     - Utente che ha modificato
     - Motivo della modifica

### 📄 Generazione PDF

1. **Dalla lista preventivi**
   - Cliccare sul pulsante "PDF" accanto al preventivo
   - Il PDF verrà scaricato automaticamente

2. **Contenuto del PDF**
   - Dati azienda e cliente
   - Dettaglio voci con prezzi
   - Totali e IVA
   - Termini e condizioni
   - Numero versione (se modificato)

---

## Per i Clienti

### 👀 Visualizzazione Preventivi

1. **Accedere ai preventivi**
   - Dal menu principale, cliccare su "Preventivi"
   - Verranno mostrati tutti i preventivi ricevuti

2. **Filtrare i preventivi**
   - Per stato (In attesa, Accettato, Rifiutato)
   - Per richiesta
   - Tramite ricerca testuale

3. **Visualizzare i dettagli**
   - Cliccare su "Dettagli" per vedere il preventivo completo
   - Verificare voci, prezzi e condizioni

### ✅ Accettazione Preventivo

1. **Valutare il preventivo**
   - Leggere attentamente tutte le voci
   - Verificare i prezzi e le condizioni

2. **Accettare**
   - Cliccare sul pulsante "Accetta"
   - Confermare l'accettazione
   - Il professionista riceverà una notifica

3. **Gestione deposito** (se richiesto)
   - Alcuni preventivi potrebbero richiedere un deposito
   - Seguire le istruzioni per il pagamento
   - Il lavoro inizierà dopo la conferma del pagamento

### ❌ Rifiuto Preventivo

1. **Rifiutare con motivazione**
   - Cliccare sul pulsante "Rifiuta"
   - Inserire il motivo del rifiuto (opzionale)
   - Il professionista riceverà una notifica

2. **Richiedere modifiche**
   - Invece di rifiutare, si può contattare il professionista
   - Utilizzare la chat per negoziare modifiche
   - Il professionista potrà creare una nuova versione

---

## Gestione Versioni

### Come funziona il versionamento

1. **Versione 1**: Creazione iniziale del preventivo
2. **Versione 2, 3, ...**: Ogni modifica incrementa la versione
3. **Tracciabilità**: Ogni versione mantiene:
   - Chi ha fatto la modifica
   - Quando è stata fatta
   - Motivo della modifica
   - Snapshot dei dati precedenti

### Vantaggi del versionamento

- ✅ **Trasparenza**: Cliente e professionista vedono tutte le modifiche
- ✅ **Audit Trail**: Tracciabilità completa per dispute
- ✅ **Confronto**: Possibilità di vedere cosa è cambiato
- ✅ **Sicurezza**: Nessuna modifica viene persa

---

## FAQ

### Per Professionisti

**D: Posso modificare un preventivo già accettato?**
R: No, i preventivi accettati non possono essere modificati. È necessario creare un nuovo preventivo.

**D: Per quanto tempo è valido un preventivo?**
R: Di default 30 giorni, ma puoi impostare una data personalizzata durante la creazione.

**D: Posso recuperare un preventivo cancellato?**
R: No, la cancellazione è permanente. Tuttavia, i dati sono salvati nei log di sistema per audit.

**D: Come funzionano i costi di trasferimento?**
R: Il sistema calcola automaticamente i costi basandosi sulla distanza dal cliente. Basta attivare l'opzione durante la creazione.

**D: Posso usare template per preventivi ricorrenti?**
R: Questa funzionalità sarà disponibile in un aggiornamento futuro.

### Per Clienti

**D: Posso negoziare un preventivo?**
R: Sì, puoi contattare il professionista tramite chat per discutere modifiche. Il professionista potrà creare una nuova versione.

**D: Cosa succede se rifiuto un preventivo?**
R: Il professionista viene notificato e può decidere se inviare una nuova proposta modificata.

**D: Posso confrontare più preventivi?**
R: Sì, dalla lista preventivi puoi vedere e confrontare tutte le proposte ricevute per la stessa richiesta.

**D: Il preventivo è vincolante?**
R: Una volta accettato, il preventivo diventa vincolante per entrambe le parti secondo i termini specificati.

**D: Posso annullare un preventivo accettato?**
R: Contatta il professionista o l'amministratore per gestire situazioni particolari.

---

## Suggerimenti

### Per creare preventivi efficaci

1. **Sii dettagliato**: Descrivi chiaramente ogni voce
2. **Trasparenza sui costi**: Separa materiali, manodopera e spese
3. **Termini chiari**: Specifica cosa è incluso e cosa no
4. **Validità appropriata**: Non troppo breve né troppo lunga
5. **Note utili**: Aggiungi informazioni che aiutano il cliente a decidere

### Per valutare preventivi

1. **Confronta le voci**: Non guardare solo il totale
2. **Verifica inclusioni**: Cosa è compreso nel prezzo
3. **Controlla le credenziali**: Valutazioni del professionista
4. **Tempi di esecuzione**: Quando può essere svolto il lavoro
5. **Garanzie**: Quali garanzie sono offerte

---

## Assistenza

Per problemi o domande:
- 📧 Email: supporto@assistenza.it
- 💬 Chat: Disponibile nell'app
- 📞 Telefono: 800-123456
- 📚 Guide video: [Link alle guide]

---

*Ultimo aggiornamento: 31 Dicembre 2024 - Versione 2.0*
*Aggiunte funzionalità di modifica e cancellazione preventivi con tracciamento completo*
