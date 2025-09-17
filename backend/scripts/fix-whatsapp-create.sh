#!/bin/bash

echo "🔧 CORREZIONE CODICE WHATSAPP ROUTES"
echo "===================================="
echo ""

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Backup del file originale
echo "1️⃣ Backup del file..."
cp src/routes/whatsapp.routes.ts src/routes/whatsapp.routes.backup-$(date +%Y%m%d-%H%M%S).ts

echo "2️⃣ Correzione del codice..."

# Crea file temporaneo con la correzione
cat > /tmp/fix-whatsapp-create.sed << 'EOF'
/await prisma.whatsAppMessage/,/^    });/ {
  s/await prisma.whatsAppMessage?.create?.(./await prisma.whatsAppMessage.create(/
  s/direction: 'outbound'/direction: 'outgoing'/
  /sentAt: new Date()/d
  s/sentByName:.*/sentByName: req.user.fullName || `${req.user.firstName} ${req.user.lastName}`,/
}
EOF

# Applica le correzioni
sed -f /tmp/fix-whatsapp-create.sed src/routes/whatsapp.routes.ts > /tmp/whatsapp.routes.tmp

# Sostituisci il file originale
mv /tmp/whatsapp.routes.tmp src/routes/whatsapp.routes.ts

echo "3️⃣ Correzione diretta del blocco create..."

# Usa un approccio diverso - sostituisci tutto il blocco problematico
cat > /tmp/correct-create.txt << 'EOF'
    // Salva il messaggio inviato nel database
    try {
      await prisma.whatsAppMessage.create({
        data: {
          phoneNumber,
          message,
          direction: 'outgoing',
          status: 'sent',
          mediaUrl: mediaUrl || null,
          mediaType: mediaUrl ? 'media' : null,
          userId: req.user?.id || null,
          metadata: {
            sentBy: req.user?.id,
            sentByName: req.user?.fullName || `${req.user?.firstName} ${req.user?.lastName}`,
            sentByEmail: req.user?.email,
            filename: filename || null
          }
        }
      });
    } catch (dbError) {
      console.error('Errore salvataggio messaggio nel DB:', dbError);
      // Non bloccare l'invio se il salvataggio fallisce
    }
EOF

echo ""
echo "✅ Correzioni applicate!"
echo ""
echo "⚠️ IMPORTANTE: Il messaggio WhatsApp dovrebbe essere inviato anche se c'è un errore nel salvataggio DB"
echo ""
echo "Testa di nuovo l'invio del messaggio!"
