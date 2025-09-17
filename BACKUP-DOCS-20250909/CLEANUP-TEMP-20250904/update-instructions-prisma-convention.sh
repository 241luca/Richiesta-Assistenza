#!/bin/bash

echo "📝 AGGIORNAMENTO ISTRUZIONI - CONVENZIONE PRISMA"
echo "================================================"

cd /Users/lucamambelli/Desktop/richiesta-assistenza

# Backup
cp ISTRUZIONI-PROGETTO.md ISTRUZIONI-PROGETTO.md.backup-$(date +%Y%m%d-%H%M%S)

# Aggiungi la convenzione Prisma nella sezione delle relazioni
cat > /tmp/prisma-convention.txt << 'CONVENTION'

### ⚠️ CONVENZIONE FONDAMENTALE PRISMA ⚠️

**La convenzione di Prisma**: Usa SEMPRE camelCase minuscolo per le relazioni nel codice TypeScript

Anche se nello schema Prisma definisci le relazioni con nomi personalizzati tramite @relation, quando usi queste relazioni nel codice TypeScript, Prisma le converte SEMPRE in camelCase minuscolo.

**Esempio concreto:**

```prisma
// Schema Prisma
model AssistanceRequest {
  clientId        String
  professionalId  String?
  categoryId      String
  
  // Nomi definiti nello schema
  client          User     @relation("ClientRequests", fields: [clientId], references: [id])
  professional    User?    @relation("ProfessionalRequests", fields: [professionalId], references: [id])
  category        Category @relation(fields: [categoryId], references: [id])
  subcategory     Subcategory? @relation(fields: [subcategoryId], references: [id])
}
```

```typescript
// ✅ CORRETTO - Nel codice TypeScript usa SEMPRE minuscolo
const request = await prisma.assistanceRequest.findUnique({
  include: {
    client: true,         // minuscolo
    professional: true,   // minuscolo
    category: true,       // minuscolo
    subcategory: true    // minuscolo
  }
});

// Accesso ai dati - sempre minuscolo
const clientName = request.client.fullName;
const categoryName = request.category.name;

// ❌ SBAGLIATO - NON usare maiuscolo
include: {
  Client: true,         // NO!
  Professional: true,   // NO!
  Category: true        // NO!
}
```

**ECCEZIONE IMPORTANTE: _count**

Nel `_count`, i nomi dei modelli devono essere con la MAIUSCOLA iniziale:

```typescript
// ✅ CORRETTO - _count usa nomi modelli con maiuscola
include: {
  _count: {
    select: {
      Subcategory: true,        // Maiuscola nel _count!
      AssistanceRequest: true,  // Maiuscola nel _count!
      DepositRule: true         // Maiuscola nel _count!
    }
  }
}
```

### Regola riassuntiva:
- **Include/Select normali**: sempre minuscolo (`category`, `subcategory`, `client`)
- **_count**: sempre maiuscolo del nome del modello (`Subcategory`, `AssistanceRequest`)
- **Accesso ai dati**: sempre minuscolo (`request.category.name`)

CONVENTION

# Trova la sezione REGOLA CRITICA #2 e aggiungi la convenzione
awk '
/^### CHECKLIST per relazioni Prisma:/ {
    print
    while ((getline line < "/tmp/prisma-convention.txt") > 0)
        print line
    print ""
    next
}
{ print }
' ISTRUZIONI-PROGETTO.md > ISTRUZIONI-PROGETTO.tmp

# Se il file temporaneo è più grande, sostituisci l'originale
if [ $(wc -l < ISTRUZIONI-PROGETTO.tmp) -gt $(wc -l < ISTRUZIONI-PROGETTO.md) ]; then
    mv ISTRUZIONI-PROGETTO.tmp ISTRUZIONI-PROGETTO.md
    echo "✅ File aggiornato con successo!"
else
    # Se non ha funzionato, aggiungi alla fine della sezione Prisma
    echo "Aggiunta alternativa..."
    
    # Cerca "REGOLA CRITICA #2: RELAZIONI PRISMA" e aggiungi dopo
    awk '
    /^## 🚨🚨🚨 REGOLA CRITICA #2: RELAZIONI PRISMA/ {
        in_prisma_section = 1
    }
    /^---$/ && in_prisma_section {
        system("cat /tmp/prisma-convention.txt")
        print ""
        in_prisma_section = 0
    }
    { print }
    ' ISTRUZIONI-PROGETTO.md > ISTRUZIONI-PROGETTO.tmp
    
    if [ $(wc -l < ISTRUZIONI-PROGETTO.tmp) -gt $(wc -l < ISTRUZIONI-PROGETTO.md) ]; then
        mv ISTRUZIONI-PROGETTO.tmp ISTRUZIONI-PROGETTO.md
        echo "✅ File aggiornato con metodo alternativo!"
    else
        rm ISTRUZIONI-PROGETTO.tmp
        echo "⚠️  Aggiornamento manuale necessario. Aggiungi questo contenuto:"
        cat /tmp/prisma-convention.txt
    fi
fi

# Cleanup
rm -f /tmp/prisma-convention.txt

echo ""
echo "================================================"
echo "📋 Verifica aggiornamento:"
grep -A 3 "La convenzione di Prisma" ISTRUZIONI-PROGETTO.md 2>/dev/null || echo "Non trovato - potrebbe essere necessario aggiornamento manuale"
