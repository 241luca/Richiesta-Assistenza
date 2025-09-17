#!/bin/bash

echo "🗺️ TEST DIRETTO GOOGLE MAPS"
echo "============================"
echo ""

# Usa direttamente uno dei token che abbiamo visto funzionare
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzOWQzOWIzMS1jODY0LTQwYTMtYTgxYy02MGIxZjIzZTdkYTEiLCJpYXQiOjE3NTYyMTU3NDgsImV4cCI6MTc1NjgyMDU0OH0.y9m9egKl8zVwxs4eLRRTqS3nKAJYx_r7tSYrXszsP-Y"

echo "📍 Test 1: Via Roma 1, Milano"
curl -X POST http://localhost:3200/api/maps/geocode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"address": "Via Roma 1, Milano, Italia"}' \
  | python3 -m json.tool

echo ""
echo "============================"
echo ""

echo "📍 Test 2: Colosseo, Roma"
curl -X POST http://localhost:3200/api/maps/geocode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"address": "Colosseo, Roma, Italia"}' \
  | python3 -m json.tool

echo ""
echo "============================"
echo ""

echo "📍 Test 3: Torre di Pisa"
curl -X POST http://localhost:3200/api/maps/geocode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"address": "Torre di Pisa, Pisa, Italia"}' \
  | python3 -m json.tool

echo ""
echo "============================"
echo "✅ TEST COMPLETATO!"
echo "============================"
