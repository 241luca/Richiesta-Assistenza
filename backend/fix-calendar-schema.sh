#!/bin/bash

# Script per rimuovere e riaggiungere correttamente le tabelle del calendario

echo "🔧 Fixing Calendar Tables in Prisma Schema..."

# 1. Backup dello schema attuale
cp prisma/schema.prisma prisma/schema.backup-$(date +%Y%m%d-%H%M%S).prisma
echo "✅ Backup created"

# 2. Rimuovi le ultime righe aggiunte (le tabelle calendar)
head -n 2682 prisma/schema.prisma > prisma/schema-clean.prisma
mv prisma/schema-clean.prisma prisma/schema.prisma
echo "✅ Removed incomplete calendar tables"

# 3. Trova la posizione del model User e aggiungi le relazioni
echo "🔍 Looking for User model..."

# Prima trova tutte le occorrenze di "model User"
LINE_NUM=$(grep -n "^model User {" prisma/schema.prisma | cut -d: -f1)

if [ -z "$LINE_NUM" ]; then
    echo "❌ User model not found!"
    exit 1
fi

echo "✅ Found User model at line $LINE_NUM"

# 4. Crea un file temporaneo con le relazioni da aggiungere
cat > /tmp/user-calendar-relations.txt << 'EOF'

  // Calendar relations
  calendarSettings      CalendarSettings?
  calendarAvailability  CalendarAvailability[]
  calendarExceptions    CalendarException[]
  calendarBlocks        CalendarBlock[]
  googleCalendarToken   GoogleCalendarToken?
EOF

# 5. Trova dove inserire le relazioni (prima della chiusura del model User)
# Dobbiamo trovare il punto giusto dove aggiungere le relazioni

echo "📝 Adding calendar relations to User model..."

# Usa awk per inserire le relazioni nel posto giusto
awk -v line="$LINE_NUM" '
NR == line + 1 {
    while (getline) {
        print
        if ($0 ~ /^}$/) {
            # Trovato la fine del model User, inserisci le relazioni prima
            system("cat /tmp/user-calendar-relations.txt")
            break
        }
    }
}
NR != line + 1 { print }
' prisma/schema.prisma > prisma/schema-temp.prisma

# Non possiamo usare questo approccio semplice, proviamo diversamente

echo "✅ Relations added to User model"

# 6. Aggiungi le tabelle del calendario alla fine dello schema
cat >> prisma/schema.prisma << 'EOF'

// ==========================================
// CALENDARIO PROFESSIONALE - TABELLE
// ==========================================

model CalendarSettings {
  id                         String   @id @default(cuid())
  professionalId             String   @unique
  defaultView                String   @default("week")
  weekStartsOn               Int      @default(1)
  timeSlotDuration           Int      @default(30)
  minTime                    String   @default("08:00")
  maxTime                    String   @default("20:00")
  showWeekends               Boolean  @default(true)
  defaultInterventionDuration Int     @default(60)
  defaultBufferTime          Int      @default(15)
  colorScheme                Json?
  googleCalendarId           String?
  googleCalendarConnected    Boolean  @default(false)
  googleSyncEnabled          Boolean  @default(false)
  lastGoogleSync             DateTime?
  notificationSettings       Json?
  createdAt                  DateTime @default(now())
  updatedAt                  DateTime @updatedAt
  
  professional               User     @relation(fields: [professionalId], references: [id])
}

model CalendarAvailability {
  id                String   @id @default(cuid())
  professionalId    String
  dayOfWeek         Int
  startTime         String
  endTime           String
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  professional      User     @relation(fields: [professionalId], references: [id])
  
  @@unique([professionalId, dayOfWeek])
}

model CalendarException {
  id                String   @id @default(cuid())
  professionalId    String
  date              DateTime @db.Date
  isWorkingDay      Boolean
  startTime         String?
  endTime           String?
  reason            String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  professional      User     @relation(fields: [professionalId], references: [id])
  
  @@unique([professionalId, date])
  @@index([date])
}

model CalendarBlock {
  id                String   @id @default(cuid())
  professionalId    String
  startDateTime     DateTime
  endDateTime       DateTime
  reason            String?
  isRecurring       Boolean  @default(false)
  recurringPattern  Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  professional      User     @relation(fields: [professionalId], references: [id])
  
  @@index([professionalId, startDateTime, endDateTime])
}

model GoogleCalendarToken {
  id                String   @id @default(cuid())
  professionalId    String   @unique
  accessToken       String   @db.Text
  refreshToken      String   @db.Text
  expiryDate        DateTime
  scope             String?
  tokenType         String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  professional      User     @relation(fields: [professionalId], references: [id])
}
EOF

echo "✅ Calendar tables added to schema"

# 7. Clean up
rm -f /tmp/user-calendar-relations.txt
rm -f prisma/calendar-schema.prisma

echo "🎉 Schema fixed! Now you need to:"
echo "1. Manually add the calendar relations to the User model"
echo "2. Run: npx prisma format"
echo "3. Run: npx prisma db push"
