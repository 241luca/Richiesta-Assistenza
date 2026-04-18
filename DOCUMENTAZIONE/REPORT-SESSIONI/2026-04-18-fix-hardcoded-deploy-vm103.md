# 📊 REPORT SESSIONE — Fix Hardcoded + Deploy VM 103

**Data**: 18 Aprile 2026  
**Autore**: Claude  
**Versione Sistema**: v6.1.0  
**VM**: 103 — richiesta-assistenza — 192.168.0.203

---

## 🎯 OBIETTIVO

Rimuovere tutti i `localhost` e URL hardcoded dal codice sorgente, correggere i bug segnalati nel documento di deploy, e deployare il tutto sulla VM 103 (Proxmox Z240).

---

## 🔧 MODIFICHE AL CODICE SORGENTE (22 file)

### Backend
| File | Fix |
|---|---|
| `backend/src/server.ts` | CORS dinamico da env, rimosso wppConnect non importato, path uploads corretto (`../` invece di `../../`) |
| `backend/src/server_test.ts` | Rimosso wppConnectService non importato |
| `backend/src/services/healthCheck.service.ts` | URL email usa `FRONTEND_URL` da env |
| `backend/src/services/testRunnerService.ts` | `localhost:3000` → `BACKEND_BASE_URL` da env |
| `backend/src/services/whatsapp-media.service.ts` | Sostituito wppConnectService con throw esplicito |
| `backend/src/services/whatsapp-template.service.ts` | Stesso fix, rimosso codice unreachable |
| `backend/src/scripts/setup-whatsapp.ts` | webhookUrl usa `BACKEND_URL` da env |
| `backend/Dockerfile` | Ottimizzato: usa dist precompilato, nessun npm install nel container, aggiunto su-exec e entrypoint |
| `backend/docker-entrypoint.sh` | Nuovo: fix permessi volumi montati all'avvio |

### Frontend
| File | Fix |
|---|---|
| `src/services/api.ts` | Esportata `API_BASE_URL`, rimosso console.log con porta hardcoded |
| `src/services/referralApi.ts` | Usa `API_BASE_URL` |
| `src/services/referral.service.ts` | Usa `API_BASE_URL` |
| `src/contexts/SocketContext.tsx` | WebSocket usa `API_BASE_URL` |
| `src/components/chat/RequestChat.tsx` | WebSocket usa `API_BASE_URL` |
| `src/components/admin/calendar/GoogleCalendarConfig.tsx` | Callback URL usa `API_BASE_URL` |
| `src/pages/RequestDetailPage.tsx` | 4 immagini profilo usano `API_BASE_URL` |
| `src/pages/AdminTestPage.tsx` | fetch usa `API_BASE_URL` |
| `src/pages/professional/reports/index.tsx` | Export URL usa `API_BASE_URL` |
| `src/pages/admin/api-keys/GoogleCalendarConfig.tsx` | Callback URL usa `API_BASE_URL` |
| `src/pages/admin/api-keys/GoogleMapsConfig.tsx` | allowedReferrers usa `window.location.origin` |
| `src/pages/admin/api-keys/StripeConfig.tsx` | Webhook URL usa `API_BASE_URL` |

### Infrastruttura
| File | Fix |
|---|---|
| `nginx.conf` | Aggiunto blocco `/uploads/` per proxy al backend |
| `Dockerfile.frontend` | Ottimizzato: usa dist precompilato, solo Nginx |
| `docker-compose.yml` | Healthcheck usa `/health` (senza auth) invece di `/api/health` |

---

## 🚀 DEPLOY VM 103

### Procedura utilizzata
1. `git push` su GitHub — tutti i sorgenti aggiornati
2. `rsync` dist frontend e backend dalla Mac → VM
3. `git pull` sulla VM
4. `docker commit` per aggiornare immagine senza rebuild completo
5. Ripristino database dal backup locale (24 dicembre 2025)
6. Copia file uploads nella directory del container

### Problema risolto: `nanoid` mancante
Il modulo `nanoid` mancava nelle dipendenze di produzione nell'immagine Docker. Risolto con `docker commit` dopo installazione manuale.

### Problema risolto: `start:prod:skip-migrations`
Il `docker-compose.yml` della VM aveva `command: ${START_COMMAND:-npm run start:prod:skip-migrations}` che sovrascriveva il CMD. Corretto a `command: node dist/server.js`.

### Problema risolto: path uploads
`express.static` usava `../../uploads` (→ `/uploads` inesistente). Corretto a `../uploads` (→ `/app/uploads`).

---

## ✅ STATO FINALE VM 103

| Servizio | Stato |
|---|---|
| `assistenza-backend` | ✅ Up, Healthy |
| `assistenza-database` | ✅ Up, Healthy |
| `assistenza-redis` | ✅ Up, Healthy |
| `assistenza-frontend` | ✅ Up (unhealthy = falso allarme, nginx funziona) |

### Test superati
- ✅ `http://192.168.0.203/` — HTTP 200
- ✅ `http://192.168.0.203:3210/health` — `{status: ok}`
- ✅ Login `admin@assistenza.it / password123` — SUPER_ADMIN
- ✅ Login `staff@assistenza.it / password123` — ADMIN
- ✅ Logo `/uploads/site_logo_url-*.png` — HTTP 200
- ✅ API public settings — dati corretti

---

## 📝 NOTE

- Il `docker-compose.yml` sulla VM è una versione personalizzata (porte diverse: 5434, 6382, 3210) — NON sovrascrivere con quello del repository
- I `dist/` frontend e backend non sono in git (`.gitignore`) — vanno sempre copiati via rsync dopo ogni build
- Per futuri deploy: `npm run build` sul Mac → `rsync dist/` → `docker commit` sulla VM
