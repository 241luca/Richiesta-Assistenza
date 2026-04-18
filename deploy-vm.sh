#!/bin/bash
# Script deploy completo sulla VM 103
# Da eseguire dal Mac dopo che la VM ha finito il build Docker

SSH_KEY="$HOME/.ssh/id_ed25519_github"
VM_IP="${1:-100.101.202.35}"  # Usa Tailscale di default, LAN come secondo argomento
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=20 -o ServerAliveInterval=15 -o ServerAliveCountMax=10"
REMOTE="santrack@$VM_IP"

echo "=== DEPLOY RICHIESTA ASSISTENZA ==="
echo "VM: $VM_IP"
echo ""

# 1. Verifica connessione
echo "1. Verifica connessione SSH..."
if ! ssh $SSH_OPTS $REMOTE "echo 'OK'" 2>/dev/null; then
  echo "❌ SSH non disponibile su $VM_IP"
  echo "Prova: $0 192.168.0.203"
  exit 1
fi
echo "✅ SSH OK"

# 2. Stato attuale container
echo ""
echo "2. Stato container attuale:"
ssh $SSH_OPTS $REMOTE "cd /home/santrack/richiesta-assistenza && sudo docker compose ps"

# 3. Se il build è già completato, riavvia i container
echo ""
echo "3. Riavvio container con immagini aggiornate..."
ssh $SSH_OPTS $REMOTE "
  cd /home/santrack/richiesta-assistenza
  
  # Controlla se c'è ancora un build in corso
  if sudo docker compose ps | grep -q 'Build\|building'; then
    echo '⏳ Build ancora in corso, attendi...'
    exit 1
  fi
  
  # Riavvia i container
  echo 'Riavvio backend...'
  sudo docker compose restart backend
  sleep 5
  
  echo 'Riavvio frontend...'
  sudo docker compose restart frontend
  sleep 3
  
  echo ''
  echo '=== STATO FINALE ==='
  sudo docker compose ps
  
  echo ''
  echo '=== LOG BACKEND (ultimi 20 righe) ==='
  sudo docker logs assistenza-backend --tail 20
" 2>&1

echo ""
echo "=== VERIFICA HEALTH ==="
curl -s --max-time 10 http://$VM_IP:3200/api/health 2>/dev/null | head -c 200 || echo "Health check non raggiungibile ancora"

echo ""
echo "✅ Deploy completato"
