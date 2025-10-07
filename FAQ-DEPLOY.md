# ❓ FAQ - Domande Frequenti Deploy Docker

## 🤔 DOMANDE GENERALI

### Quanto spazio serve sul VPS?
**Minimo 20GB**, consigliato 40GB+ per crescere nel tempo.

### Quanta RAM serve?
**Minimo 2GB**, consigliato 4GB. WhatsApp da solo usa 512MB.

### Funziona su VPS economici?
Sì! Anche su VPS da 5€/mese (2GB RAM) funziona bene.

### Devo comprare un dominio?
Non obbligatorio all'inizio. Puoi usare l'IP del VPS. Ma per produzione è consigliato.

---

## 🐳 DOCKER

### Cos'è Docker?
È come una "scatola" che contiene tutto il necessario per far funzionare l'app. Più facile e sicuro.

### Perché 5 container separati?
- **Isolamento**: Se WhatsApp crasha, il resto funziona
- **Risorse**: Puoi limitare quanto ogni parte può usare
- **Manutenzione**: Riavvii solo quello che serve

### Posso usare Docker Desktop?
Sul VPS no, usiamo Docker Engine (più leggero). Sul tuo Mac sì.

### Come vedo cosa sta succedendo?
```bash
docker-compose logs -f
```

---

## 📱 WHATSAPP

### Perché WhatsApp ha un container separato?
Usa Chromium che consuma molta RAM (300-500MB). Separandolo:
- Non blocca il backend se va in crash
- Puoi limitare le risorse (max 512MB)
- Più facile da riavviare

### Devo scansionare il QR ogni volta?
**NO!** Solo la prima volta. Poi la sessione è salvata in un volume Docker.

### Se riavvio il server, perdo WhatsApp?
No! La sessione è persistente. Dopo il riavvio si riconnette automaticamente.

### Posso usare più numeri WhatsApp?
Sì, ma servono più container. Ogni numero = 1 container.

### WhatsApp Business funziona?
Sì! WppConnect funziona sia con WhatsApp normale che Business.

---

## 🔐 SICUREZZA

### Le password in .env sono sicure?
Sì, se usi password forti e il file NON è pubblico. Mai committare su Git!

### Come genero password sicure?
```bash
openssl rand -base64 32
```

### Serve un firewall?
**SÌ!** Apri solo le porte necessarie:
- 80 (HTTP)
- 443 (HTTPS)
- 22 (SSH) - solo per tuo IP

### HTTPS è obbligatorio?
Per produzione **SÌ**! Usa Let's Encrypt (gratis).

---

## 💾 DATABASE

### I dati sono sicuri?
Sì, salvati in un volume Docker persistente. Fai backup regolari!

### Come faccio backup?
```bash
docker-compose exec database pg_dump -U assistenza_user assistenza_db > backup.sql
```

### Posso vedere il database?
Sì, con Prisma Studio:
```bash
docker-compose exec backend npx prisma studio
```

### Se cancello un container, perdo i dati?
No! I dati sono in **volumi separati**, non nel container.

---

## 🚀 PERFORMANCE

### Il sito è lento, cosa faccio?
1. Vedi uso risorse: `docker stats`
2. Controlla log errori: `docker-compose logs`
3. Forse serve più RAM sul VPS

### Quanti utenti supporta?
Con VPS 4GB RAM: **circa 50-100 utenti simultanei**

### Posso scalare?
Sì! Puoi:
- Aumentare risorse VPS
- Usare più container backend
- Aggiungere load balancer

### Redis a cosa serve?
**Cache** = rende tutto più veloce! Salva dati temporanei in RAM.

---

## 🔧 MANUTENZIONE

### Devo aggiornare Docker?
Sì, ogni 3-6 mesi:
```bash
sudo apt-get update
sudo apt-get upgrade docker-ce
```

### Come aggiorno l'app?
```bash
cd /opt/assistenza
git pull
docker-compose build --no-cache
docker-compose up -d
```

### Cosa faccio se tutto va male?
1. **Backup**: Hai fatto backup? Ripristina
2. **Log**: Vedi cosa dice `docker-compose logs`
3. **Riavvio**: `docker-compose restart`
4. **Ricrea**: `docker-compose down && docker-compose up -d`

### Serve manutenzione regolare?
Sì, minima:
- Backup database (giornaliero)
- Pulire log vecchi (settimanale)
- Aggiornamenti sistema (mensile)

---

## 📧 EMAIL

### Brevo è gratis?
Sì, fino a 300 email/giorno gratis. Poi 19€/mese.

### Posso usare Gmail?
Sconsigliato. Gmail blocca invii automatici. Usa Brevo o SendGrid.

### Le email vanno nello spam?
All'inizio forse sì. Serve:
- Dominio verificato
- SPF e DKIM configurati
- Mandare email "normali"

---

## 🌐 DOMINIO E DNS

### Dove compro un dominio?
- Namecheap
- GoDaddy  
- Cloudflare
- Aruba (Italia)

### Come configuro DNS?
Nel pannello del dominio:
```
A Record:    @ → IP-VPS
A Record:    www → IP-VPS
A Record:    api → IP-VPS
```

### Quanto ci vuole per propagarsi?
Da 5 minuti a 24 ore. Di solito 1-2 ore.

---

## 💰 COSTI

### Costi mensili tipici
- **VPS** (4GB RAM): €5-15/mese
- **Dominio**: €10-20/anno
- **Email** (Brevo): Gratis o €19/mese
- **SSL**: Gratis (Let's Encrypt)
- **TOTALE**: ~€10-25/mese

### Posso iniziare gratis?
Sì! Usa:
- VPS trial (AWS, DigitalOcean)
- Email Brevo free
- Solo IP (no dominio)
- SSL self-signed

---

## ⚠️ PROBLEMI COMUNI

### "Port 80 already in use"
C'è già qualcosa su porta 80:
```bash
sudo lsof -i :80
# Killa quel processo o cambia porta
```

### "Cannot connect to Docker daemon"
Docker non è avviato:
```bash
sudo systemctl start docker
```

### "Out of memory"
VPS ha poca RAM. Opzioni:
1. Upgrade VPS
2. Limita risorse container
3. Disabilita servizi non necessari

### Container continua a restartare
Vedi log per capire perché:
```bash
docker-compose logs NOME_CONTAINER
```

---

## 🎓 APPROFONDIMENTI

### Voglio imparare Docker
- Documentazione ufficiale: https://docs.docker.com
- Corso gratis: Docker per principianti

### Voglio capire meglio il progetto
Leggi:
- `ISTRUZIONI-PROGETTO.md`
- `DEPLOY-DOCKER.md`
- `DOCUMENTAZIONE/`

### Serve aiuto personalizzato?
Contatta: lucamambelli@lmtecnologie.it

---

## ✅ CHECKLIST "È TUTTO OK?"

- [ ] Tutti container UP: `docker-compose ps`
- [ ] Backend risponde: `curl http://localhost:3200/api/health`
- [ ] Frontend carica: Apri browser
- [ ] WhatsApp connesso: Vedi admin panel
- [ ] Email di test inviata
- [ ] Backup configurato
- [ ] SSL installato (se dominio)

---

**Se hai altre domande**: Apri issue su GitHub o scrivi a lucamambelli@lmtecnologie.it
