# 📊 REPORT SESSIONE — Fix Hardcoded + Deploy VM 103

**Data**: 18 Aprile 2026  
**Autore**: Claude  
**Versione Sistema**: v6.1.0  
**VM**: 103 — richiesta-assistenza — 192.168.0.203

---

## 🎯 OBIETTIVO

Rimuovere tutti i `localhost` e URL hardcoded dal codice sorgente, correggere i bug segnalati nel documento di deploy, e deployare il tutto sulla VM 103 (Proxmox Z240).

---

## ✅ STATO FINALE VM 103

| Servizio | Porta | Stato |
|---|---|---|
| `assistenza-backend` | 3200:3200 | ✅ Up, Healthy |
| `assistenza-database` | 5434:5432 | ✅ Up, Healthy |
| `assistenza-redis` | 6382:6379 | ✅ Up, Healthy |
| `assistenza-frontend` | 80:80 | ✅ Up, funzionante |

### Credenziali funzionanti
- `admin@assistenza.it / password123` → SUPER_ADMIN ✅
- `staff@assistenza.it / password123` → ADMIN ✅
- `test@test.com / password123` → SUPER_ADMIN ✅

### Test superati
- ✅ `http://192.168.0.203/` — HTTP 200, login funziona
- ✅ `http://192.168.0.203:3200/health` — `{status: ok}`
- ✅ `http://192.168.0.203:3200/api/auth/login` — login OK
- ✅ `http://192.168.0.203/uploads/site_logo_url-*.png` — HTTP 200
- ✅ `http://192.168.0.203/api/public/system-settings/basic` — HTTP 200

---

## 🔧 MODIFICHE AL CODICE SORGENTE (22 file)

### Backend — hardcoded rimossi
| File | Fix |
|---|---|
| `backend/src/server.ts` | CORS dinamico da env; path uploads `../uploads` (era `../../uploads`); rimosso wppConnect non importato |
| `backend/src/server_test.ts` | Rimosso wppConnectService |
| `backend/src/services/healthCheck.service.ts` | URL email usa `FRONTEND_URL` da env |
| `backend/src/services/testRunnerService.ts` | `localhost:3000` → `BACKEND_BASE_URL` da env |
| `backend/src/services/whatsapp-media.service.ts` | Sostituito wppConnectService con throw |
| `backend/src/services/whatsapp-template.service.ts` | Stesso fix |
| `backend/src/scripts/setup-whatsapp.ts` | webhookUrl usa `BACKEND_URL` da env |

### Frontend — hardcoded rimossi
| File | Fix |
|---|---|
| `src/services/api.ts` | Esportata `API_BASE_URL`; rimosso console.log con porta hardcoded |
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
| `Dockerfile.frontend` | Usa dist precompilato, solo Nginx (build da 15min → 30sec) |
| `backend/Dockerfile` | Usa dist precompilato + su-exec + entrypoint (build da 20min → 2min) |
| `backend/docker-entrypoint.sh` | Fix permessi volumi montati (`chown uploads/logs/backups`) |
| `docker-compose.yml` | Healthcheck usa `/health` senza auth |

---

## 🚀 PROCEDURA DEPLOY (per future sessioni)

```bash
# 1. Build sul Mac
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza
npm run build                    # Frontend → dist/
cd backend && npm run build      # Backend → backend/dist/
cd ..

# 2. Copia dist sulla VM
rsync -av -e "ssh -i ~/.ssh/id_ed25519_github" \
  backend/dist/ santrack@100.101.202.35:/home/santrack/richiesta-assistenza/backend/dist/

rsync -av -e "ssh -i ~/.ssh/id_ed25519_github" \
  dist/ santrack@100.101.202.35:/home/santrack/richiesta-assistenza/dist/

# 3. Aggiorna immagine Docker senza rebuild
ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35 "
  cd /home/santrack/richiesta-assistenza
  docker compose stop backend frontend
  docker run -d --name temp_fix richiesta-assistenza-backend sleep 300
  docker cp backend/dist/. temp_fix:/app/dist/
  docker commit temp_fix richiesta-assistenza-backend:latest
  docker rm -f temp_fix
  docker compose up -d
"
```

---

## ⚠️ NOTE IMPORTANTI PER LA VM

- Il `docker-compose.yml` della VM è **personalizzato** (porte diverse) — NON sovrascrivere con quello del repo
- Porte VM: database=5434, redis=6382, backend=**3200** (non 3210!)
- I dist non sono in git → sempre copiare via rsync dopo ogni build
- **CAUSA DEL PROBLEMA "non entra"**: backend era su porta 3210, ma il frontend compilato si aspetta la 3200. Fix: cambiare `3210:3200` → `3200:3200` nel docker-compose.yml della VM
