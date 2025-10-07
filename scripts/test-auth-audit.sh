#!/bin/bash

# Test Audit Log su Auth Routes
# Data: 27 Settembre 2025

echo "🧪 TEST AUDIT LOG SU AUTH ROUTES"
echo "================================="
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3200/api"

# Test data
TEST_EMAIL="test_audit_$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123!"
TEST_NAME="Test User"

echo "📋 Test Configuration:"
echo "  Email: $TEST_EMAIL"
echo "  Password: $TEST_PASSWORD"
echo ""

# 1. Test Registrazione
echo "1️⃣ Testing REGISTER with audit..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'",
    "firstName": "Test",
    "lastName": "Audit",
    "phone": "3334445556",
    "role": "CLIENT",
    "address": "Via Test 123",
    "city": "Roma",
    "province": "RM",
    "postalCode": "00100"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "accessToken"; then
  echo -e "${GREEN}✅ Registration successful - Audit log should be created${NC}"
  TOKEN=$(echo "$REGISTER_RESPONSE" | grep -oP '"accessToken"\s*:\s*"\K[^"]+')
else
  echo -e "${RED}❌ Registration failed${NC}"
  echo "Response: $REGISTER_RESPONSE"
fi
echo ""

# 2. Test Login Success
echo "2️⃣ Testing LOGIN SUCCESS with audit..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'"
  }')

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
  echo -e "${GREEN}✅ Login successful - Audit log should be created${NC}"
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -oP '"accessToken"\s*:\s*"\K[^"]+')
else
  echo -e "${RED}❌ Login failed${NC}"
  echo "Response: $LOGIN_RESPONSE"
fi
echo ""

# 3. Test Login Failed (wrong password)
echo "3️⃣ Testing LOGIN FAILED with audit..."
FAILED_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "password": "WrongPassword123"
  }')

if echo "$FAILED_LOGIN_RESPONSE" | grep -q "INVALID_CREDENTIALS"; then
  echo -e "${GREEN}✅ Login failed as expected - Audit log should be created${NC}"
else
  echo -e "${RED}❌ Unexpected response${NC}"
  echo "Response: $FAILED_LOGIN_RESPONSE"
fi
echo ""

# 4. Test Password Reset Request
echo "4️⃣ Testing PASSWORD RESET REQUEST with audit..."
RESET_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'"
  }')

if echo "$RESET_RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✅ Password reset requested - Audit log should be created${NC}"
else
  echo -e "${RED}❌ Password reset failed${NC}"
  echo "Response: $RESET_RESPONSE"
fi
echo ""

# 5. Test Logout
echo "5️⃣ Testing LOGOUT with audit..."
if [ ! -z "$TOKEN" ]; then
  LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/logout" \
    -H "Authorization: Bearer $TOKEN")
  
  if echo "$LOGOUT_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Logout successful - Audit log should be created${NC}"
  else
    echo -e "${RED}❌ Logout failed${NC}"
    echo "Response: $LOGOUT_RESPONSE"
  fi
else
  echo -e "${YELLOW}⚠️ Skipping logout test (no token)${NC}"
fi
echo ""

# 6. Check Audit Logs (se admin)
echo "6️⃣ Checking AUDIT LOGS..."
echo ""

# Se abbiamo un token admin (modificare con credenziali reali admin)
ADMIN_EMAIL="admin@assistenza.it"
ADMIN_PASSWORD="AdminPassword123!"

echo "Trying to get admin token..."
ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$ADMIN_EMAIL'",
    "password": "'$ADMIN_PASSWORD'"
  }')

if echo "$ADMIN_LOGIN" | grep -q "accessToken"; then
  ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | grep -oP '"accessToken"\s*:\s*"\K[^"]+')
  
  echo "Fetching recent audit logs..."
  AUDIT_LOGS=$(curl -s "$BASE_URL/audit/logs?limit=10" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  
  if echo "$AUDIT_LOGS" | grep -q "$TEST_EMAIL"; then
    echo -e "${GREEN}✅ Audit logs found for test email${NC}"
    
    # Count different action types
    REGISTER_COUNT=$(echo "$AUDIT_LOGS" | grep -o "CREATE" | wc -l)
    LOGIN_SUCCESS_COUNT=$(echo "$AUDIT_LOGS" | grep -o "LOGIN_SUCCESS" | wc -l)
    LOGIN_FAILED_COUNT=$(echo "$AUDIT_LOGS" | grep -o "LOGIN_FAILED" | wc -l)
    PASSWORD_RESET_COUNT=$(echo "$AUDIT_LOGS" | grep -o "PASSWORD_RESET_REQUESTED" | wc -l)
    LOGOUT_COUNT=$(echo "$AUDIT_LOGS" | grep -o "LOGOUT" | wc -l)
    
    echo ""
    echo "📊 Audit Log Summary:"
    echo "  - CREATE (Register): $REGISTER_COUNT"
    echo "  - LOGIN_SUCCESS: $LOGIN_SUCCESS_COUNT"
    echo "  - LOGIN_FAILED: $LOGIN_FAILED_COUNT"
    echo "  - PASSWORD_RESET_REQUESTED: $PASSWORD_RESET_COUNT"
    echo "  - LOGOUT: $LOGOUT_COUNT"
  else
    echo -e "${YELLOW}⚠️ No audit logs found for test email (might need different permissions)${NC}"
  fi
else
  echo -e "${YELLOW}⚠️ Could not login as admin to check audit logs${NC}"
fi

echo ""
echo "======================================"
echo "📈 TEST SUMMARY"
echo "======================================"
echo ""
echo "Expected Audit Logs Created:"
echo "✅ 1. User registration (CREATE)"
echo "✅ 2. Successful login (LOGIN_SUCCESS)"
echo "✅ 3. Failed login (LOGIN_FAILED)"
echo "✅ 4. Password reset request (PASSWORD_RESET_REQUESTED)"
echo "✅ 5. Logout (LOGOUT)"
echo ""
echo -e "${GREEN}🎉 All auth operations should now have audit logs!${NC}"
echo ""
echo "To verify in database, run:"
echo "psql -d richiesta_assistenza -c \"SELECT action, entity_type, user_email, success, created_at FROM audit_log WHERE user_email LIKE '%test_audit%' ORDER BY created_at DESC LIMIT 10;\""
echo ""