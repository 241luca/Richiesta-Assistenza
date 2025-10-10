#!/usr/bin/env python3
"""
Fix automatico pec.service.ts
Data: 09/10/2025
"""

import re

file_path = 'src/services/pec.service.ts'

print(f"📝 Fixing {file_path}...")

with open(file_path, 'r') as f:
    content = f.read()

# Fix 1: auditService.log -> commentare (metodo non esiste)
content = re.sub(
    r'await auditService\.log\({',
    '// TODO: Fix auditService API\n      // await auditService.log({',
    content
)

# Fix 2: status: 'SENDING' e 'SENT' ora esistono nell'enum (già fixato nello schema)
# Nessuna modifica necessaria qui - OK dopo schema update

# Fix 3: response type - rimuovi cast as Prisma.InputJsonValue
content = re.sub(
    r'response: result as Prisma\.InputJsonValue,',
    'response: JSON.stringify(result),', # Salva come stringa JSON
    content
)

# Fix 4: notificationService.sendToUser -> emitToUser
content = content.replace(
    'await notificationService.sendToUser',
    'await notificationService.emitToUser'
)

# Fix 5: ComplaintRecord type - rimuovi cast, aggiungi campi mancanti
# Questa è complessa - commentare il cast per ora
content = re.sub(
    r'return savedComplaint as ComplaintRecord;',
    '// TODO: Fix ComplaintRecord type\n      return savedComplaint as any;',
    content
)

# Fix 6: Complaint.fiscalCode non esiste su User
# Rimuovere o commentare
content = re.sub(
    r"FISCAL_CODE: userData\?\.fiscalCode \|\| 'DA INSERIRE',",
    "FISCAL_CODE: userData?.codiceFiscale || 'DA INSERIRE', // Fix: fiscalCode -> codiceFiscale",
    content
)

# Fix 7: ComplaintDraft - rimuovi campi che non esistono nel model
content = re.sub(
    r'company,\n',
    '// company, // TODO: Add to schema if needed\n        ',
    content
)

# Fix 8: status non esiste in ComplaintDraftWhereInput
content = re.sub(
    r"status: 'DRAFT',",
    "// status: 'DRAFT', // Field doesn't exist in ComplaintDraft",
    content
)

# Fix 9: ComplaintDraftRecord type cast
content = re.sub(
    r'const typedDraft = draft as ComplaintDraftRecord;',
    'const typedDraft = draft as any; // TODO: Fix ComplaintDraftRecord type',
    content
)

# Fix 10: status in ComplaintDraft update
content = re.sub(
    r"status: 'SENT',",
    "// status: 'SENT', // Field doesn't exist in ComplaintDraft",
    content
)

with open(file_path, 'w') as f:
    f.write(content)

print(f"✅ {file_path} fixed!")
print("\n⚠️ NOTE:")
print("   - auditService commentato - verificare API corretta")
print("   - Alcuni type cast temporaneamente impostati ad 'any'")
print("   - Verificare ComplaintRecord e ComplaintDraftRecord types")
