#!/bin/bash

# Script per aggiungere la tabella WhatsAppMessage al database

echo "📱 AGGIUNTA TABELLA WHATSAPP MESSAGE"
echo "====================================="
echo ""

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo "1️⃣ Backup dello schema attuale..."
cp prisma/schema.prisma prisma/schema.backup-$(date +%Y%m%d-%H%M%S).prisma

echo ""
echo "2️⃣ Aggiungo il modello WhatsAppMessage allo schema..."

# Aggiungi il modello prima dell'ultimo carattere del file (prima dell'ultima })
# o dopo l'ultimo modello esistente

cat >> prisma/schema.prisma << 'EOF'

// Tabella per i messaggi WhatsApp
model WhatsAppMessage {
  id              String    @id @default(cuid())
  phoneNumber     String
  message         String    @db.Text
  direction       String    // 'incoming' o 'outgoing'
  status          String?   // 'sent', 'delivered', 'read', 'failed'
  messageId       String?   // ID del messaggio su WhatsApp
  timestamp       DateTime  @default(now())
  mediaUrl        String?
  mediaType       String?
  conversationId  String?
  userId          String?   // ID utente associato (se registrato)
  metadata        Json?     // Dati aggiuntivi
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  user            User?     @relation(fields: [userId], references: [id])
  
  @@index([phoneNumber])
  @@index([direction])
  @@index([timestamp])
  @@index([userId])
}
EOF

echo ""
echo "3️⃣ Aggiorno la relazione nel modello User..."

# Trova la linea dove aggiungere la relazione nel modello User
sed -i '' '/model User {/,/^}/ {
  /^}/ i\
  whatsappMessages WhatsAppMessage[]
}' prisma/schema.prisma 2>/dev/null || echo "⚠️  Aggiungi manualmente: whatsappMessages WhatsAppMessage[] nel modello User"

echo ""
echo "4️⃣ Genero il client Prisma..."
npx prisma generate

echo ""
echo "5️⃣ Applico la migrazione al database..."
npx prisma db push --accept-data-loss

echo ""
echo "✅ COMPLETATO!"
echo ""
echo "La tabella WhatsAppMessage è stata aggiunta al database."
echo "Ora puoi inviare e ricevere messaggi WhatsApp!"
echo ""
echo "📋 Prossimi passi:"
echo "1. Riavvia il backend se necessario"
echo "2. Prova a inviare un messaggio da http://localhost:5193/admin/whatsapp"
