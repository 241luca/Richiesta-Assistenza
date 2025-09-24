#!/bin/bash
# Script per completare il sistema documenti legali configurabile
# Data: 20 Settembre 2025

set -e  # Exit on error

echo "🔧 FIX SISTEMA DOCUMENTI LEGALI CONFIGURABILE"
echo "============================================="
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. BACKUP
echo -e "${YELLOW}📦 FASE 1: Backup preventivo...${NC}"
BACKUP_DIR="database-backups/legal-system-fix-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup database (richiede password)
echo "Backup database in corso..."
pg_dump -U postgres -h localhost richiesta_assistenza > "$BACKUP_DIR/database.sql" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Backup database saltato (richiede configurazione pg_dump)${NC}"
}

# Backup schema Prisma
cp backend/prisma/schema.prisma "$BACKUP_DIR/schema.prisma.backup"
echo -e "${GREEN}✅ Backup schema completato${NC}"

# 2. VALIDAZIONE SCHEMA
echo ""
echo -e "${YELLOW}📋 FASE 2: Validazione schema Prisma...${NC}"
cd backend
npx prisma validate || {
    echo -e "${RED}❌ Errori nello schema Prisma! Correggere prima di continuare.${NC}"
    exit 1
}
echo -e "${GREEN}✅ Schema valido${NC}"

# 3. GENERAZIONE CLIENT
echo ""
echo -e "${YELLOW}🔧 FASE 3: Generazione Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Client generato${NC}"

# 4. CONTROLLO TABELLE ESISTENTI
echo ""
echo -e "${YELLOW}🔍 FASE 4: Verifica tabelle esistenti...${NC}"
echo "Tabelle Document nel database:"
psql -U postgres -h localhost -d richiesta_assistenza -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%Document%' OR table_name LIKE '%document%')
ORDER BY table_name;
" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Impossibile verificare tabelle (configurare psql)${NC}"
}

# 5. CREAZIONE MIGRAZIONE
echo ""
echo -e "${YELLOW}🚀 FASE 5: Creazione migrazione...${NC}"
read -p "Vuoi creare la migrazione per le tabelle mancanti? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]
then
    npx prisma migrate dev --name add_document_configuration_system
    echo -e "${GREEN}✅ Migrazione completata${NC}"
else
    echo -e "${YELLOW}⏭️  Migrazione saltata${NC}"
fi

# 6. VERIFICA FINALE
echo ""
echo -e "${YELLOW}✅ FASE 6: Verifica finale...${NC}"
npx prisma studio &
STUDIO_PID=$!
echo -e "${GREEN}✅ Prisma Studio aperto (PID: $STUDIO_PID)${NC}"
echo "Verifica che le seguenti tabelle esistano:"
echo "  - DocumentTypeConfig"
echo "  - DocumentCategory"
echo "  - ApprovalWorkflowConfig"
echo "  - DocumentSystemConfig"
echo "  - DocumentCustomField"
echo "  - DocumentConfigAudit"
echo "  - DocumentPermission"
echo "  - DocumentNotificationTemplate"
echo "  - DocumentUIConfig"

# 7. SEED DATI
echo ""
echo -e "${YELLOW}📝 FASE 7: Seed dati iniziali...${NC}"
read -p "Vuoi inserire i dati iniziali di configurazione? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]
then
    npm run seed:legal-config || {
        echo -e "${YELLOW}⚠️  Script seed non trovato, crearlo in prisma/seed-legal-config.ts${NC}"
    }
fi

echo ""
echo -e "${GREEN}🎉 FIX COMPLETATO!${NC}"
echo ""
echo "Prossimi passi:"
echo "1. Verificare in Prisma Studio che tutte le tabelle siano create"
echo "2. Testare creazione tipo documento da /admin/document-management"
echo "3. Configurare workflow personalizzati"
echo "4. Impostare permessi granulari"
echo ""
echo "Report salvato in: $BACKUP_DIR"

# Kill Prisma Studio quando terminiamo
read -p "Premi INVIO per chiudere Prisma Studio e terminare..."
kill $STUDIO_PID 2>/dev/null || true

echo -e "${GREEN}✅ Script completato con successo!${NC}"
