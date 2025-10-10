#!/bin/bash

# SETUP COMPLETO VPS HETZNER
# Installa TUTTO per Richiesta Assistenza

echo "🚀 SETUP VPS HETZNER - RICHIESTA ASSISTENZA"
echo "==========================================="
echo ""

# 1. AGGIORNAMENTO SISTEMA
echo "📦 Aggiornamento sistema..."
apt update && apt upgrade -y

# 2. INSTALLA NODE.JS
echo "📦 Installazione Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 3. INSTALLA POSTGRESQL
echo "🗄️ Installazione PostgreSQL..."
apt install -y postgresql postgresql-contrib

# 4. INSTALLA REDIS
echo "💾 Installazione Redis..."
apt install -y redis-server

# 5. INSTALLA NGINX
echo "🌐 Installazione Nginx..."
apt install -y nginx

# 6. INSTALLA PM2 (mantiene app attiva)
echo "🔄 Installazione PM2..."
npm install -g pm2

# 7. INSTALLA DOCKER (per Evolution API)
echo "🐳 Installazione Docker..."
curl -fsSL https://get.docker.com | bash

# 8. CLONA LA TUA APP
echo "📱 Download Richiesta Assistenza..."
cd /var/www
git clone https://github.com/241luca/Richiesta-Assistenza.git
cd Richiesta-Assistenza

# 9. INSTALLA DIPENDENZE
echo "📦 Installazione dipendenze..."
npm install
cd backend && npm install
npx prisma generate
cd ..

# 10. CONFIGURA DATABASE
echo "🗄️ Configurazione database..."
sudo -u postgres psql <<EOF
CREATE DATABASE richiesta_assistenza;
CREATE USER app_user WITH PASSWORD 'password_sicura';
GRANT ALL PRIVILEGES ON DATABASE richiesta_assistenza TO app_user;
EOF

# 11. CONFIGURA ENVIRONMENT
echo "⚙️ Configurazione .env..."
cat > backend/.env <<EOF
DATABASE_URL="postgresql://app_user:password_sicura@localhost:5432/richiesta_assistenza"
JWT_SECRET="your-secret-key"
PORT=3200
FRONTEND_URL="http://YOUR_IP:5193"
EOF

# 12. AVVIA EVOLUTION API
echo "📱 Avvio Evolution API..."
docker run -d \
  --name evolution \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=evolution-key \
  --restart always \
  atendai/evolution-api

# 13. AVVIA L'APPLICAZIONE
echo "🚀 Avvio Richiesta Assistenza..."
cd backend
pm2 start "npm run dev" --name backend
cd ..
pm2 start "npm run dev" --name frontend

# 14. CONFIGURA NGINX
echo "🌐 Configurazione Nginx..."
cat > /etc/nginx/sites-available/richiesta-assistenza <<EOF
server {
    listen 80;
    server_name YOUR_IP;

    # Frontend
    location / {
        proxy_pass http://localhost:5193;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

ln -s /etc/nginx/sites-available/richiesta-assistenza /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# 15. CONFIGURA FIREWALL
echo "🔒 Configurazione firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

# 16. SALVA PROCESSI PM2
pm2 save
pm2 startup

echo ""
echo "✅ ✅ ✅ INSTALLAZIONE COMPLETATA! ✅ ✅ ✅"
echo ""
echo "📱 La tua app è ora accessibile:"
echo "   Frontend: http://YOUR_IP"
echo "   Backend: http://YOUR_IP/api"
echo "   Evolution: http://YOUR_IP:8080"
echo ""
echo "📌 Prossimi passi:"
echo "1. Configura un dominio"
echo "2. Installa certificato SSL"
echo "3. Configura backup automatici"
echo ""
echo "🎉 Richiesta Assistenza è ONLINE!"
