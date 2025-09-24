import axios from 'axios';
import QRCode from 'qrcode';

async function generateVisualQR() {
  try {
    console.log('🔍 Recupero QR code da Evolution API...');
    
    const evolutionApi = axios.create({
      baseURL: 'http://37.27.89.35:8080',
      headers: {
        'apikey': 'evolution_key_luca_2025_secure_21806'
      }
    });
    
    // Prova a ottenere il QR
    const response = await evolutionApi.get('/instance/connect/assistenza');
    
    if (response.data) {
      // Se c'è già un'immagine base64, usala
      if (response.data.base64) {
        console.log('✅ QR Code già in formato immagine!');
        console.log('\n📱 APRI QUESTO LINK NEL BROWSER:');
        console.log('data:text/html,<html><body style="text-align:center;padding:50px;"><h1>Scansiona con WhatsApp</h1><img src="' + response.data.base64 + '" style="max-width:400px;"/></body></html>');
        return;
      }
      
      // Se c'è solo il codice testuale, convertiamolo in immagine
      const qrText = response.data.code || response.data.qrcode || response.data;
      
      if (qrText && typeof qrText === 'string') {
        console.log('📸 Conversione QR testuale in immagine...');
        
        // Genera immagine QR dal testo
        const qrImageData = await QRCode.toDataURL(qrText, {
          width: 400,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        console.log('✅ QR Code generato come immagine!');
        console.log('\n📱 APRI QUESTO LINK NEL BROWSER:');
        console.log('data:text/html,<html><body style="text-align:center;padding:50px;background:#f3f4f6;"><h1>Scansiona con WhatsApp</h1><img src="' + qrImageData + '" style="max-width:400px;border:10px solid white;border-radius:10px;box-shadow:0 4px 6px rgba(0,0,0,0.1);"/><p style="margin-top:20px;color:#666;">Apri WhatsApp > Impostazioni > Dispositivi collegati > Scansiona</p></body></html>');
        
        // Salva anche il file HTML
        const fs = require('fs');
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>WhatsApp QR Code</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      text-align: center;
      padding: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      max-width: 500px;
    }
    h1 {
      color: #333;
      margin-bottom: 30px;
    }
    img {
      max-width: 100%;
      border-radius: 10px;
    }
    .instructions {
      margin-top: 30px;
      text-align: left;
      background: #f8f9fa;
      padding: 20px;
      border-radius: 10px;
    }
    .step {
      margin: 10px 0;
      display: flex;
      align-items: center;
    }
    .step-number {
      background: #25D366;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 15px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔗 Connetti WhatsApp</h1>
    <img src="${qrImageData}" alt="WhatsApp QR Code"/>
    <div class="instructions">
      <div class="step">
        <span class="step-number">1</span>
        <span>Apri WhatsApp sul telefono</span>
      </div>
      <div class="step">
        <span class="step-number">2</span>
        <span>Vai su <strong>Impostazioni → Dispositivi collegati</strong></span>
      </div>
      <div class="step">
        <span class="step-number">3</span>
        <span>Tocca <strong>Collega un dispositivo</strong></span>
      </div>
      <div class="step">
        <span class="step-number">4</span>
        <span>Scansiona questo QR code</span>
      </div>
    </div>
  </div>
</body>
</html>`;
        
        const filePath = '/Users/lucamambelli/Desktop/Richiesta-Assistenza/whatsapp-qr.html';
        fs.writeFileSync(filePath, htmlContent);
        console.log('\n💾 File HTML salvato in:', filePath);
        console.log('📂 Puoi aprirlo direttamente con: open', filePath);
      }
    }
    
  } catch (error: any) {
    console.error('❌ Errore:', error.message);
  }
}

generateVisualQR();
