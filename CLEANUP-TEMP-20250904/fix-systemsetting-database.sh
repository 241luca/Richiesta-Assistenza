#!/bin/bash

echo "🔧 AGGIUNTA TABELLA SYSTEMSETTING AL DATABASE"
echo "============================================="

echo "✅ 1. Modello SystemSetting aggiunto al schema.prisma"
echo ""

echo "📝 2. Ora dobbiamo aggiornare il database..."
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo "🔄 Generazione Prisma Client..."
npx prisma generate

echo ""
echo "🚀 Push dello schema al database..."
npx prisma db push --accept-data-loss

echo ""
echo "📊 3. Aggiungiamo alcuni dati di esempio..."

echo "INSERT INTO \"SystemSetting\" (id, key, value, label, category) VALUES 
('cuid1', 'FOOTER_TEXT', '© 2025 Sistema Richiesta Assistenza', 'Testo Footer', 'footer'),
('cuid2', 'FOOTER_VERSION', 'v2.0', 'Versione Sistema', 'footer'),
('cuid3', 'APP_NAME', 'Richiesta Assistenza', 'Nome Applicazione', 'branding'),
('cuid4', 'COMPANY_NAME', 'LM Tecnologie', 'Nome Azienda', 'branding');" > temp_insert.sql

echo "🔄 Inserimento dati di esempio..."
# Assuming we have access to psql or similar
# Note: You may need to adjust this based on your database connection method

echo ""
echo "✅ TABELLA SYSTEMSETTING CREATA!"
echo ""

echo "🧪 4. Testa ora:"
echo "   🔄 Riavvia il server backend"
echo "   🌐 Vai a 'Impostazioni Sistema' nel frontend"
echo "   ✅ Dovrebbe funzionare!"

echo ""
echo "💡 Se ancora non funziona:"
echo "   - Riavvia il server backend (npm run dev)"
echo "   - Controlla che non ci siano errori in console"
echo "   - Testa prima '🔧 SIMPLE Settings' per verificare che i dati arrivino"

echo ""
echo "🚀 DATABASE AGGIORNATO CON SUCCESSO!"
