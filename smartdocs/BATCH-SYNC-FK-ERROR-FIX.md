# 🔧 BATCH SYNC FK ERROR - ROOT CAUSE & FIX

**Date**: 26 October 2025  
**Error**: `insert or update on table "sync_jobs" violates foreign key constraint "sync_jobs_container_id_fkey"`  
**Status**: ✅ **FIXED**

---

## 🐛 **ERROR DESCRIPTION**

### **User Report**:
```
Error in console:
POST http://localhost:3500/api/sync/ingest 500 (Internal Server Error)

Database error:
insert or update on table "sync_jobs" violates foreign key constraint "sync_jobs_container_id_fkey"
```

### **When It Happens**:
- User clicks "Batch Test Sync" button in SmartDocs Admin Page
- 20 test requests are sent to `POST /api/sync/ingest`
- First few succeed, then FK violation error occurs

---

## 🔍 **ROOT CAUSE ANALYSIS**

### **Problem #1: Wrong API Endpoint in Frontend** 🔴

**File**: `/src/pages/admin/SmartDocsPage.tsx`  
**Line**: 115

```typescript
// ❌ WRONG - Loading from old endpoint
const response = await api.get('http://localhost:3500/api/container-instances');
```

**Impact**:
- Frontend was loading containers from `/api/container-instances` (old table)
- This table doesn't exist or has different IDs
- When user selects a container, the ID is invalid for the new [containers](file:///Users/lucamambelli/Desktop/Richiesta-Assistenza/src/components/smartdocs/ContainerList.tsx#L10-L10) table
- Sync API tries to insert with invalid container_id → FK violation

---

### **Problem #2: No Container Validation in Backend** 🔴

**File**: `/smartdocs/src/services/StructuredDataIngestionService.ts`  
**Method**: [ingestStructuredData](file:///Users/lucamambelli/Desktop/Richiesta-Assistenza/smartdocs/src/services/StructuredDataIngestionService.ts#L41-L197)

```typescript
// ❌ BEFORE - No validation
async ingestStructuredData(params) {
  const { container_id, ... } = params;
  
  // Directly tries to create sync job without checking if container exists
  const jobId = await this.createSyncJob({
    container_id,  // ← This might be invalid!
    ...
  });
```

**Impact**:
- Backend accepts any container_id value
- Tries to insert into `sync_jobs` with FK to [containers(id)](file:///Users/lucamambelli/Desktop/Richiesta-Assistenza/src/components/smartdocs/ContainerList.tsx#L10-L10)
- If container_id doesn't exist → FK constraint violation
- Error is cryptic and doesn't explain the real problem

---

## ✅ **FIXES APPLIED**

### **Fix #1: Correct API Endpoint in Frontend** ✅

**File**: `/src/pages/admin/SmartDocsPage.tsx`  
**Line**: 115

```typescript
// ✅ FIXED - Loading from correct endpoint
const loadContainers = async () => {
  try {
    // Use the correct API endpoint for containers
    const response = await api.get('http://localhost:3500/api/containers');
    if (response.data.success) {
      setContainers(response.data.data);
    }
  } catch (err) {
    console.error('Failed to load containers:', err);
  }
};
```

**Result**:
- Frontend now loads containers from the correct `/api/containers` endpoint
- Container IDs are valid UUIDs from the [containers](file:///Users/lucamambelli/Desktop/Richiesta-Assistenza/src/components/smartdocs/ContainerList.tsx#L10-L10) table
- User can only select valid containers

---

### **Fix #2: Add Container Validation in Backend** ✅

**File**: `/smartdocs/src/services/StructuredDataIngestionService.ts`  
**Method**: [ingestStructuredData](file:///Users/lucamambelli/Desktop/Richiesta-Assistenza/smartdocs/src/services/StructuredDataIngestionService.ts#L41-L197)

```typescript
// ✅ FIXED - Validate container exists before processing
async ingestStructuredData(params: IngestStructuredDataParams): Promise<{
  documentId: string;
  chunksCreated: number;
}> {
  const {
    container_id,
    source_app,
    source_type,
    entity_type,
    entity_id,
    title,
    content,
    metadata = {},
    auto_update = true,
    chunk_size = 1000,
    chunk_overlap = 200
  } = params;

  logger.info(`[StructuredDataIngestion] Ingesting ${entity_type} #${entity_id} from ${source_app}`);

  // ✅ NEW: Validate container exists
  const containerCheck = await this.db.query(
    'SELECT id FROM smartdocs.containers WHERE id = $1',
    [container_id]
  );
  
  if (containerCheck.rows.length === 0) {
    throw new Error(`Container ${container_id} not found. Please ensure the container exists before syncing.`);
  }

  // Now safe to create sync job
  const jobId = await this.createSyncJob({
    container_id,
    source_app,
    entity_type,
    entity_id
  });
  
  // ... rest of the code
}
```

**Result**:
- Backend now validates container_id before processing
- Clear error message if container doesn't exist
- Prevents FK violation errors
- Better debugging experience

---

## 🧪 **TESTING**

### **Test #1: Verify Containers Load Correctly** ✅

```bash
# Check frontend can load containers
curl -s http://localhost:3500/api/containers | jq '.data | length'
# Expected: 4
```

**Result**: ✅ **PASS** - 4 containers returned

---

### **Test #2: Verify Container Validation Works** ⏳

```bash
# Try to sync with invalid container_id
curl -X POST http://localhost:3500/api/sync/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "container_id": "invalid-uuid-12345",
    "source_app": "test",
    "entity_type": "test",
    "entity_id": "test-001",
    "title": "Test",
    "content": "Test content"
  }'

# Expected: HTTP 500 with error message:
# "Container invalid-uuid-12345 not found. Please ensure the container exists before syncing."
```

**To Test**: Run this command and verify clear error message

---

### **Test #3: Batch Sync with Valid Container** ⏳

```bash
# Steps:
1. Open http://localhost:5193/admin/smartdocs
2. Refresh the page (Ctrl+R or Cmd+R)
3. Go to "Sync Test" tab
4. Select a container from the dropdown
5. Click "Batch Test Sync"
6. Confirm modal
7. Wait for 20 requests to complete

# Expected:
- All 20 requests should succeed
- No FK constraint errors
- Progress bar shows 20/20
- Success count: 20/20
```

**Status**: ⏳ **REQUIRES MANUAL TEST**

---

## 📋 **CHECKLIST**

### **Backend Fixes** ✅
- [x] Container validation added to [ingestStructuredData](file:///Users/lucamambelli/Desktop/Richiesta-Assistenza/smartdocs/src/services/StructuredDataIngestionService.ts#L41-L197)
- [x] Clear error message for invalid container_id
- [x] SmartDocs API restarted
- [x] Health check confirms API is running

### **Frontend Fixes** ✅
- [x] Changed endpoint from `/api/container-instances` to `/api/containers`
- [x] Frontend now loads valid container UUIDs
- [x] User can only select from existing containers

### **Database** ✅
- [x] FK constraint `sync_jobs_container_id_fkey` points to [containers(id)](file:///Users/lucamambelli/Desktop/Richiesta-Assistenza/src/components/smartdocs/ContainerList.tsx#L10-L10)
- [x] 4 valid containers exist in database
- [x] No orphaned records

### **Testing** ⏳
- [x] API health check passes
- [x] Containers endpoint returns valid data
- [ ] Invalid container_id rejected with clear error
- [ ] Batch sync test works with 20 requests
- [ ] No FK violations

---

## 🎯 **WHAT TO TEST NOW**

### **Immediate Test** (Required):

1. **Refresh the Admin Page**:
   ```
   Open: http://localhost:5193/admin/smartdocs
   Press: Ctrl+R (Windows) or Cmd+R (Mac)
   ```

2. **Verify Container Dropdown**:
   - Go to "Sync Test" tab
   - Check if container dropdown shows valid containers
   - Should see:
     - Test Container Verifica
     - Test Container for Sync
     - Interventi Cliente
     - Gestione casa

3. **Run Batch Sync Test**:
   - Select any container from dropdown
   - Click "Batch Test Sync"
   - Confirm the modal
   - Wait for completion

**Expected Result**:
```
✅ Batch completato! 20/20 richieste sincronizzate
```

**If Error Occurs**:
- Check browser console for error details
- Check SmartDocs API logs: `docker logs smartdocs-api --tail 50`
- Verify container_id being sent in request payload

---

## 📊 **BEFORE vs AFTER**

### **BEFORE** ❌

```typescript
// Frontend loads from wrong endpoint
GET /api/container-instances
→ Returns invalid/old container IDs

// User selects "invalid" container
container_id: "old-instance-id-123"

// Backend tries to sync
POST /api/sync/ingest
→ INSERT INTO sync_jobs (container_id, ...) VALUES ('old-instance-id-123', ...)
→ FK constraint violation: container 'old-instance-id-123' not found in containers table
→ ERROR 500
```

---

### **AFTER** ✅

```typescript
// Frontend loads from correct endpoint
GET /api/containers
→ Returns valid container UUIDs from containers table

// User selects valid container
container_id: "761b8802-ed3b-4af1-b3d3-f974807d1109"

// Backend validates container exists
SELECT id FROM containers WHERE id = '761b8802-ed3b-4af1-b3d3-f974807d1109'
→ Found! ✅

// Backend syncs successfully
POST /api/sync/ingest
→ INSERT INTO sync_jobs (container_id, ...) VALUES ('761b8802-ed3b-4af1-b3d3-f974807d1109', ...)
→ FK constraint satisfied
→ SUCCESS 200 ✅
```

---

## 🚀 **NEXT STEPS**

1. ⏳ **Refresh Admin Page** and test manually
2. ⏳ **Run Batch Sync Test** with valid container
3. ⏳ **Test other pages** (client, professional)
4. ⏳ **Test auto-sync** from requests/reports

---

## 📝 **SUMMARY**

**Problem**: FK constraint violation when syncing due to:
1. Frontend loading containers from old endpoint
2. Backend not validating container existence

**Solution**:
1. ✅ Fixed frontend to use `/api/containers`
2. ✅ Added container validation in backend
3. ✅ Clear error messages
4. ✅ API restarted

**Status**: 🟢 **READY FOR TESTING**

---

**Fix applied**: 26 October 2025  
**Services restarted**: SmartDocs API  
**Testing required**: Manual batch sync test
