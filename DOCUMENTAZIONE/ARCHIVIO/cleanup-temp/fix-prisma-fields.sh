#!/bin/bash

echo "🔧 FIX NOMI CAMPI PRISMA"
echo "========================"
echo ""

# Correggi il service per usare i nomi corretti dei campi database
sed -i '' 's/fileSize/file_size/g' backend/src/services/simple-backup.service.ts
sed -i '' 's/createdAt/created_at/g' backend/src/services/simple-backup.service.ts
sed -i '' 's/createdBy/created_by/g' backend/src/services/simple-backup.service.ts

echo "✅ Nomi campi corretti nel service"
echo ""

# Mostra le modifiche
echo "Verifica modifiche:"
grep -n "file_size\|created_at\|created_by" backend/src/services/simple-backup.service.ts | head -10

echo ""
echo "========================"
echo "✅ CORREZIONE COMPLETATA!"
echo ""
echo "Il backend dovrebbe riavviarsi automaticamente."
echo "Ora prova di nuovo a fare un backup!"
