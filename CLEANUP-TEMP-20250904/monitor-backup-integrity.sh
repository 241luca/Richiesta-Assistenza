#!/bin/bash

# SISTEMA DI MONITORAGGIO BACKUP - DA ESEGUIRE REGOLARMENTE
echo "🔍 BACKUP INTEGRITY MONITOR"
echo "==========================="
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contatori
total_db_records=0
total_real_files=0
total_orphan_records=0
total_orphan_files=0

echo "📊 Analisi integrità backup in corso..."
echo ""

# 1. Check record nel database
echo "DATABASE RECORDS:"
echo "-----------------"

response=$(curl -s -X GET http://localhost:3200/api/backup \
  -H "Content-Type: application/json" \
  -b cookies.txt)

# Analizza ogni backup nel database
echo "$response" | jq -r '.backups[] | "\(.id)|\(.name)|\(.type)|\(.status)|\(.filePath)|\(.fileSize)"' | while IFS='|' read -r id name type status filepath size; do
  total_db_records=$((total_db_records + 1))
  
  if [ "$status" == "COMPLETED" ]; then
    if [ -n "$filepath" ] && [ "$filepath" != "null" ]; then
      if [ -f "$filepath" ]; then
        echo -e "${GREEN}✅ OK${NC} - $name ($type) - File exists: $(basename $filepath)"
        total_real_files=$((total_real_files + 1))
      else
        echo -e "${RED}❌ ORPHAN RECORD${NC} - $name ($type) - FILE MISSING: $filepath"
        total_orphan_records=$((total_orphan_records + 1))
      fi
    else
      echo -e "${YELLOW}⚠️ NO PATH${NC} - $name ($type) - No file path recorded"
    fi
  elif [ "$status" == "FAILED" ]; then
    echo -e "${YELLOW}⚠️ FAILED${NC} - $name ($type)"
  else
    echo -e "⏳ $status - $name ($type)"
  fi
done

echo ""
echo "PHYSICAL FILES:"
echo "---------------"

# 2. Check file fisici
backup_dir="/Users/lucamambelli/Desktop/richiesta-assistenza/backend/system-backups"

# Conta file ZIP
zip_count=$(find "$backup_dir" -maxdepth 1 -name "*.zip" -type f 2>/dev/null | wc -l)
json_count=$(find "$backup_dir" -maxdepth 1 -name "*.json" -type f 2>/dev/null | wc -l)

echo "📁 ZIP files: $zip_count"
echo "📄 JSON files: $json_count"

# Lista file orfani (file senza record nel DB)
echo ""
echo "Checking for orphan files..."

find "$backup_dir" -maxdepth 1 \( -name "*.zip" -o -name "*.json" \) -type f 2>/dev/null | while read filepath; do
  filename=$(basename "$filepath")
  file_id="${filename%.*}" # Rimuove estensione
  
  # Verifica se questo file ha un record nel database
  if ! echo "$response" | grep -q "$file_id"; then
    echo -e "${YELLOW}⚠️ ORPHAN FILE${NC} - $filename (no DB record)"
    total_orphan_files=$((total_orphan_files + 1))
  fi
done

echo ""
echo "==========================="
echo "📈 INTEGRITY REPORT:"
echo "==========================="

# Calcola health score
if [ $total_orphan_records -eq 0 ] && [ $total_orphan_files -eq 0 ]; then
  echo -e "${GREEN}✅ SYSTEM HEALTHY${NC}"
  health_status="HEALTHY"
elif [ $total_orphan_records -gt 0 ] || [ $total_orphan_files -gt 0 ]; then
  echo -e "${RED}❌ SYSTEM UNHEALTHY${NC}"
  health_status="CRITICAL"
else
  echo -e "${YELLOW}⚠️ SYSTEM WARNING${NC}"
  health_status="WARNING"
fi

echo ""
echo "Summary:"
echo "--------"
echo "• Database records: $(echo "$response" | jq '.backups | length')"
echo "• Physical files: $((zip_count + json_count))"
echo "• Orphan DB records: $total_orphan_records"
echo "• Orphan files: $total_orphan_files"
echo "• Health Status: $health_status"

if [ "$health_status" != "HEALTHY" ]; then
  echo ""
  echo "🚨 RECOMMENDED ACTIONS:"
  if [ $total_orphan_records -gt 0 ]; then
    echo "  1. Run cleanup to remove orphan database records"
  fi
  if [ $total_orphan_files -gt 0 ]; then
    echo "  2. Review and delete orphan files or re-index them"
  fi
  echo "  3. Create fresh backups to ensure data safety"
fi

echo ""
echo "==========================="
echo "✅ Monitoring complete!"
echo ""
echo "💡 TIP: Run this script daily to ensure backup integrity!"
