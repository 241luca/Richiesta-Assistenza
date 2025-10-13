#!/bin/bash

# Reset AI Token Limits
# Resetta i limiti giornalieri dei token AI

echo "🤖 Resetting AI token limits..."

# Path al database
DB_NAME="assistenza_db"
DB_USER="postgres"

# Reset token count per tutti gli utenti
psql -U $DB_USER -d $DB_NAME <<EOF
-- Reset daily token usage
UPDATE user_ai_usage 
SET 
    daily_tokens_used = 0,
    last_reset_date = CURRENT_DATE
WHERE last_reset_date < CURRENT_DATE;

-- Log the reset
INSERT INTO system_logs (module, action, details, timestamp)
VALUES ('ai_system', 'token_reset', 
    json_build_object('reset_date', CURRENT_DATE, 'auto_reset', true),
    NOW());

-- Vacuum per ottimizzare
VACUUM ANALYZE user_ai_usage;
EOF

if [ $? -eq 0 ]; then
    echo "✅ AI token limits reset successfully"
    
    # Clear Redis cache for AI limits
    redis-cli DEL "ai:limits:*" > /dev/null 2>&1
    echo "✅ AI cache cleared"
    
    exit 0
else
    echo "❌ Failed to reset AI token limits"
    exit 1
fi