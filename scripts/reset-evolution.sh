#!/bin/bash

echo "🔄 RESET COMPLETO EVOLUTION API"
echo "================================"

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}1. Stopping Evolution API...${NC}"
docker stop evolution_api

echo -e "${YELLOW}2. Removing container...${NC}"
docker rm evolution_api

echo -e "${YELLOW}3. Checking for docker-compose...${NC}"
if [ -f "/opt/evolution-api/docker-compose.yml" ]; then
    cd /opt/evolution-api
    echo "Found docker-compose.yml"
    
    echo -e "${YELLOW}4. Starting with docker-compose...${NC}"
    docker-compose up -d
elif [ -f "/root/evolution-api/docker-compose.yml" ]; then
    cd /root/evolution-api
    echo "Found docker-compose.yml"
    
    echo -e "${YELLOW}4. Starting with docker-compose...${NC}"
    docker-compose up -d
else
    echo -e "${YELLOW}4. Starting with docker run...${NC}"
    # Comando docker run di base - ADATTA secondo la tua config
    docker run -d \
      --name evolution_api \
      -p 8080:8080 \
      -e AUTHENTICATION_API_KEY=evolution_key_luca_2025_secure_21806 \
      -e DATABASE_CONNECTION_URI=mongodb://localhost:27017/evolution \
      -v evolution_data:/data \
      --restart always \
      evolution-api:2.3.3-custom
fi

echo -e "${YELLOW}5. Waiting for startup (30 seconds)...${NC}"
for i in {1..30}; do
    echo -n "."
    sleep 1
done
echo ""

echo -e "${YELLOW}6. Testing API...${NC}"
curl -s "http://localhost:8080/" | python3 -m json.tool | head -5

echo -e "${YELLOW}7. Checking container status...${NC}"
docker ps | grep evolution

echo -e "${GREEN}✅ Reset complete!${NC}"
echo ""
echo "Now you need to:"
echo "1. Reconnect WhatsApp (run ./reconnect-whatsapp.sh)"
echo "2. Test sending a message"
