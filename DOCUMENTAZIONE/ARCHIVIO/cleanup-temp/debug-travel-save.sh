#!/bin/bash

echo "🔍 DEBUG: Problema Salvataggio Indirizzo Viaggi"
echo "=============================================="

# Test 1: Verifica che il backend sia attivo
echo "1. Testing backend availability..."
backend_status=$(curl -s -w "%{http_code}" http://localhost:3200/health -o /dev/null)

if [ "$backend_status" = "200" ]; then
    echo "✅ Backend is running on port 3200"
else
    echo "❌ Backend not responding (HTTP $backend_status)"
    echo "   Please start: cd backend && npm run dev"
    exit 1
fi

# Test 2: Verifica endpoint travel senza auth (dovrebbe dare 401)
echo ""
echo "2. Testing travel endpoint (without auth - should be 401)..."
travel_status=$(curl -s -w "%{http_code}" http://localhost:3200/api/travel/work-address -o /dev/null)
echo "   GET /api/travel/work-address -> HTTP $travel_status"

if [ "$travel_status" = "401" ]; then
    echo "✅ Travel endpoint exists (requires auth)"
elif [ "$travel_status" = "404" ]; then
    echo "❌ Travel endpoint NOT FOUND - Route missing!"
    echo "   Check backend/src/routes/travel.routes.ts"
else
    echo "⚠️  Unexpected response: HTTP $travel_status"
fi

# Test 3: Controlla se le routes travel sono registrate nel server
echo ""
echo "3. Checking if travel routes are registered in server..."
if grep -q "travel.routes" /Users/lucamambelli/Desktop/richiesta-assistenza/backend/src/server.ts; then
    echo "✅ Travel routes are imported in server.ts"
    
    if grep -q "/api/travel" /Users/lucamambelli/Desktop/richiesta-assistenza/backend/src/server.ts; then
        echo "✅ Travel routes are registered: /api/travel"
    else
        echo "❌ Travel routes imported but NOT registered!"
    fi
else
    echo "❌ Travel routes NOT imported in server.ts"
fi

# Test 4: Verifica che il file travel.routes.ts esista e sia corretto
echo ""
echo "4. Checking travel routes file..."
travel_routes_file="/Users/lucamambelli/Desktop/richiesta-assistenza/backend/src/routes/travel.routes.ts"

if [ -f "$travel_routes_file" ]; then
    echo "✅ travel.routes.ts exists"
    
    # Controlla se ha gli endpoint necessari
    if grep -q "work-address" "$travel_routes_file"; then
        echo "✅ Has work-address endpoints"
    else
        echo "❌ Missing work-address endpoints"
    fi
    
    if grep -q "router.put.*work-address" "$travel_routes_file"; then
        echo "✅ Has PUT /work-address endpoint"
    else
        echo "❌ Missing PUT /work-address endpoint"
    fi
    
    if grep -q "router.get.*work-address" "$travel_routes_file"; then
        echo "✅ Has GET /work-address endpoint"
    else
        echo "❌ Missing GET /work-address endpoint"
    fi
else
    echo "❌ travel.routes.ts does NOT exist"
fi

# Test 5: Verifica il service travel
echo ""
echo "5. Checking travel service file..."
travel_service_file="/Users/lucamambelli/Desktop/richiesta-assistenza/backend/src/services/travel.service.ts"

if [ -f "$travel_service_file" ]; then
    echo "✅ travel.service.ts exists"
    
    if grep -q "updateWorkAddress" "$travel_service_file"; then
        echo "✅ Has updateWorkAddress method"
    else
        echo "❌ Missing updateWorkAddress method"
    fi
    
    if grep -q "getWorkAddress" "$travel_service_file"; then
        echo "✅ Has getWorkAddress method"
    else
        echo "❌ Missing getWorkAddress method"
    fi
else
    echo "❌ travel.service.ts does NOT exist"
fi

echo ""
echo "🎯 DIAGNOSIS SUMMARY:"
echo "===================="
echo "If endpoints exist but save doesn't work, likely causes:"
echo "1. 🔑 Authentication token not being sent"
echo "2. 🗄️  Database connection issues"
echo "3. 🐛 Service method bugs"
echo "4. 🔧 ResponseFormatter issues"
echo ""
echo "Next step: Check browser console for errors when saving"
