#!/bin/bash

# Script per creare la tabella KnowledgeBase e aggiornare il backend

echo "📦 Creating KnowledgeBase table migration..."

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Generate Prisma client con le nuove tabelle
echo "1️⃣ Generating Prisma Client..."
npx prisma generate

# Push del nuovo schema al database
echo "2️⃣ Pushing schema changes to database..."
npx prisma db push --skip-generate

echo "✅ Database updated successfully!"
echo ""
echo "📝 La tabella KnowledgeBase ora include:"
echo "   - id, professionalId, subcategoryId"
echo "   - fileName, originalName, filePath"
echo "   - fileType, fileSize, description"
echo "   - targetAudience, uploadedBy"
echo "   - isProcessed, processedAt"
echo "   - embeddings, metadata"
echo "   - createdAt, updatedAt"
echo ""
echo "🚀 Riavvia il backend per utilizzare la nuova tabella:"
echo "   cd backend"
echo "   npm run dev"