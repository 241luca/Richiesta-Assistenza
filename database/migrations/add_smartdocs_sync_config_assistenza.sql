-- ============================================================================
-- SMARTDOCS SYNC CONFIGURATION SCHEMA - For Richiesta Assistenza DB
-- Simplified version without cross-database foreign keys
-- ============================================================================

-- Create schema
CREATE SCHEMA IF NOT EXISTS smartdocs;

-- ============================================================================
-- 1. GLOBAL SYNC CONFIGURATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS smartdocs.sync_config (
  id SERIAL PRIMARY KEY,
  
  -- Global enable/disable
  enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Default container (stored as UUID string, no FK)
  default_container_id UUID,
  
  -- Data types to sync (global defaults)
  sync_requests BOOLEAN NOT NULL DEFAULT true,
  sync_chats BOOLEAN NOT NULL DEFAULT true,
  sync_quotes BOOLEAN NOT NULL DEFAULT true,
  sync_reports BOOLEAN NOT NULL DEFAULT true,
  sync_profiles BOOLEAN NOT NULL DEFAULT true,
  sync_forms BOOLEAN NOT NULL DEFAULT true,
  sync_payments BOOLEAN NOT NULL DEFAULT false,
  
  -- Chunking settings
  chunk_size INTEGER NOT NULL DEFAULT 1000,
  chunk_overlap INTEGER NOT NULL DEFAULT 200,
  
  -- Auto-sync behavior
  auto_sync_delay_ms INTEGER NOT NULL DEFAULT 5000,
  batch_sync_enabled BOOLEAN NOT NULL DEFAULT true,
  batch_sync_size INTEGER NOT NULL DEFAULT 50,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Singleton index
CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_config_singleton ON smartdocs.sync_config ((true));

-- Default config
INSERT INTO smartdocs.sync_config (enabled) 
VALUES (true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. CATEGORY SYNC EXCLUSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS smartdocs.category_sync_exclusions (
  id SERIAL PRIMARY KEY,
  
  -- References to categories (NO FK - verified at app level)
  category_id INTEGER,
  subcategory_id INTEGER,
  
  -- Exclusion flag
  excluded BOOLEAN NOT NULL DEFAULT true,
  reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER,  -- NO FK
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_category_exclusion UNIQUE(category_id, subcategory_id)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_category_exclusions_category 
  ON smartdocs.category_sync_exclusions(category_id) WHERE excluded = true;

CREATE INDEX IF NOT EXISTS idx_category_exclusions_subcategory 
  ON smartdocs.category_sync_exclusions(subcategory_id) WHERE excluded = true;

-- ============================================================================
-- 3. USER SYNC OVERRIDES
-- ============================================================================

CREATE TABLE IF NOT EXISTS smartdocs.user_sync_overrides (
  id SERIAL PRIMARY KEY,
  
  -- User reference (polymorphic - NO FK)
  user_id INTEGER NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('client', 'professional')),
  
  -- Enable/disable sync
  enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Custom container (UUID, no FK)
  custom_container_id UUID,
  
  -- Data type overrides (NULL = use global)
  sync_requests BOOLEAN DEFAULT NULL,
  sync_chats BOOLEAN DEFAULT NULL,
  sync_quotes BOOLEAN DEFAULT NULL,
  sync_reports BOOLEAN DEFAULT NULL,
  sync_profiles BOOLEAN DEFAULT NULL,
  sync_forms BOOLEAN DEFAULT NULL,
  sync_payments BOOLEAN DEFAULT NULL,
  
  -- Additional settings
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER,  -- NO FK
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_user_override UNIQUE(user_id, user_type)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_user_overrides_user 
  ON smartdocs.user_sync_overrides(user_id, user_type);

CREATE INDEX IF NOT EXISTS idx_user_overrides_enabled 
  ON smartdocs.user_sync_overrides(enabled);

-- ============================================================================
-- 4. ENTITY SYNC EXCLUSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS smartdocs.entity_sync_exclusions (
  id SERIAL PRIMARY KEY,
  
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('request', 'chat', 'quote', 'report', 'profile', 'form', 'payment')),
  entity_id VARCHAR(255) NOT NULL,
  
  excluded BOOLEAN NOT NULL DEFAULT true,
  reason TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER,  -- NO FK
  
  CONSTRAINT unique_entity_exclusion UNIQUE(entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_exclusions_lookup 
  ON smartdocs.entity_sync_exclusions(entity_type, entity_id) WHERE excluded = true;

-- ============================================================================
-- 5. HELPER VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW smartdocs.v_category_exclusions AS
SELECT 
  e.id,
  e.category_id,
  c.name as category_name,
  e.subcategory_id,
  sc.name as subcategory_name,
  e.excluded,
  e.reason,
  e.created_at
FROM smartdocs.category_sync_exclusions e
LEFT JOIN "Category" c ON c.id = e.category_id
LEFT JOIN "Subcategory" sc ON sc.id = e.subcategory_id
WHERE e.excluded = true;

CREATE OR REPLACE VIEW smartdocs.v_user_sync_overrides AS
SELECT 
  o.id,
  o.user_id,
  o.user_type,
  CASE 
    WHEN o.user_type = 'client' THEN 
      (SELECT CONCAT("firstName", ' ', "lastName") FROM "Client" WHERE id = o.user_id)
    WHEN o.user_type = 'professional' THEN 
      (SELECT CONCAT("firstName", ' ', "lastName") FROM "Professional" WHERE id = o.user_id)
  END as user_name,
  o.enabled,
  o.custom_container_id,
  o.sync_requests,
  o.sync_chats,
  o.sync_quotes,
  o.sync_reports,
  o.notes,
  o.created_at
FROM smartdocs.user_sync_overrides o;

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION smartdocs.is_sync_enabled_for_request(
  p_request_id INTEGER,
  p_category_id INTEGER DEFAULT NULL,
  p_subcategory_id INTEGER DEFAULT NULL,
  p_user_id INTEGER DEFAULT NULL,
  p_user_type VARCHAR DEFAULT 'client'
) RETURNS BOOLEAN AS $$
DECLARE
  v_global_enabled BOOLEAN;
  v_sync_requests BOOLEAN;
  v_category_excluded BOOLEAN;
  v_user_enabled BOOLEAN;
  v_user_sync_requests BOOLEAN;
  v_entity_excluded BOOLEAN;
BEGIN
  -- 1. Global config
  SELECT enabled, sync_requests 
  INTO v_global_enabled, v_sync_requests
  FROM smartdocs.sync_config LIMIT 1;
  
  IF NOT v_global_enabled OR NOT v_sync_requests THEN
    RETURN false;
  END IF;
  
  -- 2. Category exclusion
  IF p_category_id IS NOT NULL OR p_subcategory_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM smartdocs.category_sync_exclusions
      WHERE excluded = true
      AND ((category_id = p_category_id AND subcategory_id IS NULL) OR (subcategory_id = p_subcategory_id))
    ) INTO v_category_excluded;
    
    IF v_category_excluded THEN
      RETURN false;
    END IF;
  END IF;
  
  -- 3. User override
  IF p_user_id IS NOT NULL THEN
    SELECT enabled, sync_requests 
    INTO v_user_enabled, v_user_sync_requests
    FROM smartdocs.user_sync_overrides
    WHERE user_id = p_user_id AND user_type = p_user_type;
    
    IF FOUND THEN
      IF NOT v_user_enabled THEN
        RETURN false;
      END IF;
      IF v_user_sync_requests IS NOT NULL AND NOT v_user_sync_requests THEN
        RETURN false;
      END IF;
    END IF;
  END IF;
  
  -- 4. Entity exclusion
  SELECT EXISTS(
    SELECT 1 FROM smartdocs.entity_sync_exclusions
    WHERE entity_type = 'request' AND entity_id = p_request_id::TEXT AND excluded = true
  ) INTO v_entity_excluded;
  
  IF v_entity_excluded THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION smartdocs.get_user_sync_config(
  p_user_id INTEGER,
  p_user_type VARCHAR
) RETURNS TABLE(
  sync_requests BOOLEAN,
  sync_chats BOOLEAN,
  sync_quotes BOOLEAN,
  sync_reports BOOLEAN,
  sync_profiles BOOLEAN,
  sync_forms BOOLEAN,
  container_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(o.sync_requests, c.sync_requests) as sync_requests,
    COALESCE(o.sync_chats, c.sync_chats) as sync_chats,
    COALESCE(o.sync_quotes, c.sync_quotes) as sync_quotes,
    COALESCE(o.sync_reports, c.sync_reports) as sync_reports,
    COALESCE(o.sync_profiles, c.sync_profiles) as sync_profiles,
    COALESCE(o.sync_forms, c.sync_forms) as sync_forms,
    COALESCE(o.custom_container_id, c.default_container_id) as container_id
  FROM smartdocs.sync_config c
  LEFT JOIN smartdocs.user_sync_overrides o 
    ON o.user_id = p_user_id AND o.user_type = p_user_type
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION smartdocs.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_config_updated_at ON smartdocs.sync_config;
CREATE TRIGGER trigger_sync_config_updated_at
  BEFORE UPDATE ON smartdocs.sync_config
  FOR EACH ROW
  EXECUTE FUNCTION smartdocs.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_user_overrides_updated_at ON smartdocs.user_sync_overrides;
CREATE TRIGGER trigger_user_overrides_updated_at
  BEFORE UPDATE ON smartdocs.user_sync_overrides
  FOR EACH ROW
  EXECUTE FUNCTION smartdocs.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_category_exclusions_updated_at ON smartdocs.category_sync_exclusions;
CREATE TRIGGER trigger_category_exclusions_updated_at
  BEFORE UPDATE ON smartdocs.category_sync_exclusions
  FOR EACH ROW
  EXECUTE FUNCTION smartdocs.update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
  'sync_config' as table_name, COUNT(*) as row_count FROM smartdocs.sync_config
UNION ALL
SELECT 'category_sync_exclusions', COUNT(*) FROM smartdocs.category_sync_exclusions
UNION ALL
SELECT 'user_sync_overrides', COUNT(*) FROM smartdocs.user_sync_overrides
UNION ALL
SELECT 'entity_sync_exclusions', COUNT(*) FROM smartdocs.entity_sync_exclusions;

-- Success message
SELECT 'SmartDocs Sync Configuration schema created successfully!' as status;
