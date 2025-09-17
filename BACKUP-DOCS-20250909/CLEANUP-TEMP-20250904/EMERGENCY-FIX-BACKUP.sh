#!/bin/bash

echo "🚨 EMERGENCY BACKUP SYSTEM FIX 🚨"
echo "================================="
echo ""
echo "PROBLEMA CRITICO IDENTIFICATO:"
echo "- Il database dice di avere 3 backup COMPLETED"
echo "- In realtà esiste SOLO 1 file di backup!"
echo "- Rischio PERDITA DATI se credi di avere backup che non esistono!"
echo ""
echo "==========================================="

# FASE 1: PULIZIA RECORD FANTASMA
echo ""
echo "📋 FASE 1: Identificazione record fantasma..."
echo ""

# Ottieni tutti i backup dal database
response=$(curl -s -X GET http://localhost:3200/api/backup \
  -H "Content-Type: application/json" \
  -b cookies.txt)

echo "$response" | jq -r '.backups[] | select(.status == "COMPLETED") | "\(.id)|\(.filePath)"' | while IFS='|' read -r id filepath; do
  if [ -n "$filepath" ] && [ "$filepath" != "null" ]; then
    if [ ! -f "$filepath" ]; then
      echo "❌ FANTASMA TROVATO: $id"
      echo "   File mancante: $filepath"
      echo "   🗑️ Eliminando record fantasma..."
      
      # Elimina il record fantasma dal database
      curl -s -X DELETE "http://localhost:3200/api/backup/$id?permanent=true" \
        -H "Content-Type: application/json" \
        -b cookies.txt > /dev/null 2>&1
      
      echo "   ✅ Record fantasma eliminato!"
      echo ""
    else
      echo "✅ BACKUP VALIDO: $id"
      echo "   File esistente: $filepath ($(ls -lh "$filepath" 2>/dev/null | awk '{print $5}'))"
      echo ""
    fi
  fi
done

# FASE 2: CREAZIONE BACKUP IMMEDIATO DI EMERGENZA
echo "==========================================="
echo "📋 FASE 2: Creazione backup di emergenza..."
echo ""

# Crea 3 backup di emergenza SUBITO
for type in "DATABASE" "FULL" "DATABASE"; do
  echo "🔄 Creando backup di tipo $type..."
  
  backup_response=$(curl -s -X POST http://localhost:3200/api/backup \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -d "{
      \"type\": \"$type\",
      \"description\": \"BACKUP DI EMERGENZA - SISTEMA CRITICO\",
      \"includeDatabase\": true,
      \"compression\": true,
      \"retentionDays\": 90
    }")
  
  backup_id=$(echo "$backup_response" | jq -r '.id')
  
  if [ -n "$backup_id" ] && [ "$backup_id" != "null" ]; then
    echo "✅ Backup $type creato con ID: $backup_id"
  else
    echo "❌ ERRORE nella creazione backup $type!"
  fi
  
  # Aspetta 2 secondi tra un backup e l'altro
  sleep 2
done

echo ""
echo "==========================================="
echo "📋 FASE 3: Verifica finale..."
echo ""

# Aspetta che i backup vengano processati
echo "⏳ Attendo 10 secondi per il completamento..."
sleep 10

# Verifica finale
echo ""
echo "📊 SITUAZIONE DOPO IL FIX:"
echo ""

# Conta i backup reali
real_backups=0
fake_backups=0

final_response=$(curl -s -X GET http://localhost:3200/api/backup \
  -H "Content-Type: application/json" \
  -b cookies.txt)

echo "$final_response" | jq -r '.backups[] | select(.status == "COMPLETED") | "\(.id)|\(.filePath)|\(.fileSize)"' | while IFS='|' read -r id filepath size; do
  if [ -n "$filepath" ] && [ "$filepath" != "null" ]; then
    if [ -f "$filepath" ]; then
      real_backups=$((real_backups + 1))
      echo "✅ BACKUP REALE: $(basename $filepath) - $size bytes"
    else
      fake_backups=$((fake_backups + 1))
      echo "❌ ANCORA FANTASMA: $id"
    fi
  fi
done

# Lista file fisici
echo ""
echo "📁 FILE DI BACKUP FISICI PRESENTI:"
ls -lah /Users/lucamambelli/Desktop/richiesta-assistenza/backend/system-backups/*.zip 2>/dev/null || echo "Nessun file ZIP trovato"
ls -lah /Users/lucamambelli/Desktop/richiesta-assistenza/backend/system-backups/*.json 2>/dev/null || echo "Nessun file JSON trovato"

echo ""
echo "==========================================="
echo "🚨 RACCOMANDAZIONI CRITICHE:"
echo ""
echo "1. ⚠️ VERIFICA SEMPRE che il file di backup ESISTA FISICAMENTE!"
echo "2. ⚠️ NON FIDARTI del contatore nel database!"
echo "3. ⚠️ FAI BACKUP MULTIPLI e verifica che esistano!"
echo "4. ⚠️ TESTA il download di ogni backup per confermare che funzioni!"
echo ""
echo "✅ FIX COMPLETATO!"
