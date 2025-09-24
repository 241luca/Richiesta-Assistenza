#!/bin/bash

echo "📜 Caricamento Documenti Legali dai File HTML Salvati"
echo "====================================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Directory con i file HTML
HTML_DIR="/Users/lucamambelli/Desktop/Richiesta-Assistenza/documenti-legali-finali"

# Verifica che i file esistano
echo "1️⃣ Verifica file HTML..."

if [ ! -f "$HTML_DIR/PRIVACY-POLICY-COMPLETA.html" ]; then
    echo -e "${RED}❌ File PRIVACY-POLICY-COMPLETA.html non trovato!${NC}"
    exit 1
fi

if [ ! -f "$HTML_DIR/TERMINI-SERVIZIO-COMPLETO.html" ]; then
    echo -e "${RED}❌ File TERMINI-SERVIZIO-COMPLETO.html non trovato!${NC}"
    exit 1
fi

if [ ! -f "$HTML_DIR/COOKIE-POLICY-COMPLETO.html" ]; then
    echo -e "${RED}❌ File COOKIE-POLICY-COMPLETO.html non trovato!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Tutti i file HTML trovati${NC}"
echo ""

# Recupera admin ID
echo "2️⃣ Recupero ID Admin..."
ADMIN_ID=$(psql assistenza_db -t -c "SELECT id FROM \"User\" WHERE email = 'admin@assistenza.it';" | xargs)

if [ -z "$ADMIN_ID" ]; then
    echo -e "${YELLOW}⚠️ Admin non trovato, uso fallback${NC}"
    ADMIN_ID="system-admin"
else
    echo -e "${GREEN}✅ Admin ID: $ADMIN_ID${NC}"
fi

# Pulisci documenti esistenti
echo ""
echo "3️⃣ Pulizia documenti esistenti..."
psql assistenza_db << EOF
DELETE FROM "UserLegalAcceptance";
DELETE FROM "LegalDocumentVersion";
DELETE FROM "LegalDocument";
EOF
echo -e "${GREEN}✅ Database pulito${NC}"

# Inserisci i documenti principali
echo ""
echo "4️⃣ Inserimento documenti principali..."

psql assistenza_db << EOF
-- Privacy Policy
INSERT INTO "LegalDocument" (
    "id", "type", "internalName", "displayName", "description", 
    "isActive", "isRequired", "sortOrder", "createdAt", "updatedAt", "createdBy"
) VALUES (
    'doc-privacy-2025', 'PRIVACY_POLICY', 'privacy-policy-2025',
    'Informativa sulla Privacy', 
    'Informativa sul trattamento dei dati personali ai sensi del GDPR',
    true, true, 1, NOW(), NOW(), '$ADMIN_ID'
);

-- Terms of Service
INSERT INTO "LegalDocument" (
    "id", "type", "internalName", "displayName", "description",
    "isActive", "isRequired", "sortOrder", "createdAt", "updatedAt", "createdBy"
) VALUES (
    'doc-terms-2025', 'TERMS_SERVICE', 'terms-service-2025',
    'Termini e Condizioni di Servizio',
    'Termini e condizioni di utilizzo della piattaforma',
    true, true, 2, NOW(), NOW(), '$ADMIN_ID'
);

-- Cookie Policy
INSERT INTO "LegalDocument" (
    "id", "type", "internalName", "displayName", "description",
    "isActive", "isRequired", "sortOrder", "createdAt", "updatedAt", "createdBy"
) VALUES (
    'doc-cookie-2025', 'COOKIE_POLICY', 'cookie-policy-2025',
    'Cookie Policy',
    'Informativa utilizzo cookie e tecnologie simili',
    true, false, 3, NOW(), NOW(), '$ADMIN_ID'
);
EOF

echo -e "${GREEN}✅ Documenti principali inseriti${NC}"

# Inserisci le versioni con contenuto dai file HTML
echo ""
echo "5️⃣ Inserimento versioni con contenuto HTML completo dai file..."

# Privacy Policy
echo "Caricamento Privacy Policy..."
PRIVACY_CONTENT=$(cat "$HTML_DIR/PRIVACY-POLICY-COMPLETA.html" | sed "s/'/''/g")

psql assistenza_db << EOF
INSERT INTO "LegalDocumentVersion" (
    "id", "documentId", "version", "title",
    "content",
    "contentPlain",
    "summary", "effectiveDate", "language", "status",
    "requiresAccept", "createdAt", "updatedAt", "createdBy"
) VALUES (
    'ver-privacy-1', 'doc-privacy-2025', '1.0.0',
    'Informativa sulla Privacy v1.0',
    '$PRIVACY_CONTENT',
    'Informativa sulla Privacy e Protezione dei Dati Personali. Titolare: LM Tecnologie S.r.l. Raccogliamo dati anagrafici, di contatto, professionali e di utilizzo per fornire i nostri servizi. Base giuridica: esecuzione contratto, obbligo legale, consenso. Diritti: accesso, rettifica, cancellazione, portabilità, opposizione. DPO: dpo@richiesta-assistenza.it',
    'Informativa privacy GDPR compliant completa',
    '2025-01-01', 'it', 'PUBLISHED', true,
    NOW(), NOW(), '$ADMIN_ID'
);
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Privacy Policy caricata${NC}"
else
    echo -e "${RED}❌ Errore caricamento Privacy Policy${NC}"
fi

# Terms of Service
echo "Caricamento Terms of Service..."
TERMS_CONTENT=$(cat "$HTML_DIR/TERMINI-SERVIZIO-COMPLETO.html" | sed "s/'/''/g")

psql assistenza_db << EOF
INSERT INTO "LegalDocumentVersion" (
    "id", "documentId", "version", "title",
    "content",
    "contentPlain",
    "summary", "effectiveDate", "language", "status",
    "requiresAccept", "createdAt", "updatedAt", "createdBy"
) VALUES (
    'ver-terms-1', 'doc-terms-2025', '1.0.0',
    'Termini e Condizioni v1.0',
    '$TERMS_CONTENT',
    'Termini e Condizioni di Servizio. Piattaforma di intermediazione per servizi tecnici. Registrazione: 18+ anni, dati veritieri. Commissioni: 15% standard. Pagamenti via Stripe. Responsabilità limitata. Foro competente: Roma.',
    'Termini di servizio completi della piattaforma',
    '2025-01-01', 'it', 'PUBLISHED', true,
    NOW(), NOW(), '$ADMIN_ID'
);
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Terms of Service caricati${NC}"
else
    echo -e "${RED}❌ Errore caricamento Terms of Service${NC}"
fi

# Cookie Policy
echo "Caricamento Cookie Policy..."
COOKIE_CONTENT=$(cat "$HTML_DIR/COOKIE-POLICY-COMPLETO.html" | sed "s/'/''/g")

psql assistenza_db << EOF
INSERT INTO "LegalDocumentVersion" (
    "id", "documentId", "version", "title",
    "content",
    "contentPlain",
    "summary", "effectiveDate", "language", "status",
    "requiresAccept", "createdAt", "updatedAt", "createdBy"
) VALUES (
    'ver-cookie-1', 'doc-cookie-2025', '1.0.0',
    'Cookie Policy v1.0',
    '$COOKIE_CONTENT',
    'Cookie Policy. Utilizziamo cookie tecnici, funzionali, analitici e di marketing. Cookie necessari per autenticazione e sicurezza. Cookie analitici via Google Analytics. Gestione preferenze disponibile. Contatti: privacy@richiesta-assistenza.it',
    'Policy completa utilizzo cookie',
    '2025-01-01', 'it', 'PUBLISHED', false,
    NOW(), NOW(), '$ADMIN_ID'
);
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Cookie Policy caricata${NC}"
else
    echo -e "${RED}❌ Errore caricamento Cookie Policy${NC}"
fi

# Verifica finale
echo ""
echo "6️⃣ Verifica finale..."

DOC_COUNT=$(psql assistenza_db -t -c "SELECT COUNT(*) FROM \"LegalDocument\";" | xargs)
VER_COUNT=$(psql assistenza_db -t -c "SELECT COUNT(*) FROM \"LegalDocumentVersion\";" | xargs)

echo -e "📊 Documenti inseriti: ${YELLOW}${DOC_COUNT}${NC}"
echo -e "📄 Versioni inserite: ${YELLOW}${VER_COUNT}${NC}"

echo ""
echo "📋 Documenti nel database:"
psql assistenza_db -c "SELECT type, \"displayName\" FROM \"LegalDocument\" ORDER BY \"sortOrder\";"

echo ""
echo -e "${GREEN}🎉 CARICAMENTO COMPLETATO!${NC}"
echo ""
echo "I documenti legali sono stati caricati con il contenuto COMPLETO dai file HTML salvati!"
echo ""
echo "🔗 Verifica i documenti su:"
echo "   http://localhost:5193/legal/privacy-policy"
echo "   http://localhost:5193/legal/terms-service"
echo "   http://localhost:5193/legal/cookie-policy"
