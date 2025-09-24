#!/bin/bash
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend
echo "Trovare il modello User nel file schema.prisma..."
grep -n "^model User " prisma/schema.prisma
