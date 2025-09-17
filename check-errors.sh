#!/bin/bash
cd /Users/lucamambelli/Desktop/richiesta-assistenza/backend
echo "Controllo errori TypeScript in request.service.ts..."
npx tsc --noEmit 2>&1 | grep -A 2 "request.service.ts"
