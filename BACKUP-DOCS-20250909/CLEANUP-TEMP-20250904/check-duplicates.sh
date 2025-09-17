#!/bin/bash

echo "🔍 ANALISI DUPLICATI SCHEMA PRISMA"
echo "==================================="

cd backend

echo "Cerco modelli duplicati nello schema..."
echo ""

# Cerca tutti i model NotificationChannel
echo "📌 NotificationChannel trovati alle righe:"
grep -n "model NotificationChannel" prisma/schema.prisma

echo ""
echo "📌 NotificationTemplate trovati alle righe:"
grep -n "model NotificationTemplate" prisma/schema.prisma

echo ""
echo "📌 NotificationLog trovati alle righe:"
grep -n "model NotificationLog" prisma/schema.prisma

echo ""
echo "==================================="
echo "Totale righe nel file schema.prisma:"
wc -l prisma/schema.prisma

echo ""
echo "Per vedere il contesto intorno ai duplicati:"
echo "Righe 910-920 (primo NotificationChannel):"
sed -n '910,920p' prisma/schema.prisma

echo ""
echo "Righe 960-970 (primo NotificationTemplate):"
sed -n '960,970p' prisma/schema.prisma
