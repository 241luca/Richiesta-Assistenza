#!/bin/bash

# Backup dello schema prima delle modifiche
cp backend/prisma/schema.prisma backend/prisma/schema.backup-$(date +%Y%m%d-%H%M%S).prisma

echo "✅ Backup creato"
