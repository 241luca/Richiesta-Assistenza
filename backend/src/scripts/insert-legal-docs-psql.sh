#!/bin/bash

echo "📜 Inserimento DIRETTO Documenti Legali con Admin"
echo "=================================================="
echo ""

# Colori per output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Recupera ID dell'admin CORRETTO
echo "1️⃣ Recupero ID Admin (admin@assistenza.it)..."
ADMIN_ID=$(psql assistenza_db -t -c "SELECT id FROM \"User\" WHERE email = 'admin@assistenza.it';" | xargs)

if [ -z "$ADMIN_ID" ]; then
    echo -e "${RED}❌ Admin non trovato!${NC}"
    echo "Provo a cercare qualsiasi utente ADMIN o SUPER_ADMIN..."
    ADMIN_ID=$(psql assistenza_db -t -c "SELECT id FROM \"User\" WHERE role IN ('ADMIN', 'SUPER_ADMIN') LIMIT 1;" | xargs)
    
    if [ -z "$ADMIN_ID" ]; then
        echo -e "${RED}❌ Nessun admin trovato nel database!${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Admin ID trovato: $ADMIN_ID${NC}"

# Pulisci documenti esistenti
echo ""
echo "2️⃣ Pulizia documenti esistenti..."
psql assistenza_db << EOF
DELETE FROM "UserLegalAcceptance";
DELETE FROM "LegalDocumentVersion";
DELETE FROM "LegalDocument";
EOF
echo -e "${GREEN}✅ Database pulito${NC}"

# Inserisci i documenti
echo ""
echo "3️⃣ Inserimento documenti principali..."

# Privacy Policy
psql assistenza_db << EOF
INSERT INTO "LegalDocument" (
    "id", 
    "type", 
    "internalName", 
    "displayName", 
    "description", 
    "isActive", 
    "isRequired", 
    "requiresAcceptance",
    "sortOrder", 
    "createdAt", 
    "updatedAt",
    "createdBy"
) VALUES (
    'doc-privacy-2025',
    'PRIVACY_POLICY',
    'privacy-policy-2025',
    'Informativa sulla Privacy',
    'Informativa sul trattamento dei dati personali ai sensi del GDPR',
    true,
    true,
    true,
    1,
    NOW(),
    NOW(),
    '$ADMIN_ID'
);
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Privacy Policy inserita${NC}"
fi

# Terms of Service
psql assistenza_db << EOF
INSERT INTO "LegalDocument" (
    "id", 
    "type", 
    "internalName", 
    "displayName", 
    "description", 
    "isActive", 
    "isRequired", 
    "requiresAcceptance",
    "sortOrder", 
    "createdAt", 
    "updatedAt",
    "createdBy"
) VALUES (
    'doc-terms-2025',
    'TERMS_SERVICE',
    'terms-service-2025',
    'Termini e Condizioni',
    'Termini e condizioni di utilizzo del servizio',
    true,
    true,
    true,
    2,
    NOW(),
    NOW(),
    '$ADMIN_ID'
);
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Terms of Service inseriti${NC}"
fi

# Cookie Policy
psql assistenza_db << EOF
INSERT INTO "LegalDocument" (
    "id", 
    "type", 
    "internalName", 
    "displayName", 
    "description", 
    "isActive", 
    "isRequired",
    "requiresAcceptance", 
    "sortOrder", 
    "createdAt", 
    "updatedAt",
    "createdBy"
) VALUES (
    'doc-cookie-2025',
    'COOKIE_POLICY',
    'cookie-policy-2025',
    'Cookie Policy',
    'Informativa utilizzo cookie',
    true,
    true,
    true,
    3,
    NOW(),
    NOW(),
    '$ADMIN_ID'
);
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Cookie Policy inserita${NC}"
fi

# Inserisci le versioni
echo ""
echo "4️⃣ Inserimento versioni documenti..."

# Privacy Policy Version
psql assistenza_db << 'EOF'
INSERT INTO "LegalDocumentVersion" (
    "id",
    "documentId",
    "version",
    "title",
    "content",
    "contentPlain",
    "summary",
    "effectiveDate",
    "language",
    "status",
    "requiresAccept",
    "createdAt",
    "updatedAt"
) VALUES (
    'ver-privacy-1',
    'doc-privacy-2025',
    '1.0.0',
    'Informativa sulla Privacy v1.0',
    '<h1>Informativa sulla Privacy</h1><p>Informativa completa GDPR...</p>',
    'Informativa sulla Privacy testo semplice',
    'Informativa privacy GDPR compliant',
    '2025-01-01',
    'it',
    'PUBLISHED',
    true,
    NOW(),
    NOW()
);
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Versione Privacy Policy inserita${NC}"
fi

# Terms Version
psql assistenza_db << 'EOF'
INSERT INTO "LegalDocumentVersion" (
    "id",
    "documentId",
    "version",
    "title",
    "content",
    "contentPlain",
    "summary",
    "effectiveDate",
    "language",
    "status",
    "requiresAccept",
    "createdAt",
    "updatedAt"
) VALUES (
    'ver-terms-1',
    'doc-terms-2025',
    '1.0.0',
    'Termini e Condizioni v1.0',
    '<h1>Termini e Condizioni</h1><p>Termini completi del servizio...</p>',
    'Termini e Condizioni testo semplice',
    'Termini di servizio',
    '2025-01-01',
    'it',
    'PUBLISHED',
    true,
    NOW(),
    NOW()
);
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Versione Terms inserita${NC}"
fi

# Cookie Version
psql assistenza_db << 'EOF'
INSERT INTO "LegalDocumentVersion" (
    "id",
    "documentId",
    "version",
    "title",
    "content",
    "contentPlain",
    "summary",
    "effectiveDate",
    "language",
    "status",
    "requiresAccept",
    "createdAt",
    "updatedAt"
) VALUES (
    'ver-cookie-1',
    'doc-cookie-2025',
    '1.0.0',
    'Cookie Policy v1.0',
    '<h1>Cookie Policy</h1><p>Informativa cookie...</p>',
    'Cookie Policy testo semplice',
    'Policy sui cookie',
    '2025-01-01',
    'it',
    'PUBLISHED',
    false,
    NOW(),
    NOW()
);
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Versione Cookie Policy inserita${NC}"
fi

# Verifica finale
echo ""
echo "5️⃣ Verifica finale..."
echo ""

DOC_COUNT=$(psql assistenza_db -t -c "SELECT COUNT(*) FROM \"LegalDocument\";" | xargs)
echo "📊 Documenti inseriti: ${YELLOW}$DOC_COUNT${NC}"

VER_COUNT=$(psql assistenza_db -t -c "SELECT COUNT(*) FROM \"LegalDocumentVersion\";" | xargs)
echo "📄 Versioni inserite: ${YELLOW}$VER_COUNT${NC}"

echo ""
echo "📋 Documenti nel database:"
psql assistenza_db -c "SELECT type, \"displayName\", \"isActive\" FROM \"LegalDocument\" ORDER BY \"sortOrder\";"

echo ""
echo -e "${GREEN}✅ Inserimento completato!${NC}"
echo ""
echo "🔗 Link per verificare:"
echo "   Admin: http://localhost:5193/admin/legal-documents"
echo "   Pubblici: http://localhost:5193/legal"
