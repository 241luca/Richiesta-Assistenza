#!/bin/bash

echo "🔍 VERIFICA @relation NELLO SCHEMA"
echo "==================================="

cd backend

echo "1. Cerco @relation nello schema:"
echo "---------------------------------"
grep "@relation" prisma/schema.prisma | head -20

echo ""
echo "2. Vediamo specificamente il modello AssistanceRequest:"
echo "-------------------------------------------------------"
awk '/^model AssistanceRequest {/,/^}/' prisma/schema.prisma | grep -E "(client|professional|category|@relation)" | head -10

echo ""
echo "3. Vediamo il modello User per le relazioni inverse:"
echo "-----------------------------------------------------"
awk '/^model User {/,/^}/' prisma/schema.prisma | grep -E "AssistanceRequest|@relation" | head -10

echo ""
echo "==================================="
echo "Se NON vedi @relation, significa che lo schema"
echo "è ancora quello originale con i nomi lunghi generati!"
