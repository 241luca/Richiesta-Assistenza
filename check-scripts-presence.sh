#!/bin/bash

echo "📁 Verifica presenza script nella cartella /scripts..."
echo "=================================================="

SCRIPTS_DIR="/Users/lucamambelli/Desktop/Richiesta-Assistenza/scripts"

echo -e "\n📋 Script principali in $SCRIPTS_DIR:"
ls -la "$SCRIPTS_DIR"/*.sh 2>/dev/null | head -20

echo -e "\n📋 Script health-checks in $SCRIPTS_DIR/health-checks/shell:"
ls -la "$SCRIPTS_DIR/health-checks/shell"/*.sh 2>/dev/null

echo -e "\n✅ Script trovati che dovrebbero apparire nel Manager:"
echo "- audit-system-check.sh: $([ -f "$SCRIPTS_DIR/audit-system-check.sh" ] && echo "✅ PRESENTE" || echo "❌ MANCANTE")"
echo "- pre-commit-check.sh: $([ -f "$SCRIPTS_DIR/pre-commit-check.sh" ] && echo "✅ PRESENTE" || echo "❌ MANCANTE")"
echo "- validate-work.sh: $([ -f "$SCRIPTS_DIR/validate-work.sh" ] && echo "✅ PRESENTE" || echo "❌ MANCANTE")"
echo "- claude-help.sh: $([ -f "$SCRIPTS_DIR/claude-help.sh" ] && echo "✅ PRESENTE" || echo "❌ MANCANTE")"
echo "- backup-all.sh: $([ -f "$SCRIPTS_DIR/backup-all.sh" ] && echo "✅ PRESENTE" || echo "❌ MANCANTE")"

echo -e "\n🔧 Rendo eseguibili tutti gli script..."
chmod +x "$SCRIPTS_DIR"/*.sh 2>/dev/null
chmod +x "$SCRIPTS_DIR"/health-checks/shell/*.sh 2>/dev/null

echo -e "\n✅ Verifica completata!"
