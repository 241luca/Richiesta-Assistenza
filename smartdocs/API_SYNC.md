# SmartDocs Sync API Documentation

## 🎯 Overview

SmartDocs Sync API enables external applications to synchronize structured data into SmartDocs for AI-powered retrieval and analysis. This is an **enterprise-grade, multi-tenant** API designed for seamless integration.

## 🔑 Key Concepts

### Source Types
- **`auto_sync`**: Automatically synchronized data from external applications
- **`manual`**: Manually uploaded documents (PDFs, etc.)

### Entity Types
Common entity types for Richiesta Assistenza:
- `request`: Assistance requests
- `chat`: Chat conversations
- `quote`: Quotes/estimates
- `report`: Intervention reports
- `profile`: Professional profiles
- `form`: Filled forms

## 📡 API Endpoints

### Base URL
```
http://localhost:3500/api/sync
```

---

### 1. **Ingest Structured Data**

Synchronize an entity from your application to SmartDocs.

**Endpoint:** `POST /ingest`

**Request Body:**
```json
{
  "container_id": "uuid-of-container",
  "source_app": "richiesta_assistenza",
  "source_type": "auto_sync",
  "entity_type": "request",
  "entity_id": "request-123",
  "title": "Richiesta #123 - Riparazione Caldaia",
  "content": "RICHIESTA ASSISTENZA #123\nCliente: Mario Rossi\n...",
  "metadata": {
    "status": "completed",
    "client_name": "Mario Rossi",
    "created_at": "2025-01-15T10:00:00Z"
  },
  "auto_update": true,
  "chunk_size": 1000,
  "chunk_overlap": 200
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "documentId": "generated-uuid",
    "chunksCreated": 5
  },
  "message": "Successfully ingested request #request-123"
}
```

**Behavior:**
- Deletes existing chunks for the same entity (if any)
- Creates a virtual document
- Generates embeddings for all chunks
- Updates storage statistics

---

### 2. **Delete Entity**

Remove all chunks associated with an entity.

**Endpoint:** `DELETE /entity/:container_id/:entity_type/:entity_id`

**Query Parameters:**
- `source_app` (optional): Filter by source application

**Example:**
```
DELETE /entity/container-uuid/request/request-123?source_app=richiesta_assistenza
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted_count": 1
  },
  "message": "Deleted 1 document(s)"
}
```

---

### 3. **Get Storage Statistics**

Retrieve storage usage statistics for a container.

**Endpoint:** `GET /stats/:container_id`

**Response:**
```json
{
  "success": true,
  "data": {
    "auto_sync": {
      "total_documents": 15,
      "total_chunks": 127,
      "total_tokens": 45000,
      "storage_size_bytes": 234567,
      "breakdown": {
        "request": {
          "documents": 10,
          "chunks": 85,
          "tokens": 30000,
          "size_bytes": 150000,
          "source_app": "richiesta_assistenza"
        },
        "chat": {
          "documents": 5,
          "chunks": 42,
          "tokens": 15000,
          "size_bytes": 84567,
          "source_app": "richiesta_assistenza"
        }
      }
    },
    "manual": {
      "total_documents": 8,
      "total_chunks": 234,
      "total_tokens": 89000,
      "storage_size_bytes": 5432100
    },
    "total": {
      "total_documents": 23,
      "total_chunks": 361,
      "total_tokens": 134000,
      "storage_size_bytes": 5666667
    }
  }
}
```

---

## 🔗 Integration Examples

### Example 1: Sync Request on Create/Update

```typescript
// After creating or updating a request
import { smartdocsSyncService } from './services/smartdocs-sync.service';

async function syncRequestToSmartDocs(requestId: string) {
  const request = await fetchRequestWithRelations(requestId);
  
  const content = `
RICHIESTA ASSISTENZA #${request.id}
Cliente: ${request.client.name}
Categoria: ${request.category.name}
Descrizione: ${request.description}
...
  `;

  await smartdocsSyncService.syncEntity({
    containerId: request.professional.smartdocs_container_id,
    entityType: 'request',
    entityId: requestId,
    title: `Richiesta #${requestId}`,
    content,
    metadata: {
      status: request.status,
      client_name: request.client.name
    }
  });
}
```

### Example 2: Sync Chat Message

```typescript
// After a new chat message is created
async function syncChatMessage(messageId: string) {
  const message = await fetchMessage(messageId);
  const request = await fetchRequest(message.requestId);
  
  // Re-sync entire request to include new message
  await syncRequestToSmartDocs(message.requestId);
}
```

### Example 3: Delete on Request Deletion

```typescript
async function deleteRequestFromSmartDocs(requestId: string, containerId: string) {
  await smartdocsSyncService.deleteEntity(
    containerId,
    'request',
    requestId
  );
}
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│   External Application              │
│   (e.g., Richiesta Assistenza)      │
└────────────────┬────────────────────┘
                 │
                 │ HTTP POST /sync/ingest
                 ▼
┌─────────────────────────────────────┐
│   SmartDocs Sync API                │
├─────────────────────────────────────┤
│ • Validate request                  │
│ • Delete old chunks (if exists)     │
│ • Create virtual document           │
│ • Generate embeddings               │
│ • Update storage stats              │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│   SmartDocs Database                │
├─────────────────────────────────────┤
│ • documents (virtual docs)          │
│ • embeddings (chunks + vectors)     │
│ • storage_usage (statistics)        │
│ • sync_jobs (tracking)              │
└─────────────────────────────────────┘
```

---

## 📊 Database Schema

### documents table (extended)
```sql
ALTER TABLE smartdocs.documents ADD COLUMN
  source_type VARCHAR(20) DEFAULT 'manual',  -- 'manual' | 'auto_sync'
  entity_type VARCHAR(50),                    -- 'request' | 'chat' | etc.
  entity_id VARCHAR(255),                     -- External entity ID
  source_app VARCHAR(50) DEFAULT 'smartdocs', -- Application name
  last_synced_at TIMESTAMP,
  auto_update BOOLEAN DEFAULT false;
```

### storage_usage table
```sql
CREATE TABLE smartdocs.storage_usage (
  container_id UUID,
  source_type VARCHAR(20),
  source_app VARCHAR(50),
  entity_type VARCHAR(50),
  total_documents INTEGER,
  total_chunks INTEGER,
  total_tokens BIGINT,
  storage_size_bytes BIGINT,
  UNIQUE(container_id, source_type, source_app, entity_type)
);
```

### sync_jobs table (tracking)
```sql
CREATE TABLE smartdocs.sync_jobs (
  id UUID PRIMARY KEY,
  container_id UUID,
  source_app VARCHAR(50),
  entity_type VARCHAR(50),
  entity_id VARCHAR(255),
  status VARCHAR(20),  -- 'pending', 'running', 'completed', 'failed'
  chunks_created INTEGER,
  error_message TEXT
);
```

---

## 🚀 Quick Start

### 1. Register Your Application

```sql
INSERT INTO smartdocs.app_registry (app_name, app_key, description)
VALUES (
  'your_app_name',
  'app_' || gen_random_uuid()::text,
  'Your application description'
);
```

### 2. Create Container

```typescript
const container = await createContainer({
  userId: 'professional-user-id',
  categoryId: 'category-uuid',
  name: 'My Knowledge Base',
  settings: {
    auto_sync: true,
    sync_entities: ['request', 'chat']
  }
});
```

### 3. Start Syncing

```typescript
await smartdocsSyncService.syncEntity({
  containerId: container.id,
  entityType: 'request',
  entityId: '123',
  title: 'Request #123',
  content: 'Your serialized content...'
});
```

---

## 💡 Best Practices

### 1. **Serialize Data Consistently**
Always use the same format for serializing entities:
```
ENTITY_TYPE #ID
Field1: Value1
Field2: Value2

SECTION_NAME:
Section content...
```

### 2. **Include Context**
Add relevant metadata that helps with retrieval:
- Client name
- Category
- Status
- Dates
- Related entities

### 3. **Update Incrementally**
Only sync changed entities, not entire datasets.

### 4. **Monitor Storage**
Regularly check storage stats to optimize chunk sizes.

### 5. **Handle Errors Gracefully**
Log sync failures but don't break application flow.

---

## 🔒 Security

- API is **internal-only** (not exposed to public internet)
- Use environment variables for SmartDocs URL
- Validate `container_id` belongs to authenticated user
- Sanitize user input before syncing

---

## 📈 Performance

- **Chunk Size**: Default 1000 characters (configurable)
- **Chunk Overlap**: Default 200 characters
- **Batch Processing**: Sync jobs run asynchronously
- **Rate Limiting**: OpenAI embeddings have rate limits

---

## 🐛 Troubleshooting

### Issue: "Entity not syncing"
- Check container_id is correct
- Verify entity_type matches expected values
- Check sync_jobs table for errors

### Issue: "Too many chunks"
- Reduce chunk_size (e.g., to 800)
- Reduce chunk_overlap (e.g., to 150)
- Filter out verbose metadata

### Issue: "Storage growing too fast"
- Review what's being synced
- Remove old/irrelevant entities
- Optimize serialization format

---

## 📞 Support

For issues or questions:
- Check `sync_jobs` table for error messages
- Review SmartDocs logs: `docker logs smartdocs-api`
- Monitor storage stats regularly

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-25
