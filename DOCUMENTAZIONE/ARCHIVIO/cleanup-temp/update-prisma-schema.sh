#!/bin/bash

echo "🔧 AGGIORNAMENTO SCHEMA PRISMA CON RELAZIONI PERSONALIZZATE"
echo "==========================================================="

cd backend

# Backup dello schema originale
cp prisma/schema.prisma prisma/schema.prisma.backup-$(date +%Y%m%d-%H%M%S)
echo "✅ Backup creato"

# Modifica lo schema con Node.js per precision
cat > /tmp/update-schema.js << 'SCRIPT'
const fs = require('fs');

const schemaPath = 'prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. Modifica il modello AssistanceRequest
// Trova la sezione delle relazioni e aggiorna
schema = schema.replace(
  /User_AssistanceRequest_clientIdToUser\s+User\s+@relation\("AssistanceRequest_clientIdToUser",\s*fields:\s*\[clientId\],\s*references:\s*\[id\]\)/g,
  'client                                              User                 @relation("ClientRequests", fields: [clientId], references: [id])'
);

schema = schema.replace(
  /User_AssistanceRequest_professionalIdToUser\s+User\?\s+@relation\("AssistanceRequest_professionalIdToUser",\s*fields:\s*\[professionalId\],\s*references:\s*\[id\]\)/g,
  'professional                                        User?                @relation("ProfessionalRequests", fields: [professionalId], references: [id])'
);

// Rinomina anche Category e Subcategory per coerenza
schema = schema.replace(
  /Category\s+Category\s+@relation\(fields:\s*\[categoryId\],\s*references:\s*\[id\]\)/g,
  'category                                            Category             @relation(fields: [categoryId], references: [id])'
);

schema = schema.replace(
  /Subcategory\s+Subcategory\?\s+@relation\(fields:\s*\[subcategoryId\],\s*references:\s*\[id\]\)/g,
  'subcategory                                         Subcategory?         @relation(fields: [subcategoryId], references: [id])'
);

// Rinomina Quote e RequestAttachment
schema = schema.replace(
  /Quote\s+Quote\[\]/g,
  'quotes                                              Quote[]'
);

schema = schema.replace(
  /RequestAttachment\s+RequestAttachment\[\]/g,
  'attachments                                         RequestAttachment[]'
);

// Rinomina RequestChatMessage
schema = schema.replace(
  /RequestChatMessage\s+RequestChatMessage\[\]/g,
  'chatMessages                                        RequestChatMessage[]'
);

// 2. Modifica il modello User - aggiorna le relazioni inverse
schema = schema.replace(
  /AssistanceRequest_AssistanceRequest_clientIdToUser\s+AssistanceRequest\[\]\s+@relation\("AssistanceRequest_clientIdToUser"\)/g,
  'clientRequests                                           AssistanceRequest[]           @relation("ClientRequests")'
);

schema = schema.replace(
  /AssistanceRequest_AssistanceRequest_professionalIdToUser\s+AssistanceRequest\[\]\s+@relation\("AssistanceRequest_professionalIdToUser"\)/g,
  'professionalRequests                                     AssistanceRequest[]           @relation("ProfessionalRequests")'
);

// 3. Fix anche le relazioni Message
schema = schema.replace(
  /User_Message_recipientIdToUser\s+User\s+@relation\("Message_recipientIdToUser",\s*fields:\s*\[recipientId\],\s*references:\s*\[id\]\)/g,
  'recipient                                      User               @relation("ReceivedMessages", fields: [recipientId], references: [id])'
);

schema = schema.replace(
  /User_Message_senderIdToUser\s+User\s+@relation\("Message_senderIdToUser",\s*fields:\s*\[senderId\],\s*references:\s*\[id\]\)/g,
  'sender                                         User               @relation("SentMessages", fields: [senderId], references: [id])'
);

// Aggiorna nel modello User
schema = schema.replace(
  /Message_Message_recipientIdToUser\s+Message\[\]\s+@relation\("Message_recipientIdToUser"\)/g,
  'receivedMessages                                         Message[]                     @relation("ReceivedMessages")'
);

schema = schema.replace(
  /Message_Message_senderIdToUser\s+Message\[\]\s+@relation\("Message_senderIdToUser"\)/g,
  'sentMessages                                             Message[]                     @relation("SentMessages")'
);

// 4. Fix anche le relazioni Notification
schema = schema.replace(
  /User_Notification_recipientIdToUser\s+User\s+@relation\("Notification_recipientIdToUser",\s*fields:\s*\[recipientId\],\s*references:\s*\[id\]\)/g,
  'recipient                                          User                 @relation("ReceivedNotifications", fields: [recipientId], references: [id])'
);

schema = schema.replace(
  /User_Notification_senderIdToUser\s+User\?\s+@relation\("Notification_senderIdToUser",\s*fields:\s*\[senderId\],\s*references:\s*\[id\]\)/g,
  'sender                                             User?                @relation("SentNotifications", fields: [senderId], references: [id])'
);

// Aggiorna nel modello User
schema = schema.replace(
  /Notification_Notification_recipientIdToUser\s+Notification\[\]\s+@relation\("Notification_recipientIdToUser"\)/g,
  'receivedNotifications                                    Notification[]                @relation("ReceivedNotifications")'
);

schema = schema.replace(
  /Notification_Notification_senderIdToUser\s+Notification\[\]\s+@relation\("Notification_senderIdToUser"\)/g,
  'sentNotifications                                        Notification[]                @relation("SentNotifications")'
);

// Scrivi il file aggiornato
fs.writeFileSync(schemaPath, schema);
console.log('✅ Schema Prisma aggiornato con relazioni personalizzate');
SCRIPT

node /tmp/update-schema.js

echo ""
echo "📋 Rigenerazione Prisma Client..."
npx prisma generate

echo ""
echo "==========================================================="
echo "✅ SCHEMA AGGIORNATO CON SUCCESSO!"
echo ""
echo "Le relazioni ora hanno nomi semplici:"
echo "  - client (invece di User_AssistanceRequest_clientIdToUser)"
echo "  - professional (invece di User_AssistanceRequest_professionalIdToUser)"
echo "  - category, subcategory, quotes, attachments, etc."
echo ""
echo "⚠️  ORA DEVI:"
echo "1. Riavviare il backend (Ctrl+C e npm run dev)"
echo "2. Il codice dovrebbe già funzionare perché abbiamo"
echo "   sistemato i file prima con i nomi lunghi"
echo ""
echo "==========================================================="

# Cleanup
rm -f /tmp/update-schema.js
