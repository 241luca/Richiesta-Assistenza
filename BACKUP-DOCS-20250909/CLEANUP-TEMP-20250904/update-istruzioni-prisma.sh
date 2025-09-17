#!/bin/bash

echo "📝 AGGIORNAMENTO ISTRUZIONI-PROGETTO.md"
echo "======================================="

cd /Users/lucamambelli/Desktop/richiesta-assistenza

# Backup del file originale
cp ISTRUZIONI-PROGETTO.md ISTRUZIONI-PROGETTO.md.backup-$(date +%Y%m%d-%H%M%S)

# Aggiungi la nuova sezione dopo la sezione ResponseFormatter
cat > /tmp/prisma-section.md << 'SECTION'

---

## 🚨🚨🚨 REGOLA CRITICA #2: RELAZIONI PRISMA 🚨🚨🚨

### ⚠️ SEMPRE USARE @relation PER NOMI STABILI ⚠️

**PROBLEMA COMUNE**: Dopo `npx prisma db pull` o modifiche al database, Prisma può rigenerare i nomi delle relazioni in modo imprevedibile (es. da `client` a `User_AssistanceRequest_clientIdToUser`), rompendo tutto il codice.

### SOLUZIONE OBBLIGATORIA: Usare @relation

```prisma
// ✅ CORRETTO - Nomi stabili con @relation
model AssistanceRequest {
  clientId        String
  professionalId  String?
  
  // Nome semplice e stabile grazie a @relation
  client          User  @relation("ClientRequests", fields: [clientId], references: [id])
  professional    User? @relation("ProfessionalRequests", fields: [professionalId], references: [id])
  category        Category @relation(fields: [categoryId], references: [id])
  quotes          Quote[]
  attachments     RequestAttachment[]
}

model User {
  // Relazioni inverse con nomi chiari
  clientRequests       AssistanceRequest[] @relation("ClientRequests")
  professionalRequests AssistanceRequest[] @relation("ProfessionalRequests")
}

// ❌ SBAGLIATO - Senza @relation i nomi possono cambiare
model AssistanceRequest {
  User_AssistanceRequest_clientIdToUser User // NO! Nome generato automaticamente
}
```

### REGOLE PER RELAZIONI PRISMA:

1. **SEMPRE specificare @relation** con nome personalizzato per relazioni many-to-one
2. **USARE nomi semplici e descrittivi** (client, professional, category, NON User_AssistanceRequest_...)
3. **MANTENERE coerenza** tra modello e relazione inversa
4. **DOPO db:pull**, verificare SEMPRE che i nomi delle relazioni non siano cambiati

### PROCEDURA DOPO MODIFICHE DATABASE:

```bash
# 1. Pull delle modifiche dal database
npx prisma db pull

# 2. VERIFICARE lo schema per nomi strani
grep "User_" prisma/schema.prisma  # Non dovrebbero esserci nomi generati

# 3. Se ci sono nomi generati, correggerli con @relation
# 4. Rigenerare il client Prisma
npx prisma generate

# 5. Testare almeno una route per verificare che le relazioni funzionino
npm run dev
```

### CHECKLIST per relazioni Prisma:
- [ ] Ogni relazione many-to-one ha @relation con nome personalizzato?
- [ ] I nomi sono semplici (client, professional, category)?
- [ ] Le relazioni inverse nel modello User hanno lo stesso nome @relation?
- [ ] Dopo db:pull, ho verificato che i nomi non siano cambiati?
- [ ] Il codice usa i nomi corretti delle relazioni?

### Esempio di query con relazioni corrette:
```typescript
// ✅ CORRETTO - Usa i nomi definiti con @relation
const request = await prisma.assistanceRequest.findUnique({
  where: { id },
  include: {
    client: true,           // Nome semplice grazie a @relation
    professional: true,     // Nome semplice grazie a @relation
    category: true,
    quotes: true,
    attachments: true
  }
});

// Accesso ai dati
const clientName = request.client.fullName;        // ✅ Semplice e chiaro
const professionalEmail = request.professional?.email;  // ✅ Facile da leggere

// ❌ SBAGLIATO - Nomi generati automaticamente
const clientName = request.User_AssistanceRequest_clientIdToUser.fullName; // NO!
```

SECTION

# Trova la posizione dopo la sezione ResponseFormatter e prima di "REGOLE FONDAMENTALI"
# e inserisci la nuova sezione

# Usa sed per inserire la nuova sezione dopo la prima regola critica
awk '/^---$/ && /^## REGOLE FONDAMENTALI$/ {
    while ((getline line < "/tmp/prisma-section.md") > 0)
        print line
}
1' ISTRUZIONI-PROGETTO.md > ISTRUZIONI-PROGETTO.tmp

# Se il primo tentativo non funziona, proviamo un approccio diverso
if [ ! -s ISTRUZIONI-PROGETTO.tmp ]; then
    # Inserisci dopo la riga con "## REGOLE FONDAMENTALI"
    awk '/^## REGOLE FONDAMENTALI$/ {
        while ((getline line < "/tmp/prisma-section.md") > 0)
            print line
        print ""
    }
    1' ISTRUZIONI-PROGETTO.md > ISTRUZIONI-PROGETTO.tmp
fi

# Se ancora non funziona, aggiungi semplicemente alla fine della sezione ResponseFormatter
if [ $(wc -l < ISTRUZIONI-PROGETTO.tmp) -eq $(wc -l < ISTRUZIONI-PROGETTO.md) ]; then
    # Trova la linea "## REGOLE FONDAMENTALI" e inserisci prima
    awk '
    /^## REGOLE FONDAMENTALI$/ {
        system("cat /tmp/prisma-section.md")
        print ""
    }
    { print }
    ' ISTRUZIONI-PROGETTO.md > ISTRUZIONI-PROGETTO.tmp
fi

# Sostituisci il file originale se il nuovo è più lungo
if [ $(wc -l < ISTRUZIONI-PROGETTO.tmp) -gt $(wc -l < ISTRUZIONI-PROGETTO.md) ]; then
    mv ISTRUZIONI-PROGETTO.tmp ISTRUZIONI-PROGETTO.md
    echo "✅ File ISTRUZIONI-PROGETTO.md aggiornato con successo!"
else
    echo "⚠️  Aggiornamento manuale necessario. Contenuto da aggiungere:"
    cat /tmp/prisma-section.md
    rm ISTRUZIONI-PROGETTO.tmp
fi

# Cleanup
rm -f /tmp/prisma-section.md

echo ""
echo "======================================="
echo "📋 Verifica contenuto aggiunto:"
grep -A 5 "REGOLA CRITICA #2: RELAZIONI PRISMA" ISTRUZIONI-PROGETTO.md 2>/dev/null || echo "Sezione non trovata, aggiunta manuale necessaria"
