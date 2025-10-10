#!/usr/bin/env python3
"""
Script per aggiungere tabelle e campi mancanti allo schema Prisma
Data: 09/10/2025
"""

import re

# Leggi lo schema originale
with open('prisma/schema.prisma', 'r') as f:
    schema = f.read()

print("✅ Schema caricato")

# 1. FIX: Aggiorna enum ComplaintStatus
print("\n📝 1. Aggiornamento ComplaintStatus...")
old_complaint_enum = r'''enum ComplaintStatus {
  DRAFT       // Bozza
  SUBMITTED   // Inviato
  IN_REVIEW   // In revisione
  RESOLVED    // Risolto
  REJECTED    // Respinto
  CLOSED      // Chiuso
}'''

new_complaint_enum = '''enum ComplaintStatus {
  DRAFT       // Bozza
  SUBMITTED   // Inviato
  SENDING     // In invio (PEC)
  SENT        // Inviato (PEC)
  IN_REVIEW   // In revisione
  RESOLVED    // Risolto
  REJECTED    // Respinto
  CLOSED      // Chiuso
}'''

if old_complaint_enum in schema:
    schema = schema.replace(old_complaint_enum, new_complaint_enum)
    print("   ✅ ComplaintStatus aggiornato con SENDING e SENT")
else:
    print("   ⚠️ Pattern ComplaintStatus non trovato esattamente - skip")

# 2. FIX: Aggiungi campi a Notification
print("\n📝 2. Aggiornamento model Notification...")

# Trova il model Notification e aggiungi campi prima della sezione relazioni
notification_pattern = r'(model Notification \{[^}]+)(  recipient   User)'

notification_additions = '''  userId      String?      // Alias compatibilità (= recipientId)
  status      String?      // PENDING, SENT, FAILED, PARTIAL  
  sentAt      DateTime?    // Timestamp invio
  deliveryStatus Json?     // Stato per canale
  
'''

schema = re.sub(notification_pattern, r'\1' + notification_additions + r'\2', schema)
print("   ✅ Campi aggiunti a Notification")

# 3. AGGIUNGI: Nuove tabelle alla fine dello schema
print("\n📝 3. Aggiunta nuove tabelle...")

new_tables = '''
// ==========================================
// TABELLE NOTIFICHE AVANZATE - FIX 09/10/2025
// ==========================================

// Tracciamento consegne notifiche
model NotificationDelivery {
  id             String   @id @default(cuid())
  notificationId String
  channel        String   // EMAIL, SMS, WHATSAPP, PUSH
  status         String   // PENDING, SENT, DELIVERED, FAILED
  messageId      String?  // ID messaggio provider
  deliveredAt    DateTime?
  failedAt       DateTime?
  error          String?  @db.Text
  attempts       Int      @default(0)
  metadata       Json?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@index([notificationId])
  @@index([channel])
  @@index([status])
}

// Sottoscrizioni Push Web
model PushSubscription {
  id             String   @id @default(cuid())
  userId         String
  endpoint       String   @db.Text
  keys           Json     // p256dh e auth
  deviceType     String?  // mobile, desktop, tablet
  deviceName     String?
  browser        String?
  isActive       Boolean  @default(true)
  lastUsedAt     DateTime?
  unsubscribedAt DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@index([userId])
  @@index([isActive])
}

// Notifiche programmate
model ScheduledNotification {
  id           String   @id @default(cuid())
  userId       String
  type         String
  priority     String   @default("NORMAL")
  title        String
  message      String   @db.Text
  data         Json?
  channels     String[] @default([])
  scheduledAt  DateTime
  processedAt  DateTime?
  status       String   @default("SCHEDULED")
  attempts     Int      @default(0)
  error        String?  @db.Text
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@index([userId])
  @@index([scheduledAt])
  @@index([status])
}

// Storia abilitazioni moduli
model ModuleHistory {
  id         String       @id @default(cuid())
  moduleCode String
  action     ModuleAction
  userId     String
  referralId String?
  metadata   Json?
  createdAt  DateTime     @default(now())
  
  user     User      @relation(fields: [userId], references: [id])
  referral Referral? @relation(fields: [referralId], references: [id])
  
  @@index([moduleCode])
  @@index([action])
  @@index([userId])
  @@index([createdAt])
}
'''

# Aggiungi le nuove tabelle alla fine (prima dell'ultimo '}' o alla fine)
schema = schema.rstrip() + '\n' + new_tables + '\n'

print("   ✅ 4 nuove tabelle aggiunte")

# Salva lo schema modificato
with open('prisma/schema.prisma', 'w') as f:
    f.write(schema)

print("\n✅ Schema aggiornato con successo!")
print("\n📋 PROSSIMI STEP:")
print("   1. npx prisma format")
print("   2. npx prisma generate")
print("   3. npx prisma db push")
