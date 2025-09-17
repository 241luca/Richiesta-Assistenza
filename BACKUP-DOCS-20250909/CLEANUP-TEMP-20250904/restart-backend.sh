#!/bin/bash

echo "Restarting backend..."

# Kill any existing process on port 3200
lsof -ti:3200 | xargs kill -9 2>/dev/null || true

cd /Users/lucamambelli/Desktop/richiesta-assistenza/backend

# Start the backend
npm run dev &

echo "Backend restarting on port 3200..."
echo "Wait a few seconds for it to compile..."
sleep 5

# Test if it's running
curl -s http://localhost:3200/api/ping || echo "Backend not yet ready"

echo "Done! Backend should be running."
