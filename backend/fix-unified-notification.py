#!/usr/bin/env python3
"""
Fix automatico unified-notification-center.service.ts
Data: 09/10/2025
"""

import re

file_path = 'src/services/unified-notification-center.service.ts'

print(f"📝 Fixing {file_path}...")

# Leggi il file
with open(file_path, 'r') as f:
    content = f.read()

# Fix 1: userId -> recipientId nelle query Prisma
content = content.replace('userId: payload.userId', 'recipientId: payload.userId')
content = content.replace('const where: Prisma.NotificationWhereInput = { userId };', 
                          'const where: Prisma.NotificationWhereInput = { recipientId: userId };')

# Fix 2: Metadata type
content = re.sub(
    r'metadata: payload\.metadata \|\| \{\},',
    'metadata: (payload.metadata || {}) as Prisma.InputJsonValue,',
    content
)

# Fix 3: Rimuovi campo status (non esiste nel model)
content = re.sub(
    r"status: results\.every\(\(r\) => r\.success\) \? 'SENT' : 'PARTIAL',\n\s+",
    '',
    content
)

# Fix 4: deliveryStatus type
content = re.sub(
    r'deliveryStatus: results as Prisma\.InputJsonValue,',
    'deliveryStatus: JSON.parse(JSON.stringify(results)),',
    content
)

# Fix 5: auditService.log -> Non esiste, commentare per ora
content = re.sub(
    r'await auditService\.log\({',
    '// TODO: Fix auditService\n      // await auditService.log({',
    content
)

# Fix 6: Commenta prisma.notificationDelivery (tabella non ancora creata)
content = re.sub(
    r'await prisma\.notificationDelivery\.create\({',
    '// TODO: Uncomment after running prisma db push\n        // await prisma.notificationDelivery.create({',
    content
)

# Fix 7: prisma.userNotificationPreferences -> notificationPreference
content = content.replace(
    'await prisma.userNotificationPreferences.upsert',
    'await prisma.notificationPreference.upsert'
)

# Fix 8: Commenta pushSubscription
content = re.sub(
    r'await prisma\.pushSubscription\.updateMany\({',
    '// TODO: Uncomment after running prisma db push\n    // await prisma.pushSubscription.updateMany({',
    content
)

# Fix 9: notificationPreferences -> notificationPreference (singolare)
content = content.replace(
    'notificationPreferences: true,',
    'notificationPreference: true,'
)
content = content.replace(
    'user.notificationPreferences',
    'user.notificationPreference'
)

# Fix 10: Commenta scheduledNotification
content = re.sub(
    r'await prisma\.scheduledNotification\.create\({',
    '// TODO: Uncomment after running prisma db push\n    // await prisma.scheduledNotification.create({',
    content
)

# Fix 11: emailBody -> htmlContent
content = content.replace('template.emailBody', 'template.htmlContent')

# Fix 12: deliveries non esiste
content = re.sub(
    r'deliveries: true,',
    '// deliveries: true, // TODO: Add after DB update',
    content
)

# Salva il file modificato
with open(file_path, 'w') as f:
    f.write(content)

print(f"✅ {file_path} fixed!")
print("\n⚠️ NOTE:")
print("   - Alcuni metodi commentati con TODO")
print("   - Dopo 'npx prisma db push', decommentare i TODO")
print("   - AuditService.log() non esiste - verificare API corretta")
