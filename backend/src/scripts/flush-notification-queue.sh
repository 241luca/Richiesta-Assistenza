#!/bin/bash

# Flush Notification Queue
# Pulisce gli elementi bloccati nella coda delle notifiche

echo "🧹 Flushing stale notification queue items..."

# Connetti a Redis e pulisci le code bloccate
redis-cli <<EOF
# Rimuovi job falliti
DEL bull:notification-queue:failed
# Rimuovi job bloccati da più di 1 ora
EVAL "
local staleTime = ARGV[1] - 3600000
local staleJobs = redis.call('ZRANGEBYSCORE', KEYS[1], 0, staleTime)
for i, jobId in ipairs(staleJobs) do
    redis.call('ZREM', KEYS[1], jobId)
    redis.call('DEL', 'bull:notification-queue:' .. jobId)
end
return #staleJobs
" 1 bull:notification-queue:delayed $(date +%s%3N)
EOF

if [ $? -eq 0 ]; then
    echo "✅ Notification queue flushed successfully"
    
    # Restart queue worker se necessario
    if pgrep -f "queue-worker" > /dev/null; then
        echo "🔄 Restarting queue worker..."
        pkill -f "queue-worker"
        sleep 2
        cd /Users/lucamambelli/Desktop/richiesta-assistenza/backend
        npm run queue:worker &
        echo "✅ Queue worker restarted"
    fi
    
    exit 0
else
    echo "❌ Failed to flush notification queue"
    exit 1
fi