#!/usr/bin/env python3
"""
Fix automatico whatsapp.service.ts e wppconnect.service.ts
Data: 09/10/2025
"""

# ===== whatsapp.service.ts =====
file_path1 = 'src/services/whatsapp.service.ts'
print(f"📝 Fixing {file_path1}...")

with open(file_path1, 'r') as f:
    content1 = f.read()

# Fix: SystemSetting create richiede id e updatedAt
content1 = content1.replace(
    '''create: {
        key: 'whatsapp_session_status',''',
    '''create: {
        id: 'whatsapp_session_status',
        key: 'whatsapp_session_status','''
)

# Fix: conversation non esiste in WhatsAppMessageInclude
content1 = content1.replace(
    '''        conversation: true''',
    '''        // conversation: true // Field doesn't exist'''
)

with open(file_path1, 'w') as f:
    f.write(content1)

print(f"✅ {file_path1} fixed!")

# ===== wppconnect.service.ts =====
file_path2 = 'src/services/wppconnect.service.ts'
print(f"\n📝 Fixing {file_path2}...")

with open(file_path2, 'r') as f:
    content2 = f.read()

# Fix 1: create function non trovata - import mancante
if "import { create" not in content2:
    # Aggiungi import in cima
    import_line = "import { create } from '@wppconnect-team/wppconnect';\n"
    # Cerca la prima linea import e aggiungi dopo
    content2 = content2.replace(
        "import {",
        import_line + "import {",
        1  # Solo la prima occorrenza
    )

# Fix 2: SocketState - definire correttamente l'enum
content2 = content2.replace(
    "const SocketState = { CONNECTED: 'CONNECTED' };",
    '''const SocketState = { 
  CONNECTED: 'CONNECTED',
  CONFLICT: 'CONFLICT',
  UNPAIRED: 'UNPAIRED',
  DISCONNECTED: 'DISCONNECTED'
};'''
)

# Fix 3: Type annotation SocketState
content2 = content2.replace(
    "(state: SocketState)",
    "(state: string) // SocketState"
)

with open(file_path2, 'w') as f:
    f.write(content2)

print(f"✅ {file_path2} fixed!")
print("\n✅ TUTTI I FILE FIXATI!")
