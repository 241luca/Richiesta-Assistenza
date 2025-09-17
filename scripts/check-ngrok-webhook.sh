#!/bin/bash

echo "🔍 Verifica stato Ngrok e Webhook"
echo "=================================="
echo ""

# Controlla se ngrok è in esecuzione
if pgrep -x "ngrok" > /dev/null; then
    echo "✅ Ngrok è in esecuzione"
    echo ""
    echo "📡 Per vedere l'URL attuale di ngrok:"
    echo "   Apri: http://localhost:4040"
    echo "   O controlla il terminale dove hai avviato ngrok"
else
    echo "❌ Ngrok NON è in esecuzione!"
    echo ""
    echo "📌 Per avviarlo:"
    echo "   ngrok http 3200"
fi

echo ""
echo "🔧 Verifica configurazione webhook nel database:"

# Recupera URL webhook dal database
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Crea script temporaneo per verificare
cat > /tmp/check-webhook.ts << 'EOF'
import { prisma } from './src/config/database';

async function checkWebhook() {
  const apiKey = await prisma.apiKey.findUnique({
    where: { service: 'whatsapp' }
  });
  
  const config = apiKey?.permissions as any;
  console.log('\n📡 Webhook URL salvato nel database:');
  console.log('  ', config?.webhookUrl || 'NON CONFIGURATO');
  
  if (config?.webhookUrl) {
    console.log('\n⚠️  VERIFICA:');
    console.log('   1. Questo URL è ancora valido?');
    console.log('   2. Ngrok ha lo stesso URL?');
    console.log('   3. È configurato su SendApp?');
  }
  
  process.exit(0);
}

checkWebhook().catch(console.error);
EOF

npx ts-node /tmp/check-webhook.ts

echo ""
echo "📌 COSA FARE ORA:"
echo "=================="
echo ""
echo "1. VERIFICA NGROK:"
echo "   - Se l'URL è cambiato, prendi quello nuovo"
echo "   - Esempio: https://nuovoid.ngrok-free.app"
echo ""
echo "2. AGGIORNA SU SENDAPP:"
echo "   - Vai su https://app.sendapp.cloud"
echo "   - Trova la tua istanza"
echo "   - Aggiorna il Webhook URL con:"
echo "     https://[tuo-ngrok-url]/api/whatsapp/webhook"
echo ""
echo "3. AGGIORNA NEL NOSTRO SISTEMA:"
echo "   - Usa lo script per aggiornare il webhook"
echo ""
echo "4. TEST:"
echo "   - Invia un messaggio al tuo numero WhatsApp"
echo "   - Dovrebbe apparire nella dashboard!"
