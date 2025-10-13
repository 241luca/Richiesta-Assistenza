#!/bin/bash

echo "🔄 Generando Prisma Client con nuovi modelli..."

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Trova il path di node
NODE_PATH=$(which node)
NPX_PATH=$(which npx)

echo "Node path: $NODE_PATH"
echo "NPX path: $NPX_PATH"

# Genera il Prisma client
$NPX_PATH prisma generate

echo "✅ Prisma Client generato!"

# Applica lo schema al database
echo "🔄 Applicando schema al database..."
$NPX_PATH prisma db push --skip-generate

echo "✅ Schema database aggiornato!"
echo "🚀 Ora riavvia il backend per caricare i nuovi modelli"
