# 📚 LEGGIMI DOCUMENTAZIONE - Sistema Richiesta Assistenza v6.2.1

**Ultimo Aggiornamento**: 19 Aprile 2026
**Versione Sistema**: 6.2.1

> 🎯 **SCOPO**: Guida rapida per navigare tutta la documentazione del progetto

---

## 📌 FILE NELLA ROOT (Solo 4 autorizzati)

| File | Descrizione | Quando Consultarlo |
|---|---|---|
| **ISTRUZIONI-PROGETTO.md** | ⚠️ Regole tecniche vincolanti | SEMPRE prima di sviluppare |
| **README.md** | Overview sistema, quick start, architettura | Per iniziare o presentare il progetto |
| **CHANGELOG.md** | Storia completa delle versioni | Per capire l'evoluzione del sistema |
| **LEGGIMI-DOCUMENTAZIONE.md** | Questo file — mappa della documentazione | Per orientarsi |

---

## 📁 DOCUMENTAZIONE/

```
DOCUMENTAZIONE/
├── INDEX.md                        👈 INIZIA DA QUI per navigare
├── ATTUALE/                        Documentazione valida e aggiornata
│   ├── 00-ESSENZIALI/             File critici
│   ├── 01-ARCHITETTURA/           Architettura e stack tecnologico
│   ├── 02-FUNZIONALITA/           Docs per ogni feature
│   ├── 03-API/                    Documentazione API
│   ├── 04-GUIDE/                  Guide pratiche
│   │   ├── DEPLOY-VM.md          ✨ Guida deploy VM 103 COMPLETA (riscritta 19/04)
│   │   └── GESTIONE-PRISMA.md    🆕 Guida Prisma, migration, troubleshooting
│   └── 05-TROUBLESHOOTING/        Risoluzione problemi
├── ARCHIVIO/                       Documentazione storica
└── REPORT-SESSIONI/                Report ogni sessione di sviluppo
    ├── 2026-04-18-fix-hardcoded-deploy-vm103.md
    └── 2026-04-19-fix-prisma-migrations.md  🆕 Ultimo report (fix migration + allineamento)
```

---

## 🚀 Guide Essenziali

| Guida | Percorso |
|---|---|
| **Deploy VM 103 (completa)** | `DOCUMENTAZIONE/ATTUALE/04-GUIDE/DEPLOY-VM.md` |
| **Gestione Prisma / migration** | `DOCUMENTAZIONE/ATTUALE/04-GUIDE/GESTIONE-PRISMA.md` |
| **Script deploy (parziale)** | `deploy-vm.sh` (root del progetto) |
| **Regole sviluppo** | `ISTRUZIONI-PROGETTO.md` |
| **Template .env** | `.env.example` |

---

## 📊 Statistiche v6.2.1

- **Versione**: 6.2.1 — 19 Aprile 2026
- **VM produzione**: http://192.168.0.203 ✅ Online
- **File sorgente corretti**: 22 (zero localhost hardcoded)
- **TypeScript strict mode**: ✅ Attivo su tutto il progetto
- **Documenti totali**: 75+ file .md
- **Database VM**: ✅ Perfettamente allineato con locale (161 tabelle, 3 migration)

---

**Navigazione completa → [DOCUMENTAZIONE/INDEX.md](DOCUMENTAZIONE/INDEX.md)**
