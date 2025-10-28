#!/bin/bash

# Upload test document to SmartDocs
# This will trigger semantic chunking + knowledge graph extraction

API_BASE="http://localhost:3500/api"
CONTAINER_ID="155ea39d-1c6a-41ae-9be1-9c348dfa48af"  # Procedure container
FILE_PATH="./technical-manual.txt"

echo "🚀 SmartDocs - Test Document Upload"
echo "======================================"
echo ""

# Check if file exists
if [ ! -f "$FILE_PATH" ]; then
    echo "❌ Error: $FILE_PATH not found"
    exit 1
fi

echo "📄 Reading document..."
CONTENT=$(cat "$FILE_PATH")
TITLE="Manuale HVAC - Test Knowledge Graph"

echo "📤 Uploading to SmartDocs API..."
echo ""

# Create sync job via API
RESPONSE=$(curl -s -X POST "${API_BASE}/sync/ingest" \
    -H "Content-Type: application/json" \
    -d "{
        \"container_id\": \"${CONTAINER_ID}\",
        \"source_app\": \"test-upload\",
        \"entity_type\": \"procedure\",
        \"entity_id\": \"test-hvac-manual-$(date +%s)\",
        \"source_type\": \"manual\",
        \"title\": \"${TITLE}\",
        \"content\": $(echo "$CONTENT" | jq -Rs .),
        \"metadata\": {
            \"source\": \"test\",
            \"uploaded_at\": \"$(date -Iseconds)\"
        }
    }")

echo "Response:"
echo "$RESPONSE" | jq '.'
echo ""

# Extract job ID
JOB_ID=$(echo "$RESPONSE" | jq -r '.data.id // empty')

if [ -z "$JOB_ID" ]; then
    echo "❌ Failed to create sync job"
    exit 1
fi

echo "✅ Job created: $JOB_ID"
echo ""
echo "⏳ Processing will happen automatically via worker..."
echo "   Check status at: ${API_BASE}/sync/jobs/${JOB_ID}"
echo ""
echo "🔍 Monitor logs:"
echo "   docker logs -f smartdocs-worker"
echo ""
echo "📊 View Knowledge Graph:"
echo "   http://localhost:3501/knowledge-graph.html"
echo ""
