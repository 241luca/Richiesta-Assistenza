#!/bin/bash

# Test script per Google Maps Integration
echo "🗺️ TEST GOOGLE MAPS INTEGRATION"
echo "================================"
echo ""

# Check if backend is running
echo "1. Checking backend health..."
HEALTH=$(curl -s http://localhost:3200/health)
if [ $? -eq 0 ]; then
    echo "✅ Backend is running"
    echo "$HEALTH" | jq '.'
else
    echo "❌ Backend is not running on port 3200"
    echo "Please start backend: cd backend && npm run dev"
    exit 1
fi

echo ""
echo "2. Checking Redis connection..."
REDIS_PING=$(redis-cli ping 2>/dev/null)
if [ "$REDIS_PING" = "PONG" ]; then
    echo "✅ Redis is running"
else
    echo "❌ Redis is not running"
    echo "Please start Redis: redis-server"
    exit 1
fi

echo ""
echo "3. Testing geocoding endpoint (requires valid API key)..."
echo "Note: This will fail without a valid Google Maps API key in .env"
echo ""

# You would need a valid JWT token for this to work
echo "To test geocoding, you need:"
echo "1. Valid Google Maps API key in backend/.env"
echo "2. Valid JWT token from login"
echo ""
echo "Example test command:"
echo 'curl -X POST http://localhost:3200/api/geocode/address \'
echo '  -H "Content-Type: application/json" \'
echo '  -H "Authorization: Bearer YOUR_JWT_TOKEN" \'
echo '  -d '"'"'{"address": "Via Roma 1, Milano"}'"'"

echo ""
echo "================================"
echo "📋 CHECKLIST"
echo "================================"
echo ""
echo "Backend Requirements:"
echo "[ ] Backend running on port 3200"
echo "[ ] Redis running"
echo "[ ] Google Maps API key in backend/.env"
echo "[ ] @googlemaps/google-maps-services-js installed"
echo ""
echo "Frontend Requirements:"
echo "[ ] Frontend running on port 5193"
echo "[ ] Google Maps API key in .env (VITE_GOOGLE_MAPS_API_KEY)"
echo "[ ] @react-google-maps/api installed"
echo ""
echo "Google Cloud Requirements:"
echo "[ ] Google Cloud project created"
echo "[ ] Maps JavaScript API enabled"
echo "[ ] Geocoding API enabled"
echo "[ ] Places API enabled"
echo "[ ] API key created with HTTP referrer restrictions"
echo ""
echo "================================"
echo "✅ Integration code is ready!"
echo "⚠️  Configure Google Cloud to activate features"
echo "================================"
