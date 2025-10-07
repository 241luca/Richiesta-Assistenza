# 🔐 Guida Semplice - Come Funziona l'Accesso al Sistema

> **Per chi non ha esperienza tecnica** - Spiegazione semplice e chiara

## 🎯 Cos'è l'Autenticazione?

L'**autenticazione** è il processo che verifica che tu sia veramente tu quando accedi al sistema. È come mostrare la carta d'identità per entrare in un edificio.

---

## 📱 Come Fare Login (Accedere)

### Passo 1: Vai alla Pagina di Login
- Apri il browser (Chrome, Firefox, Safari, etc.)
- Vai all'indirizzo: `http://localhost:5193`
- Ti apparirà la schermata di login

### Passo 2: Inserisci le Tue Credenziali
```
📧 Email: [la tua email]
🔐 Password: [la tua password]
```

### Passo 3: Clicca su "Accedi"
- Il sistema verifica che email e password siano corrette
- Se tutto è OK, entri nel sistema
- Se c'è un errore, controlla di aver scritto bene

---

## 🔑 Come Funziona (In Modo Semplice)

Immagina il sistema come un **edificio sicuro**:

1. **🚪 La Porta d'Ingresso** = Pagina di Login
   - Qui mostri le tue credenziali (email + password)

2. **👮 Il Guardiano** = Sistema di Verifica
   - Controlla che tu sia nella lista degli autorizzati
   - Verifica che la password sia corretta

3. **🎫 Il Pass** = Token di Accesso
   - Una volta verificato, ricevi un "pass temporaneo"
   - Questo pass ti permette di girare nell'edificio
   - Il pass scade dopo 7 giorni (poi devi fare login di nuovo)

4. **📡 Il Walkie-Talkie** = WebSocket
   - Ti viene dato anche un walkie-talkie per ricevere messaggi
   - Ti avvisa quando arrivano notifiche importanti
   - Funziona solo se hai il pass valido

---

## 🛡️ Sicurezza del Tuo Account

### La Tua Password è Protetta

❌ **NON viene salvata così**: `miaPassword123`

✅ **Viene salvata così**: `$2b$12$KIXxPf3g8H...` (codice impossibile da decifrare)

### Protezione da Tentativi di Accesso

Se sbagli la password **5 volte di seguito**:
- L'account viene **bloccato per 30 minuti**
- È una protezione contro chi cerca di indovinare la password
- Dopo 30 minuti puoi riprovare

### Storico Accessi

Il sistema registra:
- ✅ Quando fai login con successo
- ❌ Quando qualcuno sbaglia la tua password
- 📍 Da quale computer/dispositivo
- 🕐 Data e ora esatta

---

## 🔐 Autenticazione a Due Fattori (2FA) - Opzionale

### Cos'è?
È come avere **due serrature sulla porta** invece di una:
1. Prima serratura = Password
2. Seconda serratura = Codice che cambia ogni 30 secondi sul tuo telefono

### Come Attivarla?

1. **Vai nelle Impostazioni del Profilo**
2. **Clicca su "Attiva 2FA"**
3. **Scansiona il QR Code** con un'app come:
   - Google Authenticator
   - Microsoft Authenticator
   - Authy
4. **Inserisci il codice** che vedi nell'app
5. **Fatto!** Ora il tuo account è super sicuro

### Come Fare Login con 2FA?

1. Inserisci email e password come sempre
2. Ti viene chiesto un **codice a 6 cifre**
3. Apri l'app sul telefono
4. Inserisci il codice che vedi (cambia ogni 30 secondi)
5. Accedi al sistema

---

## 🚪 Come Fare Logout (Uscire)

### Perché è Importante?
Fare logout è come **chiudere a chiave quando esci di casa**.

### Come Si Fa?
1. Clicca sul tuo nome/foto in alto a destra
2. Seleziona "Esci" o "Logout"
3. Verrai riportato alla pagina di login

### Cosa Succede?
- Il tuo "pass" viene cancellato
- Le notifiche si fermano
- Nessuno può usare il tuo account da quel computer

---

## ❓ Problemi Comuni

### "Email o password non corrette"

**Possibili cause:**
- Hai scritto male l'email
- Hai sbagliato la password (maiuscole/minuscole contano!)
- L'account non esiste

**Soluzione:** Controlla bene quello che scrivi

### "Account bloccato"

**Causa:** Troppi tentativi sbagliati (5 o più)

**Soluzione:** Aspetta 30 minuti e riprova

### "Token scaduto" o "Sessione scaduta"

**Causa:** Sei rimasto inattivo per troppo tempo

**Soluzione:** Fai logout e login di nuovo

### Non Ricevo Notifiche in Tempo Reale

**Possibili cause:**
- Non sei connesso a internet
- Il browser sta bloccando la connessione
- C'è un problema con il token

**Soluzione:** 
1. Controlla la connessione internet
2. Prova a fare logout e login di nuovo
3. Prova con un altro browser

---

## 💡 Consigli per la Sicurezza

### Password Sicura
✅ **Buona password:**
- Almeno 8 caratteri
- Mix di lettere, numeri e simboli
- Esempio: `CasaRossa2024!`

❌ **Password da evitare:**
- Il tuo nome o data di nascita
- Password troppo semplici (123456, password)
- La stessa password che usi ovunque

### Buone Abitudini
1. **Non condividere** mai le tue credenziali
2. **Fai logout** quando usi computer pubblici
3. **Attiva il 2FA** per maggiore sicurezza
4. **Cambia password** se pensi che qualcuno la conosca
5. **Segnala** attività sospette agli amministratori

---

## 🆘 Serve Aiuto?

### Chi Contattare

1. **Per problemi di accesso**: Contatta l'amministratore
2. **Per password dimenticata**: Usa "Password dimenticata" nella pagina di login
3. **Per account bloccato**: Aspetta 30 minuti o chiedi all'admin
4. **Per attivare 2FA**: Chiedi assistenza se non riesci da solo

### Informazioni da Fornire

Quando chiedi aiuto, comunica:
- La tua email di registrazione
- Che tipo di errore vedi
- Quando è successo
- Da che dispositivo stai accedendo

---

## 📝 Riepilogo Veloce

| Azione | Come Si Fa | Tempo |
|--------|------------|-------|
| **Login** | Email + Password → Accedi | 5 secondi |
| **Logout** | Menu → Esci | 2 secondi |
| **Attivare 2FA** | Impostazioni → Sicurezza → Attiva 2FA | 2 minuti |
| **Reset Password** | Login → Password dimenticata | 5 minuti |

---

## 🎓 Glossario Semplice

- **Autenticazione**: Verificare che sei tu
- **Token**: Pass temporaneo per accedere
- **2FA**: Doppia sicurezza con codice sul telefono
- **WebSocket**: Connessione per notifiche istantanee
- **Login**: Entrare nel sistema
- **Logout**: Uscire dal sistema
- **Sessione**: Il periodo in cui sei connesso
- **Cookie**: File che ricorda chi sei
- **Cache**: Memoria temporanea del browser

---

*Guida creata per utenti non tecnici - Ultimo aggiornamento: 25 Agosto 2025*
