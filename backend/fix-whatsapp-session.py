#!/usr/bin/env python3
"""
Fix automatico whatsapp-session-manager.ts
Data: 09/10/2025
"""

file_path = 'src/services/whatsapp-session-manager.ts'

print(f"📝 Fixing {file_path}...")

with open(file_path, 'r') as f:
    content = f.read()

# Fix import statements - aggiungere esModuleInterop style
content = content.replace(
    "import fs from 'fs/promises';",
    "import * as fs from 'fs/promises';"
)

content = content.replace(
    "import path from 'path';",
    "import * as path from 'path';"
)

content = content.replace(
    "import crypto from 'crypto';",
    "import * as crypto from 'crypto';"
)

with open(file_path, 'w') as f:
    f.write(content)

print(f"✅ {file_path} fixed!")
print("   - Import statements corretti per TypeScript")
