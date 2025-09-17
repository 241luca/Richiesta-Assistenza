#!/bin/bash
# Backup schema prima di modifiche
cp backend/prisma/schema.prisma backend/prisma/schema.backup-$(date +%Y%m%d-%H%M%S).prisma
echo "✅ Backup schema creato"
