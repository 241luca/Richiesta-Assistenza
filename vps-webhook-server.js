/**
 * Webhook Server per Evolution API
 * Da deployare sul VPS insieme a Evolution API
 * Salva in: webhook-server.js sul VPS
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3201; // Porta diversa da Evolution (8080)

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Store per QR codes
const qrCodeStore = new Map();

// Webhook endpoint
app.post('/api/whatsapp/webhook/:instance', (req, res) => {
  const { instance } = req.params;
  const event = req.body;
  
  console.log(`[${new Date().toISOString()}] Webhook for ${instance}:`, event.event);
  
  // Gestisci eventi
  switch (event.event) {
    case 'qrcode.updated':
    case 'QRCODE_UPDATED':
      if (event.qrcode || event.base64) {
        const qrData = event.base64 || event.qrcode?.base64 || event.qrcode;
        qrCodeStore.set(instance, {
          qrcode: qrData,
          timestamp: new Date()
        });
        console.log(`QR saved for ${instance}`);
      }
      break;
      
    case 'connection.update':
    case 'CONNECTION_UPDATE':
      console.log(`Connection update for ${instance}:`, event.state || event.data?.state);
      break;
      
    case 'messages.upsert':
    case 'MESSAGES_UPSERT':
      console.log(`New message in ${instance}`);
      // Qui puoi inviare al backend principale se necessario
      break;
  }
  
  res.status(200).json({ success: true });
});

// Endpoint per recuperare QR
app.get('/api/whatsapp/qrcode/:instance', (req, res) => {
  const { instance } = req.params;
  const qrData = qrCodeStore.get(instance);
  
  if (!qrData) {
    return res.status(404).json({ error: 'QR not found' });
  }
  
  // Controlla età (5 minuti max)
  const age = Date.now() - qrData.timestamp.getTime();
  if (age > 5 * 60 * 1000) {
    qrCodeStore.delete(instance);
    return res.status(404).json({ error: 'QR expired' });
  }
  
  res.json({ qrcode: qrData.qrcode });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', qrCodes: qrCodeStore.size });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Webhook server running on http://0.0.0.0:${PORT}`);
  console.log(`Ready to receive webhooks from Evolution API`);
});
