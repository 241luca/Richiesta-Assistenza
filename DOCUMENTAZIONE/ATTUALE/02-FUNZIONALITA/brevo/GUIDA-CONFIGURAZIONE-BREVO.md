# 📧 GUIDA CONFIGURAZIONE BREVO - SISTEMA RICHIESTA ASSISTENZA

**Data:** 12 Settembre 2025  
**Autore:** Assistente Claude  
**Per:** Luca Mambelli

---

## 📋 COSA È BREVO?

Brevo (ex SendinBlue) è un servizio per inviare email dal tuo sistema.
- **GRATIS**: Fino a 300 email al giorno
- **AFFIDABILE**: Arrivano sempre nella casella principale (non spam)
- **SEMPLICE**: Configurazione in 5 minuti

---

## 🚀 PASSI DA SEGUIRE (IN ORDINE)

### PASSO 1: Crea Account Brevo
1. Apri il browser
2. Vai su: **www.brevo.com**
3. Clicca su **"Sign up free"** (in alto a destra)
4. Inserisci:
   - La tua email
   - Una password sicura
   - Nome della tua azienda
5. Conferma la tua email (controlla la posta)

### PASSO 2: Ottieni le Credenziali
1. Accedi a Brevo con email e password
2. Clicca sul tuo nome (in alto a destra)
3. Vai su **"SMTP & API"**
4. Copia questi 3 dati importanti:
   - **API Key**: inizia con "xkeysib-..." (lunga stringa di lettere/numeri)
   - **Login SMTP**: la tua email Brevo
   - **Password SMTP**: una password speciale (NON quella del tuo account!)

### PASSO 3: Configura il Sistema
1. Apri il file: `backend/.env`
2. Trova queste righe e sostituisci:

```
BREVO_API_KEY=xkeysib-INSERISCI_LA_TUA_API_KEY_QUI
↓ Sostituisci con la tua API Key vera
BREVO_API_KEY=xkeysib-1234567890abcdef...

SMTP_USER=LA_TUA_EMAIL_BREVO@example.com
↓ Sostituisci con la tua email Brevo
SMTP_USER=luca@lmtecnologie.it

SMTP_PASS=LA_TUA_PASSWORD_SMTP_BREVO
↓ Sostituisci con la password SMTP di Brevo
SMTP_PASS=xsmtpsib-abc123...

EMAIL_FROM=LA_TUA_EMAIL_MITTENTE@tuodominio.it
↓ Sostituisci con l'email che apparirà come mittente
EMAIL_FROM=noreply@lmtecnologie.it
```

3. **SALVA** il file

### PASSO 4: Testa che Funzioni
1. Apri il Terminale
2. Vai nella cartella del progetto:
   ```
   cd /Users/lucamambelli/Desktop/Richiesta-Assistenza
   ```
3. Esegui il test (sostituisci con la tua email):
   ```
   node test-brevo-email.js tuaemail@gmail.com
   ```
4. Se vedi **"✅ Email inviata con successo!"** → PERFETTO!
5. Controlla la tua email, dovresti ricevere un messaggio di test

---

## ❓ PROBLEMI COMUNI E SOLUZIONI

### Problema: "Credenziali errate"
**Soluzione**: Hai copiato la password SMTP e NON quella del tuo account Brevo?

### Problema: "Account non verificato"
**Soluzione**: Controlla la tua email e conferma l'account Brevo

### Problema: "Limite raggiunto"
**Soluzione**: Il piano gratuito permette 300 email/giorno. Aspetta domani o passa al piano a pagamento.

### Problema: "Connection refused"
**Soluzione**: 
1. Verifica che la porta 587 non sia bloccata
2. Prova a riavviare il backend

---

## ✅ VERIFICA FINALE

Quando tutto funziona, il sistema potrà:
- ✉️ Inviare email di benvenuto ai nuovi utenti
- 🔐 Inviare link per reset password
- 💰 Notificare nuovi preventivi
- 📋 Inviare rapporti di intervento
- 🔔 Tutte le notifiche via email

---

## 📞 SERVE AIUTO?

Se hai problemi:
1. Rileggi questa guida dall'inizio
2. Verifica di aver copiato ESATTAMENTE le credenziali
3. Prova il test email di nuovo
4. Chiedi assistenza mostrando l'errore esatto

---

## 📝 NOTE IMPORTANTI

- **NON CONDIVIDERE** mai le tue credenziali API
- **FAI UN BACKUP** del file .env dopo averlo configurato
- Le email di test non contano nel limite giornaliero
- Puoi cambiare l'email mittente quando vuoi

---

**Configurazione completata da:** ________________  
**Data:** ________________  
**Funzionante:** ☐ Sì ☐ No
