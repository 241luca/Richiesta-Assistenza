#!/bin/bash

echo "Testing Dashboard Endpoints..."

# First login to get session
echo -e "\n1. Login as SUPER_ADMIN..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}' \
  -c cookies.txt)

echo "Login Response: $LOGIN_RESPONSE"

# Test admin dashboard
echo -e "\n2. Testing Admin Dashboard..."
ADMIN_DASHBOARD=$(curl -s http://localhost:3200/api/admin/dashboard \
  -b cookies.txt)

echo "Admin Dashboard Response: $ADMIN_DASHBOARD"

# Test user dashboard
echo -e "\n3. Testing User Dashboard..."
USER_DASHBOARD=$(curl -s http://localhost:3200/api/dashboard \
  -b cookies.txt)

echo "User Dashboard Response: $USER_DASHBOARD"

# Clean up
rm -f cookies.txt

echo -e "\nTest completed!"
