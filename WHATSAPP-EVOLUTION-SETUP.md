# INTEGRAZIONE WHATSAPP EVOLUTION API v2.3.3
## Ultimo aggiornamento: 22 Settembre 2025

## CONFIGURAZIONE VPS
- **URL Evolution API**: http://37.27.89.35:8080
- **Global API Key**: evolution_key_luca_2025_secure_21806
- **Instance Name**: assistenza
- **Docker Container**: evolution_api
- **Database**: PostgreSQL (evolution_postgres)

## ARCHITETTURA
```
Frontend (localhost:5193)
    ↓ (chiamate API)
Backend (localhost:3200) 
    ↓ (con Global API Key)
Evolution API (37.27.89.35:8080)
```

## ENDPOINT BACKEND
- `GET /api/whatsapp/status` - Verifica stato connessione
- `POST /api/whatsapp/instance/create` - Crea istanza
- `GET /api/whatsapp/qrcode` - Ottiene QR code
- `POST /api/whatsapp/send` - Invia messaggio
- `DELETE /api/whatsapp/instance` - Elimina istanza

## FILE PRINCIPALI
- Backend: `/backend/src/routes/whatsapp.routes.ts`
- Frontend: `/src/pages/admin/WhatsAppAdmin.tsx`
- Component: `/src/components/admin/whatsapp/WhatsAppConnectionEvolutionVPS.tsx`

## COMANDI VPS
```bash
# SSH al VPS
ssh root@37.27.89.35

# Directory Evolution
cd /opt/evolution-api/

# Restart Evolution
docker-compose restart

# Verifica stato
curl http://localhost:8080/
curl -X GET http://localhost:8080/instance/connectionState/assistenza \
  -H "apikey: evolution_key_luca_2025_secure_21806"

# Test invio messaggio
curl -X POST http://localhost:8080/message/sendText/assistenza \
  -H 'Content-Type: application/json' \
  -H 'apikey: evolution_key_luca_2025_secure_21806' \
  -d '{"number": "393403803728", "text": "Test", "delay": 1000}'
```

## PROBLEMI RISOLTI
1. ✅ Aggiornamento Evolution da 2.2.3 a 2.3.3
2. ✅ Configurazione Global API Key corretta
3. ✅ Backend che fa da proxy verso Evolution VPS
4. ✅ Frontend che chiama solo il backend (non Evolution direttamente)

## NOTE IMPORTANTI
- Il frontend NON deve chiamare direttamente Evolution sul VPS
- Tutte le chiamate devono passare attraverso il backend
- La Global API Key è hardcoded nel backend per sicurezza
- L'istanza "assistenza" deve essere creata prima di poter inviare messaggi
