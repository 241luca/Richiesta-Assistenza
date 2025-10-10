#!/bin/bash
# Sposto tutti i file tranne quelli che devono rimanere

# File da mantenere nel frontend
MANTIENI=("api.ts" "health.service.ts" "modules.api.ts" "referralApi.ts" "travelApi.ts" "googleMapsConfig.ts")

# Cartelle da mantenere
CARTELLE_MANTIENI=("professional" "admin" "calendar" "certifications" "config" "health-check-automation" "services-clean")

cd src/services

# Sposto tutti i file .ts/.js tranne quelli da mantenere
for file in *.ts *.js; do
  if [[ -f "$file" ]]; then
    mantieni=false
    for keep in "${MANTIENI[@]}"; do
      if [[ "$file" == "$keep" ]]; then
        mantieni=true
        break
      fi
    done
    
    if [[ "$mantieni" == false ]]; then
      echo "Spostando: $file"
      mv "$file" "../../intrusi/"
    else 
      echo "Mantengo: $file"
    fi
  fi
done

# Sposto file backup e speciali
for file in *.backup-* *.OLD-* *.ELIMINATO; do
  if [[ -f "$file" ]]; then
    echo "Spostando backup: $file"
    mv "$file" "../../intrusi/"
  fi
done

echo "Spostamento completato!"

