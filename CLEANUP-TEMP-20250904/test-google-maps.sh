#!/bin/bash

echo "=== Test Google Maps Integration ==="
echo ""

# Test login with correct credentials
echo "1. Login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@assistenza.it",
    "password": "password123"
  }')

echo "Login response (first 200 chars): ${LOGIN_RESPONSE:0:200}..."
echo ""

# Extract the access token from the response
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "Failed to get access token"
  exit 1
fi

echo "Access token obtained successfully"
echo ""

# Test Google Maps config
echo "2. Test Google Maps Config..."
CONFIG_RESPONSE=$(curl -s -X GET http://localhost:3200/api/maps/config \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Maps config response: $CONFIG_RESPONSE"
echo ""

# Test geocoding
echo "3. Test Geocoding..."
GEOCODE_RESPONSE=$(curl -s -X POST http://localhost:3200/api/maps/geocode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "address": "Via Roma 1, Milano, MI 20121, Italia"
  }')

echo "Geocoding response: $GEOCODE_RESPONSE"
echo ""

# Get a request to test
echo "4. Get first request..."
REQUESTS_RESPONSE=$(curl -s -X GET http://localhost:3200/api/requests \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Requests response (first 500 chars): ${REQUESTS_RESPONSE:0:500}..."
echo ""

# Extract first request ID using simple string manipulation
REQUEST_ID=$(echo "$REQUESTS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ ! -z "$REQUEST_ID" ]; then
  echo "5. Testing coordinate update for request: $REQUEST_ID"
  UPDATE_RESPONSE=$(curl -s -X PATCH http://localhost:3200/api/requests/$REQUEST_ID/coordinates \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d '{
      "latitude": 45.4642,
      "longitude": 9.1900
    }')
  
  echo "Coordinate update response: $UPDATE_RESPONSE"
  
  # Get the updated request to verify coordinates
  echo ""
  echo "6. Verifying updated request..."
  VERIFY_RESPONSE=$(curl -s -X GET http://localhost:3200/api/requests/$REQUEST_ID \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  
  # Extract just the coordinates from the response
  echo "Updated coordinates:"
  echo "$VERIFY_RESPONSE" | grep -o '"latitude":[^,]*' | head -1
  echo "$VERIFY_RESPONSE" | grep -o '"longitude":[^,]*' | head -1
else
  echo "No requests found to test coordinate update"
  echo ""
  echo "Creating a test request..."
  
  # First get categories
  CATEGORIES_RESPONSE=$(curl -s -X GET http://localhost:3200/api/categories \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  
  CATEGORY_ID=$(echo "$CATEGORIES_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ ! -z "$CATEGORY_ID" ]; then
    CREATE_RESPONSE=$(curl -s -X POST http://localhost:3200/api/requests \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -d "{
        \"title\": \"Test richiesta per Google Maps\",
        \"description\": \"Questa è una richiesta di test per verificare la funzionalità delle mappe\",
        \"categoryId\": \"$CATEGORY_ID\",
        \"priority\": \"MEDIUM\",
        \"address\": \"Via Roma 1\",
        \"city\": \"Milano\",
        \"province\": \"MI\",
        \"postalCode\": \"20121\"
      }")
    
    echo "Create request response: $CREATE_RESPONSE"
    
    NEW_REQUEST_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ ! -z "$NEW_REQUEST_ID" ]; then
      echo ""
      echo "Testing coordinate update for new request: $NEW_REQUEST_ID"
      UPDATE_RESPONSE=$(curl -s -X PATCH http://localhost:3200/api/requests/$NEW_REQUEST_ID/coordinates \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -d '{
          "latitude": 45.4642,
          "longitude": 9.1900
        }')
      
      echo "Coordinate update response: $UPDATE_RESPONSE"
    fi
  fi
fi

echo ""
echo "=== Test Complete ==="
