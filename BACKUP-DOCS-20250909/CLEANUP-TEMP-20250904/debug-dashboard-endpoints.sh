#!/bin/bash

echo "🔍 DEBUG DASHBOARD - Checking real data differences"
echo "=================================================="

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
sleep 5

echo "📊 Testing Admin Dashboard endpoint..."
curl -s 'http://localhost:3200/api/admin/dashboard' | jq '.data.stats'

echo ""
echo "📊 Testing Normal Dashboard endpoint (should be same for admin)..."
curl -s 'http://localhost:3200/api/dashboard' -H 'Authorization: Bearer fake' | jq '.data.stats' || echo "Auth required - that's normal"

echo ""
echo "🔍 Let's check if endpoints are working at all..."
curl -s 'http://localhost:3200/api/health' || echo "Backend not ready yet"

echo ""
echo "📋 Checking what endpoints are available..."
curl -s 'http://localhost:3200/api/' || echo "No root endpoint"
