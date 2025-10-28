# 🚀 SMARTDOCS ENTERPRISE - QUICK START GUIDE

**Version**: 1.0.0 Enterprise Edition  
**Status**: ✅ Production Ready  
**Last Updated**: October 26, 2025

---

## 📍 ACCESS URLS

| Service | URL | Status |
|---------|-----|--------|
| **Admin UI** | http://localhost:3501 | ✅ Running |
| **Knowledge Graph** | http://localhost:3501/knowledge-graph.html | ✅ Running |
| **API** | http://localhost:3500/api | ✅ Running |
| **Health Check** | http://localhost:3500/health | ✅ Running |

---

## 🎯 VIEW KNOWLEDGE GRAPH NOW

### Option 1: Direct Access
1. Open browser: `http://localhost:3501/knowledge-graph.html`
2. Select document from dropdown (2 test documents available)
3. Click **"Carica Grafo"**
4. Explore the interactive graph!

### Option 2: Via Admin UI
1. Open: `http://localhost:3501`
2. Click **"Knowledge Graph"** in sidebar (with green "NEW" badge)
3. Same as Option 1

---

## 📊 TEST DOCUMENTS AVAILABLE

### Document #1: HVAC Professional System
- **ID**: `cdf6be6a-37b3-45ad-872c-32c522fda957`
- **Entities**: 42
- **Relationships**: 1
- **Title**: "HVAC Professional System"

### Document #2: Boiler Maintenance Procedure
- **ID**: `334b55bc-995b-4c1a-b00b-0e25a6974f25`
- **Entities**: 50
- **Relationships**: 9
- **Title**: "Procedura Manutenzione Caldaia"

**Recommended**: Start with Document #2 (more relationships = better graph!)

---

## 🔧 SERVICES STATUS

Check all services are running:

```bash
# Check Worker
ps aux | grep "ts-node src/worker.ts"

# Check API
curl http://localhost:3500/health

# Check Admin UI
curl http://localhost:3501

# Check Database
docker exec smartdocs-db psql -U smartdocs -d smartdocs -c "SELECT COUNT(*) FROM smartdocs.kg_entities;"
```

Expected results:
- Worker: Process running
- API: Returns JSON with status
- Admin UI: Returns HTML
- Database: Returns count > 0

---

## 📖 USEFUL COMMANDS

### View All Entities
```bash
curl "http://localhost:3500/api/knowledge-graph/entities?limit=10" | jq
```

### View Graph for Document
```bash
curl "http://localhost:3500/api/knowledge-graph/graph/334b55bc-995b-4c1a-b00b-0e25a6974f25" | jq
```

### Check Sync Jobs
```bash
curl "http://localhost:3500/api/sync/jobs" | jq
```

### Database Queries
```bash
# Count entities by type
docker exec smartdocs-db psql -U smartdocs -d smartdocs -c "
SELECT type, COUNT(*) 
FROM smartdocs.kg_entities 
GROUP BY type 
ORDER BY COUNT(*) DESC;
"

# View relationships
docker exec smartdocs-db psql -U smartdocs -d smartdocs -c "
SELECT 
    e1.name as from_entity,
    r.relationship_type,
    e2.name as to_entity,
    r.strength
FROM smartdocs.kg_relationships r
JOIN smartdocs.kg_entities e1 ON r.entity1_id = e1.id
JOIN smartdocs.kg_entities e2 ON r.entity2_id = e2.id
ORDER BY r.strength DESC
LIMIT 10;
"
```

---

## 🧪 CREATE NEW TEST DOCUMENT

```bash
# Create a new sync job
docker exec smartdocs-db psql -U smartdocs -d smartdocs -c "
INSERT INTO smartdocs.sync_jobs (
    container_id, source_app, entity_type, entity_id,
    source_type, status, content, metadata
) VALUES (
    '155ea39d-1c6a-41ae-9be1-9c348dfa48af',
    'manual-test',
    'procedure',
    uuid_generate_v4(),
    'test',
    'pending',
    '{\"text\": \"YOUR TEXT HERE\"}',
    '{\"title\": \"Your Document Title\"}'
) RETURNING id, entity_id;
"

# Wait 10 seconds for processing
sleep 10

# Check status
docker exec smartdocs-db psql -U smartdocs -d smartdocs -c "
SELECT status, chunks_created, error_message 
FROM smartdocs.sync_jobs 
ORDER BY created_at DESC 
LIMIT 1;
"
```

---

## 🐛 TROUBLESHOOTING

### Graph Not Loading
1. Check document exists: `curl http://localhost:3500/api/documents`
2. Check entities exist: `curl http://localhost:3500/api/knowledge-graph/entities`
3. Lower importance threshold to 0.3
4. Check browser console (F12) for errors

### Worker Not Processing
1. Check if running: `ps aux | grep worker`
2. Restart: `cd smartdocs && npm run worker`
3. Check logs: `tail -f /tmp/worker.log`

### API Not Responding
1. Check if running: `lsof -i:3500`
2. Restart: `cd smartdocs && npm run dev`
3. Check health: `curl http://localhost:3500/health`

### Database Connection Issues
1. Check Docker: `docker ps | grep smartdocs-db`
2. Test connection: `docker exec smartdocs-db psql -U smartdocs -d smartdocs -c "SELECT 1;"`
3. Restart container: `docker restart smartdocs-db`

---

## 📚 DOCUMENTATION

| Document | Location | Description |
|----------|----------|-------------|
| **Implementation Guide** | `IMPLEMENTATION-COMPLETE.md` | Full implementation details |
| **KG Visualization Guide** | `KNOWLEDGE-GRAPH-VISUALIZATION.md` | Frontend user guide |
| **Test Results** | `TEST-RESULTS-REPORT.md` | Complete test report |
| **Testing Summary** | `TESTING-COMPLETE-SUMMARY.md` | Final summary |

---

## 🎨 VISUALIZATION FEATURES

### Interactive Controls
- **Zoom**: Mouse wheel
- **Pan**: Click & drag canvas
- **Select Node**: Click any node
- **Focus**: Double-click node
- **Fit Graph**: Click "Fit" button
- **Reset Zoom**: Click "Reset" button

### Filters
- **By Type**: COMPONENT, TASK, CONCEPT, PROCESS, ROLE
- **By Importance**: Slider (0.0 - 1.0)
- **By Document**: Dropdown selector

### Node Colors
- 🔵 Blue = COMPONENT (compressore, filtro, etc.)
- 🟢 Green = TASK (controllare, verificare, etc.)
- 🟡 Yellow = CONCEPT (temperatura, pressione, etc.)
- 🟣 Purple = PROCESS (manutenzione, ciclo, etc.)
- 🩷 Pink = ROLE (tecnico, operatore, etc.)
- ⚫ Gray = OTHER

---

## ⚡ PERFORMANCE TIPS

### For Better Graphs
1. Use documents with 500-2000 words
2. Technical content works best
3. Include relationships in text (e.g., "X is part of Y")
4. Use Italian language
5. Include procedures and tasks

### Optimal Settings
- **Min Importance**: 0.5 (balanced)
- **Max Nodes**: 50-100 (readable)
- **Document Type**: Technical procedures

---

## 🚀 NEXT STEPS

### Ready to Use!
1. ✅ Open Knowledge Graph viewer
2. ✅ Select a test document
3. ✅ Explore the interactive graph
4. ✅ Try different filters
5. ✅ Create your own documents

### Want More Data?
1. Process more documents via sync jobs
2. Import real technical manuals
3. Test with different content types
4. Compare semantic vs. fixed chunking

---

## 📞 SUPPORT

### Logs Location
- **Worker**: `/tmp/worker.log`
- **API**: Console output
- **Database**: `docker logs smartdocs-db`

### Common Issues
- **Empty graph**: Lower importance threshold
- **Too many nodes**: Increase min importance
- **No relationships**: Document too short
- **Slow loading**: Reduce max_nodes

---

## ✅ VERIFICATION CHECKLIST

Before using, verify:
- [ ] Database has entities: `SELECT COUNT(*) FROM smartdocs.kg_entities;` → > 0
- [ ] API responds: `curl http://localhost:3500/health` → 200 OK
- [ ] Admin UI loads: `curl http://localhost:3501` → 200 OK
- [ ] Worker running: `ps aux | grep worker` → Process found
- [ ] Test documents exist: Check dropdown in KG page

---

**Everything is ready! Start exploring your Knowledge Graph now! 🎉**

**Direct Link**: http://localhost:3501/knowledge-graph.html
