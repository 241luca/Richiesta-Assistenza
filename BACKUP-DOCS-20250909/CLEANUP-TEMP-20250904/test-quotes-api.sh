#!/bin/bash

# Test API quotes endpoint
echo "Testing quotes endpoint with authentication..."

# Test with sample user token (you should replace with actual token)
curl -X GET "http://localhost:3200/api/quotes" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=s%3A7E5KGANTqPBJUOgEbJGmgxc7ynTYkuAz.SbcP2AoJfaGc%2FXvyyPBFT3GKzKxBqzxiTCvCo%2FLiLiY" \
  -v

echo ""
echo "Done testing quotes API"
