#!/bin/bash

echo "TEST REALE DEL PROBLEMA"
echo "========================"
echo ""

# Invia un webhook di test IDENTICO a quello che manda SendApp
curl -X POST http://localhost:3200/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "instance_id": "68C67956807C8",
    "data": {
      "event": "messages.upsert",
      "data": {
        "messages": [
          {
            "key": {
              "remoteJid": "393420035610@s.whatsapp.net",
              "fromMe": false,
              "id": "TEST123"
            },
            "messageTimestamp": 1757882482,
            "pushName": "Test",
            "message": {
              "conversation": "Test messaggio"
            }
          }
        ],
        "type": "notify"
      }
    }
  }'

echo ""
echo "CONTROLLA I LOG DEL BACKEND!"
echo "Se NON vedi niente, il webhook non funziona"
echo "Se vedi i log ma non salva, c'è un errore nel salvataggio"
