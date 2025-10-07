# 📱 WHATSAPP - GUIDA RAPIDA

## 🚀 ACCESSO RAPIDO
**URL Admin:** http://localhost:5193/admin/whatsapp  
**Istanza:** assistenza  
**Numero:** 393517935661  
**Nome:** Medicina Ravenna

---

## ✅ STATO SISTEMA

### Indicatori Visivi
- 🟢 **Badge Verde + Numero** = Connesso e operativo
- 🟡 **Stato Giallo** = In connessione
- 🔴 **Stato Rosso** = Disconnesso

### Verifica Rapida Connessione
Se vedi "connecting" ma Evolution mostra connesso:
1. Clicca **"Verifica Connessione (Metodo Affidabile)"** (bottone blu)
2. Attendi conferma verde
3. Il numero apparirà nell'header

---

## 📤 INVIO MESSAGGI RAPIDO

### Invio Base
1. Tab **"Invia Messaggio"**
2. **Numero:** Solo cifre (es: 3331234567) - il +39 si aggiunge automaticamente
3. **Messaggio:** Scrivi il testo
4. Clicca **"Invia Messaggio"**

### Templates Pronti
- **Benvenuto:** "Ciao! Grazie per averci contattato. Come possiamo aiutarti?"
- **Conferma:** "Il tuo appuntamento è confermato per il giorno [DATA] alle ore [ORA]."
- **Ricevuto:** "Abbiamo ricevuto la tua richiesta. Ti risponderemo entro 24 ore."
- **In Arrivo:** "Il tecnico sta arrivando. Tempo stimato: [MINUTI] minuti."

---

## 🔧 OPERAZIONI COMUNI

### Riconnettere WhatsApp
1. Tab **"Gestione Istanza"**
2. Clicca **"Genera QR Code"**
3. Scansiona con WhatsApp → Impostazioni → Dispositivi collegati
4. Attendi conferma verde

### Riavviare Istanza
1. Tab **"Stato Connessione"**
2. Clicca **"Riavvia Istanza"**
3. Attendi 5 secondi
4. Verifica stato verde

### Verificare un Numero
```javascript
// Nel browser console (F12)
await api.post('/whatsapp/check-number', { number: '3331234567' })
```

---

## 🆘 PROBLEMI COMUNI

### "WhatsApp non connesso"
1. Vai a Evolution Manager: http://37.27.89.35:8080/manager
2. Verifica stato istanza "assistenza"
3. Se connesso lì, usa "Verifica Connessione" nell'admin

### "Errore invio messaggio"
- ✅ Verifica numero formato corretto (no spazi, no +)
- ✅ Verifica WhatsApp connesso (badge verde)
- ✅ Messaggio max 4096 caratteri

### "QR Code non si genera"
1. Riavvia istanza
2. Attendi 10 secondi
3. Riprova a generare QR

---

## 📊 API ENDPOINTS PRINCIPALI

```bash
# Stato connessione
GET /api/whatsapp/status

# Invia messaggio
POST /api/whatsapp/send
{
  "recipient": "3331234567",
  "message": "Testo messaggio"
}

# Verifica numero
POST /api/whatsapp/check-number
{
  "number": "3331234567"
}

# Lista istanze
GET /api/whatsapp/instances

# Genera QR
GET /api/whatsapp/qrcode
```

---

## 📞 CONTATTI SUPPORTO

**Problemi Evolution API:**  
Dashboard: http://37.27.89.35:8080/manager  

**Problemi Sistema:**  
Email: supporto@lmtecnologie.it

---

**Ultimo aggiornamento:** 10 Gennaio 2025
