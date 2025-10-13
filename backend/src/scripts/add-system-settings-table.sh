#!/bin/bash

echo "🔧 Aggiunta tabella SystemSettings allo schema Prisma..."

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Script Python per aggiungere la tabella SystemSettings
cat << 'EOF' > /tmp/add_system_settings_table.py
import re

with open('prisma/schema.prisma', 'r') as f:
    content = f.read()

# Controlla se la tabella esiste già
if 'model SystemSettings' in content:
    print("✅ La tabella SystemSettings esiste già")
    exit(0)

# Trova dove inserire la nuova tabella (prima della fine del file)
# Aggiungiamola alla fine, prima dell'ultimo }
new_table = '''
// System Settings - Impostazioni di sistema configurabili
model SystemSettings {
  id          String   @id @default(cuid())
  key         String   @unique  // Chiave univoca dell'impostazione
  value       String             // Valore dell'impostazione
  type        String   @default("string") // Tipo: string, number, boolean, json, text, url, email
  category    String             // Categoria per raggruppamento
  description String?            // Descrizione dell'impostazione
  isActive    Boolean  @default(true)
  isEditable  Boolean  @default(true) // Se false, solo SUPER_ADMIN può modificare
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([category])
  @@index([isActive])
}
'''

# Aggiungi la tabella alla fine dello schema
content = content.rstrip() + '\n' + new_table + '\n'

# Salva il file
with open('prisma/schema.prisma', 'w') as f:
    f.write(content)

print("✅ Aggiunta tabella SystemSettings allo schema")
EOF

echo "1️⃣ Eseguendo script Python..."
python3 /tmp/add_system_settings_table.py

echo ""
echo "2️⃣ Formattando lo schema..."
npx prisma format

echo ""
echo "3️⃣ Generando Prisma Client..."
npx prisma generate

echo ""
echo "4️⃣ Pushing al database..."
npx prisma db push --skip-generate

echo ""
echo "✅ Tabella SystemSettings creata con successo!"
echo ""
echo "Riavvia il backend con:"
echo "  cd backend"
echo "  npm run dev"
