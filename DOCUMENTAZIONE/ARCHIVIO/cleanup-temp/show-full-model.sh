#!/bin/bash

echo "🔍 VEDIAMO IL MODELLO COMPLETO"
echo "=============================="

cd backend

echo "Modello AssistanceRequest COMPLETO (righe 72-110):"
echo "------------------------------------------------"
sed -n '72,110p' prisma/schema.prisma

echo ""
echo "=============================="
echo "Se manca ancora parte, dimmi e vediamo più righe"
