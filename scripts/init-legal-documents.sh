#!/bin/bash

echo "📜 Inserimento documenti legali iniziali..."
echo ""

# Ottieni il token di autenticazione (dovrai adattare questo con le tue credenziali)
TOKEN="il-tuo-token-jwt"

# API URL
API_URL="http://localhost:3200/api/admin/legal-documents"

# Crea Privacy Policy
echo "1. Creazione Privacy Policy..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "PRIVACY_POLICY",
    "internalName": "privacy-policy-2025",
    "displayName": "Informativa sulla Privacy",
    "description": "Informativa sul trattamento dei dati personali ai sensi del GDPR",
    "icon": "ShieldCheckIcon",
    "isRequired": true,
    "sortOrder": 1
  }'

echo ""
echo ""

# Crea Terms of Service
echo "2. Creazione Termini di Servizio..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "TERMS_SERVICE", 
    "internalName": "terms-service-2025",
    "displayName": "Termini e Condizioni",
    "description": "Termini e condizioni di utilizzo del servizio",
    "icon": "DocumentTextIcon",
    "isRequired": true,
    "sortOrder": 2
  }'

echo ""
echo ""

# Crea Cookie Policy
echo "3. Creazione Cookie Policy..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "COOKIE_POLICY",
    "internalName": "cookie-policy-2025",
    "displayName": "Politica sui Cookie",
    "description": "Informativa sull'\''utilizzo dei cookie e tecnologie simili",
    "icon": "CakeIcon",
    "isRequired": false,
    "sortOrder": 3
  }'

echo ""
echo ""
echo "✅ Documenti legali creati con successo!"
echo ""
echo "📋 Prossimi passi:"
echo "1. Vai su http://localhost:5193/admin/legal-documents"
echo "2. Clicca su ogni documento"
echo "3. Crea una versione con il contenuto"
echo "4. Approva e pubblica la versione"
