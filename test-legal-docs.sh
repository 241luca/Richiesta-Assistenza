#!/bin/bash

echo "Testing TypeScript compilation for legal documents feature..."

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo "Checking service file..."
npx tsc --noEmit src/services/legal-document.service.ts

echo "Checking admin routes..."
npx tsc --noEmit src/routes/admin/legal-documents.routes.ts

echo "Checking public routes..."
npx tsc --noEmit src/routes/legal.routes.ts

echo "Done!"
