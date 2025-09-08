#!/bin/bash

echo "🔍 RICERCA COMPLETA DUPLICATI"
echo "=============================="

cd backend

echo "Modelli NotificationChannel:"
grep -n "^model NotificationChannel" prisma/schema.prisma

echo -e "\nModelli NotificationTemplate:"
grep -n "^model NotificationTemplate" prisma/schema.prisma  

echo -e "\nModelli NotificationLog:"
grep -n "^model NotificationLog" prisma/schema.prisma

echo -e "\n=============================="
echo "Se ci sono più di una riga per modello, significa che ci sono duplicati."
echo "Totale righe nel file: $(wc -l < prisma/schema.prisma)"
