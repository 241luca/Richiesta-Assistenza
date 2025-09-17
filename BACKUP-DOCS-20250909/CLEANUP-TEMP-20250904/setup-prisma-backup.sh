#!/bin/bash

echo "🔧 AGGIUNTA MODELLO BACKUP A PRISMA"
echo "===================================="
echo ""

echo "1️⃣ Aggiunta del modello Backup al file schema.prisma..."

# Aggiungi il modello alla fine del file schema.prisma
cat >> backend/prisma/schema.prisma << 'EOF'

// Sistema Backup
model Backup {
  id        String   @id @default(uuid())
  type      String   @db.VarChar(20)
  filename  String   @db.VarChar(255)
  filepath  String   @db.VarChar(500)
  fileSize  BigInt   @map("file_size")
  createdAt DateTime @default(now()) @map("created_at")
  createdBy String?  @map("created_by") @db.VarChar(100)

  @@map("backups")
  @@index([type])
  @@index([createdAt])
}
EOF

echo "✅ Modello aggiunto"
echo ""

echo "2️⃣ Generazione client Prisma..."
cd backend
npx prisma generate

echo ""
echo "3️⃣ Push dello schema al database..."
npx prisma db push --skip-generate

echo ""
echo "===================================="
echo "✅ PRISMA CONFIGURATO!"
echo ""
echo "Ora il sistema backup dovrebbe funzionare."
echo "Riavvia il backend se necessario e prova di nuovo!"
