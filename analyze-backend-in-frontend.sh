#!/bin/bash

# 🔍 SCRIPT ANALISI FILE BACKEND NEL FRONTEND
# Cerca pattern problematici nei file TypeScript

echo "🔍 ANALISI COMPLETA FILE BACKEND NEL FRONTEND"
echo "=============================================="
echo ""

SERVICES_DIR="/Users/lucamambelli/Desktop/Richiesta-Assistenza/src/services"
PROBLEMATIC_FILES=()

# Pattern da cercare
PATTERNS=(
  "@prisma/client"
  "PrismaClient"
  "import.*express"
  "import.*pdfkit"
  "import.*nodemailer"
  "import.*crypto.*from.*['\"]crypto['\"]"
  "import.*fs"
  "import.*path.*from.*['\"]path['\"]"
  "process\.env\."
)

echo "📁 Directory: $SERVICES_DIR"
echo "🔎 Cerco i seguenti pattern problematici:"
for pattern in "${PATTERNS[@]}"; do
  echo "   - $pattern"
done
echo ""
echo "=============================================="
echo ""

# Funzione per analizzare un file
analyze_file() {
  local file="$1"
  local basename=$(basename "$file")
  
  # Salta file di backup
  if [[ "$basename" == *".backup"* ]] || [[ "$basename" == *".OLD"* ]] || [[ "$basename" == *".ELIMINATO"* ]]; then
    return
  fi
  
  local has_issues=false
  local issues_found=()
  
  for pattern in "${PATTERNS[@]}"; do
    if grep -q -E "$pattern" "$file" 2>/dev/null; then
      has_issues=true
      local count=$(grep -c -E "$pattern" "$file")
      issues_found+=("$pattern ($count)")
    fi
  done
  
  if [ "$has_issues" = true ]; then
    local rel_path="${file#$SERVICES_DIR/}"
    echo "❌ $rel_path"
    for issue in "${issues_found[@]}"; do
      echo "   - $issue"
    done
    echo ""
    PROBLEMATIC_FILES+=("$rel_path")
  fi
}

# Scansiona tutti i file .ts
while IFS= read -r -d '' file; do
  analyze_file "$file"
done < <(find "$SERVICES_DIR" -name "*.ts" -not -name "*.d.ts" -print0)

echo "=============================================="
echo ""
echo "📊 RIEPILOGO FINALE"
echo ""
echo "🚨 File problematici trovati: ${#PROBLEMATIC_FILES[@]}"
echo ""

if [ ${#PROBLEMATIC_FILES[@]} -gt 0 ]; then
  echo "📝 Lista completa file da sistemare:"
  for file in "${PROBLEMATIC_FILES[@]}"; do
    echo "   - $file"
  done
  echo ""
fi

echo "✅ Analisi completata!"
echo ""
