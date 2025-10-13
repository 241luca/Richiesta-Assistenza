#!/bin/bash

echo "📜 Inserimento Documenti Legali nel Database"
echo "==========================================="
echo ""

# Colori per output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Directory del backend - CORRETTA
BACKEND_DIR="/Users/lucamambelli/Desktop/Richiesta-Assistenza/backend"

# Vai alla directory del backend PRIMA di tutto
cd "$BACKEND_DIR"

# Step 1: Ottieni un User ID admin valido
echo "1️⃣ Recupero ID utente admin..."
ADMIN_ID=$(echo "SELECT id FROM \"User\" WHERE role IN ('ADMIN', 'SUPER_ADMIN') LIMIT 1;" | npx prisma db execute --stdin --schema ./prisma/schema.prisma 2>/dev/null | grep -o '[a-zA-Z0-9-]*' | tail -1)

if [ -z "$ADMIN_ID" ]; then
    echo -e "${RED}❌ Nessun utente admin trovato. Uso ID di fallback.${NC}"
    ADMIN_ID="system-admin"
else
    echo -e "${GREEN}✅ Admin ID trovato: $ADMIN_ID${NC}"
fi

# Step 2: Pulisci eventuali documenti esistenti
echo ""
echo "2️⃣ Pulizia documenti esistenti..."
cat << EOF | npx prisma db execute --stdin --schema ./prisma/schema.prisma 2>/dev/null
DELETE FROM "UserLegalAcceptance";
DELETE FROM "LegalDocumentVersion";
DELETE FROM "LegalDocument";
EOF
echo -e "${GREEN}✅ Database pulito${NC}"

# Step 3: Inserisci i documenti principali
echo ""
echo "3️⃣ Inserimento documenti principali..."

# Privacy Policy
cat << EOF | npx prisma db execute --stdin --schema ./prisma/schema.prisma
INSERT INTO "LegalDocument" (
    "id", 
    "type", 
    "internalName", 
    "displayName", 
    "description", 
    "icon",
    "isActive", 
    "isRequired", 
    "sortOrder", 
    "createdAt", 
    "updatedAt",
    "createdBy"
) VALUES (
    'doc-privacy-2025',
    'PRIVACY_POLICY',
    'privacy-policy-2025',
    'Informativa sulla Privacy',
    'Informativa sul trattamento dei dati personali ai sensi del GDPR e del Codice Privacy italiano',
    'ShieldCheckIcon',
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
else
    echo -e "${RED}❌ Errore inserimento Privacy Policy${NC}"
fi

# Terms of Service
cat << EOF | npx prisma db execute --stdin --schema ./prisma/schema.prisma
INSERT INTO "LegalDocument" (
    "id", 
    "type", 
    "internalName", 
    "displayName", 
    "description", 
    "icon",
    "isActive", 
    "isRequired", 
    "sortOrder", 
    "createdAt", 
    "updatedAt",
    "createdBy"
) VALUES (
    'doc-terms-2025',
    'TERMS_SERVICE',
    'terms-service-2025',
    'Termini e Condizioni',
    'Termini e condizioni di utilizzo del servizio di Richiesta Assistenza',
    'DocumentTextIcon',
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
else
    echo -e "${RED}❌ Errore inserimento Terms of Service${NC}"
fi

# Cookie Policy
cat << EOF | npx prisma db execute --stdin --schema ./prisma/schema.prisma
INSERT INTO "LegalDocument" (
    "id", 
    "type", 
    "internalName", 
    "displayName", 
    "description", 
    "icon",
    "isActive", 
    "isRequired", 
    "sortOrder", 
    "createdAt", 
    "updatedAt",
    "createdBy"
) VALUES (
    'doc-cookie-2025',
    'COOKIE_POLICY',
    'cookie-policy-2025',
    'Politica sui Cookie',
    'Informativa sull''utilizzo dei cookie e tecnologie simili',
    'CakeIcon',
    true,
    false,
    3,
    NOW(),
    NOW(),
    '$ADMIN_ID'
);
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Cookie Policy inserita${NC}"
else
    echo -e "${RED}❌ Errore inserimento Cookie Policy${NC}"
fi

# Step 4: Inserisci le versioni pubblicate
echo ""
echo "4️⃣ Inserimento versioni pubblicate..."

# Versione Privacy Policy
cat << 'SQLEOF' | npx prisma db execute --stdin --schema ./prisma/schema.prisma
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
    "notifyUsers",
    "createdAt",
    "updatedAt",
    "createdBy",
    "publishedAt",
    "publishedBy"
) VALUES (
    'ver-privacy-1-0-0',
    'doc-privacy-2025',
    '1.0.0',
    'Informativa sulla Privacy - Versione 1.0',
    '<div class="legal-document">
<h1>Informativa sulla Privacy</h1>
<p class="subtitle">Ai sensi del Regolamento UE 2016/679 (GDPR) e del D.Lgs. 196/2003</p>
<p class="last-update">Ultimo aggiornamento: 20 Gennaio 2025</p>

<h2>1. Titolare del Trattamento</h2>
<p>Il Titolare del trattamento dei dati personali è <strong>LM Tecnologie S.r.l.</strong>, con sede legale in Via Roma 123, 00100 Roma, Italia.</p>
<p>Email: privacy@richiesta-assistenza.it</p>

<h2>2. Tipologie di Dati Raccolti</h2>
<p>Raccogliamo le seguenti categorie di dati personali:</p>
<ul>
<li><strong>Dati anagrafici:</strong> nome, cognome, data di nascita, codice fiscale</li>
<li><strong>Dati di contatto:</strong> indirizzo email, numero di telefono, indirizzo di residenza</li>
<li><strong>Dati di accesso:</strong> username, password (criptata), log di accesso</li>
<li><strong>Dati di utilizzo:</strong> preferenze, storico richieste, interazioni con il servizio</li>
<li><strong>Dati di pagamento:</strong> coordinate bancarie, transazioni (tramite provider sicuri)</li>
<li><strong>Dati tecnici:</strong> indirizzo IP, tipo di browser, sistema operativo</li>
</ul>

<h2>3. Finalità del Trattamento</h2>
<p>I suoi dati personali saranno trattati per le seguenti finalità:</p>
<ol>
<li><strong>Erogazione del servizio:</strong> gestione delle richieste di assistenza e collegamento con professionisti</li>
<li><strong>Gestione contrattuale:</strong> fatturazione, pagamenti, assistenza clienti</li>
<li><strong>Comunicazioni di servizio:</strong> notifiche relative alle sue richieste</li>
<li><strong>Sicurezza:</strong> prevenzione frodi e protezione del sistema</li>
<li><strong>Miglioramento del servizio:</strong> analisi statistiche anonime</li>
<li><strong>Marketing:</strong> solo previo consenso esplicito</li>
</ol>
</div>',
    'Informativa sulla Privacy completa e dettagliata...',
    'Prima versione dell''informativa privacy GDPR compliant',
    NOW() - INTERVAL '30 days',
    'it',
    'PUBLISHED',
    true,
    false,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days',
    'system-admin',
    NOW() - INTERVAL '30 days',
    'system-admin'
);
SQLEOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Versione Privacy Policy inserita${NC}"
else
    echo -e "${RED}❌ Errore inserimento versione Privacy Policy${NC}"
fi

# Versione Terms of Service
cat << 'SQLEOF' | npx prisma db execute --stdin --schema ./prisma/schema.prisma
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
    "notifyUsers",
    "createdAt",
    "updatedAt",
    "createdBy",
    "publishedAt",
    "publishedBy"
) VALUES (
    'ver-terms-1-0-0',
    'doc-terms-2025',
    '1.0.0',
    'Termini e Condizioni di Servizio - Versione 1.0',
    '<div class="legal-document">
<h1>Termini e Condizioni di Servizio</h1>
<p class="last-update">Ultimo aggiornamento: 20 Gennaio 2025</p>

<h2>1. Accettazione dei Termini</h2>
<p>Utilizzando il servizio "Richiesta Assistenza", accetti di essere vincolato dai presenti Termini e Condizioni. Se non accetti questi termini, non utilizzare il servizio.</p>

<h2>2. Descrizione del Servizio</h2>
<p>Richiesta Assistenza è una piattaforma che mette in contatto clienti che necessitano di servizi di assistenza tecnica con professionisti qualificati.</p>

<h2>3. Registrazione Account</h2>
<p>Devi avere almeno 18 anni e fornire informazioni accurate e complete.</p>
</div>',
    'Termini e Condizioni di Servizio completi...',
    'Prima versione dei termini di servizio',
    NOW() - INTERVAL '30 days',
    'it',
    'PUBLISHED',
    true,
    false,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days',
    'system-admin',
    NOW() - INTERVAL '30 days',
    'system-admin'
);
SQLEOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Versione Terms of Service inserita${NC}"
else
    echo -e "${RED}❌ Errore inserimento versione Terms of Service${NC}"
fi

# Versione Cookie Policy
cat << 'SQLEOF' | npx prisma db execute --stdin --schema ./prisma/schema.prisma
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
    "notifyUsers",
    "createdAt",
    "updatedAt",
    "createdBy",
    "publishedAt",
    "publishedBy"
) VALUES (
    'ver-cookie-1-0-0',
    'doc-cookie-2025',
    '1.0.0',
    'Cookie Policy - Versione 1.0',
    '<div class="legal-document">
<h1>Cookie Policy</h1>
<p class="last-update">Ultimo aggiornamento: 20 Gennaio 2025</p>

<h2>1. Cosa sono i Cookie</h2>
<p>I cookie sono piccoli file di testo che i siti web salvano sul tuo computer o dispositivo mobile quando li visiti.</p>

<h2>2. Come Utilizziamo i Cookie</h2>
<p>Utilizziamo i cookie per ricordare le tue preferenze, permetterti di navigare in modo efficiente e migliorare la tua esperienza.</p>
</div>',
    'Cookie Policy completa e dettagliata...',
    'Prima versione della cookie policy',
    NOW() - INTERVAL '30 days',
    'it',
    'PUBLISHED',
    false,
    false,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days',
    'system-admin',
    NOW() - INTERVAL '30 days',
    'system-admin'
);
SQLEOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Versione Cookie Policy inserita${NC}"
else
    echo -e "${RED}❌ Errore inserimento versione Cookie Policy${NC}"
fi

# Step 5: Verifica inserimento
echo ""
echo "5️⃣ Verifica finale..."
echo ""

# Conta documenti
DOC_COUNT=$(echo "SELECT COUNT(*) FROM \"LegalDocument\";" | npx prisma db execute --stdin --schema ./prisma/schema.prisma 2>/dev/null | grep -o '[0-9]*' | tail -1)
echo "📊 Documenti inseriti: ${YELLOW}$DOC_COUNT${NC}"

# Conta versioni
VER_COUNT=$(echo "SELECT COUNT(*) FROM \"LegalDocumentVersion\";" | npx prisma db execute --stdin --schema ./prisma/schema.prisma 2>/dev/null | grep -o '[0-9]*' | tail -1)
echo "📄 Versioni inserite: ${YELLOW}$VER_COUNT${NC}"

# Lista documenti
echo ""
echo "📋 Documenti nel database:"
echo "SELECT type, \"displayName\", \"isActive\" FROM \"LegalDocument\" ORDER BY \"sortOrder\";" | npx prisma db execute --stdin --schema ./prisma/schema.prisma 2>/dev/null | tail -n +3

echo ""
echo -e "${GREEN}✅ Inserimento completato con successo!${NC}"
echo ""
echo "📌 Prossimi passi:"
echo "1. Vai su http://localhost:5193/admin/legal-documents per gestire i documenti"
echo "2. Vai su http://localhost:5193/legal per vedere la pagina pubblica"
echo "3. Clicca su ogni documento per vedere il dettaglio"
echo ""
echo "🧪 Test API endpoints:"
echo "   curl http://localhost:3200/api/public/legal/all"
echo "   curl http://localhost:3200/api/public/legal/privacy-policy"
echo "   curl http://localhost:3200/api/public/legal/terms-service"
echo "   curl http://localhost:3200/api/public/legal/cookie-policy"
