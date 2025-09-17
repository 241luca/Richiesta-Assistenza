#!/bin/bash

echo "🔧 FIX MANUALE RELAZIONI MANCANTI"
echo "================================="

cd backend

echo "1. Backup schema:"
cp prisma/schema.prisma prisma/schema.prisma.backup-relations

echo "2. Aggiungo relazioni mancanti:"

# Fix relazioni mancanti con script Node.js
cat > /tmp/fix-relations.js << 'SCRIPT'
const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. Fix User model - aggiungi relazione per UserNotificationPreference
if (!schema.includes('userNotificationPreferences')) {
  schema = schema.replace(
    'UserNotificationPreference   UserNotificationPreference[]',
    'userNotificationPreferences   UserNotificationPreference[] @relation("UserNotificationPreferences")'
  );
  console.log('✅ Aggiunta relazione userNotificationPreferences in User');
}

// 2. Fix NotificationTemplate - aggiungi relazione per NotificationType
if (!schema.includes('notificationType') && schema.includes('model NotificationTemplate')) {
  // Trova NotificationTemplate e aggiungi campo
  schema = schema.replace(
    /model NotificationTemplate {([^}]+)}/,
    (match, content) => {
      if (!content.includes('notificationType')) {
        return `model NotificationTemplate {${content}  notificationType NotificationType? @relation(fields: [notificationTypeId], references: [id])
  notificationTypeId String?
}`;
      }
      return match;
    }
  );
  console.log('✅ Aggiunta relazione notificationType in NotificationTemplate');
}

// 3. Fix NotificationChannel - aggiungi relazione per UserNotificationPreference
if (!schema.includes('userPreferences') && schema.includes('model NotificationChannel')) {
  schema = schema.replace(
    /model NotificationChannel {([^}]+)}/,
    (match, content) => {
      if (!content.includes('userPreferences')) {
        return `model NotificationChannel {${content}  userPreferences UserNotificationPreference[]
}`;
      }
      return match;
    }
  );
  console.log('✅ Aggiunta relazione userPreferences in NotificationChannel');
}

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Schema aggiornato');
SCRIPT

node /tmp/fix-relations.js

echo ""
echo "3. Formattazione schema:"
npx prisma format

echo ""
echo "4. Generazione Prisma Client:"
npx prisma generate

echo ""
echo "5. TEST FINALE:"
echo "--------------"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    const test1 = await prisma.assistanceRequest.findFirst({
      include: {
        client: true,
        professional: true,
        category: true
      }
    })
    console.log('✅✅✅ SUCCESSO! I nomi sono: client, professional, category')
    return true
  } catch (e) {
    console.log('❌ Errore:', e.message)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

test()
EOF

rm -f /tmp/fix-relations.js

echo ""
echo "================================="
