#!/bin/bash

# Script per correggere tutti gli import case-sensitive dei componenti UI

echo "🔧 Fixing case-sensitive imports in components/ui..."

# Lista dei componenti UI da correggere (maiuscolo -> minuscolo)
declare -A components=(
    ["Badge"]="badge"
    ["Button"]="button"
    ["Card"]="card"
    ["Input"]="input"
    ["Select"]="select"
    ["TextArea"]="textarea"
    ["Dialog"]="dialog"
    ["Modal"]="modal"
    ["Dropdown"]="dropdown"
    ["Alert"]="alert"
    ["Toast"]="toast"
    ["Tooltip"]="tooltip"
    ["Switch"]="switch"
    ["Checkbox"]="checkbox"
    ["Radio"]="radio"
    ["Table"]="table"
    ["Tabs"]="tabs"
    ["Loading"]="loading"
    ["Spinner"]="spinner"
)

# Trova tutti i file .tsx e .ts
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -print0 | while IFS= read -r -d '' file; do
    modified=false
    
    for old in "${!components[@]}"; do
        new="${components[$old]}"
        
        # Cerca il pattern con maiuscolo e sostituisci con minuscolo
        if grep -q "from ['\"].*components/ui/${old}['\"]" "$file" 2>/dev/null; then
            echo "  Fixing $file: $old -> $new"
            sed -i '' "s|components/ui/${old}|components/ui/${new}|g" "$file"
            modified=true
        fi
    done
    
    if [ "$modified" = true ]; then
        echo "    ✅ Fixed: $file"
    fi
done

echo ""
echo "✅ Done! All imports have been fixed."
echo ""
echo "Modified files:"
git diff --name-only src/
