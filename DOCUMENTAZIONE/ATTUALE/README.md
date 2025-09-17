# 📚 DOCUMENTAZIONE SISTEMA RICHIESTA ASSISTENZA

**Versione**: 4.1.0  
**Data Aggiornamento**: 17 Settembre 2025  
**Ambiente**: Produzione

---

## 🗂️ STRUTTURA DOCUMENTAZIONE

### 📁 Documentazione/Attuale/
Contiene la documentazione aggiornata e attualmente valida:

- **DEPLOYMENT-PRODUCTION.md** - Guida completa deployment in produzione
- **STATO-SISTEMA.md** - Stato attuale del sistema e servizi
- **README.md** - Questo file (indice documentazione)

### 📁 Documentazione/Archivio/
Contiene documentazione storica e versioni precedenti (se presenti)

---

## 🔗 LINK RAPIDI

### Produzione
- **Sito Live**: https://richiestaassistenza.it
- **Admin Panel**: https://richiestaassistenza.it/admin
- **API Health**: https://richiestaassistenza.it/api/health

### Repository
- **GitHub**: https://github.com/241luca/Richiesta-Assistenza
- **Branch**: main

### Server
- **VPS**: 37.27.89.35 (Hetzner)
- **SSH**: `ssh root@37.27.89.35`

---

## 📖 DOCUMENTI PRINCIPALI

### 1. DEPLOYMENT-PRODUCTION.md
- Configurazione completa server VPS
- Setup NGINX, SSL, PM2
- Procedure deployment
- Comandi gestione sistema
- Troubleshooting

### 2. STATO-SISTEMA.md
- Stato real-time servizi
- Configurazioni attuali
- Modifiche recenti
- Sistema backup
- Checklist monitoraggio

---

## 🆘 SUPPORTO RAPIDO

### Riavvio Servizi
```bash
ssh root@richiestaassistenza.it
pm2 restart all
```

### Check Stato
```bash
pm2 status
pm2 logs --lines 50
```

### Backup Database
```bash
cd /var/www/Richiesta-Assistenza/backend
npm run backup:db
```

---

## 📞 CONTATTI

**Sviluppatore**: Luca Mambelli  
**Email**: lucamambelli@lmtecnologie.it  
**GitHub**: @241luca

---

Ultimo aggiornamento: 17/09/2025 22:15
