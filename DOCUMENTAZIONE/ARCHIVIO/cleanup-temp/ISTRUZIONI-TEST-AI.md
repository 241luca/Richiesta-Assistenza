# 🧪 COME TESTARE IL SISTEMA AI

## 1. VERIFICA CHE IL SERVER SIA ATTIVO
```bash
curl http://localhost:3200/api/public/health
```

## 2. TEST HEALTH CHECK AI
```bash
curl http://localhost:3200/api/ai/health
```

Dovresti vedere:
```json
{
  "success": true,
  "data": {
    "service": "AI Service Professional",
    "status": "operational",
    "hasApiKey": true,
    "connectionTest": true,
    "message": "✅ Servizio AI completamente operativo"
  }
}
```

## 3. TEST CHAT CON AUTENTICAZIONE

### Passo 1: Login per ottenere token
```bash
curl -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "TUA_EMAIL", "password": "TUA_PASSWORD"}'
```

### Passo 2: Usa il token per testare la chat
```bash
curl -X POST http://localhost:3200/api/ai/chat \
  -H "Authorization: Bearer TOKEN_OTTENUTO" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Come funziona il sistema?",
    "conversationType": "system_help"
  }'
```

## 4. TEST NEL FRONTEND

1. Apri http://localhost:5173 (o la porta del frontend)
2. Fai login
3. Cerca il bottone AI (sparkles icon) in basso a destra
4. Clicca e prova la chat

## 5. TIPI DI CONVERSAZIONE

### system_help
Per domande sul sistema:
- "Come creo una richiesta?"
- "Come funzionano i preventivi?"

### client_help  
Per aiuto tecnico clienti:
- "Ho una perdita d'acqua, cosa faccio?"
- "È pericoloso questo problema elettrico?"

### professional_help
Per professionisti:
- "Quali strumenti servono?"
- "Qual è la normativa?"

## 6. CONFIGURAZIONE AVANZATA (ADMIN)

1. Login come admin
2. Vai su Admin → AI Config
3. Seleziona una sottocategoria
4. Personalizza:
   - Modello (GPT-3.5/GPT-4)
   - System prompt
   - Temperatura
   - Token massimi

## TROUBLESHOOTING

### "OpenAI non configurato"
→ Admin → API Keys → AI → Inserisci chiave

### "Authentication required"
→ Devi fare login prima

### "Service not operational"
→ Controlla che la chiave OpenAI sia valida

### Nessuna risposta
→ Controlla i log del backend
