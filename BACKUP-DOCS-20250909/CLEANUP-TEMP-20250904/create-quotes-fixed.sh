#!/bin/bash

echo "=== Creazione preventivi di test ==="
psql -U lucamambelli -d assistenza_db << 'EOF'
-- Prima verifica gli ID necessari
DO $$
DECLARE
  v_org_id UUID;
  v_prof_id UUID;
  v_client_id UUID;
  v_request_id UUID;
  v_quote_id UUID;
BEGIN
  -- Ottieni l'organization ID esistente
  SELECT id INTO v_org_id FROM organizations LIMIT 1;
  
  IF v_org_id IS NULL THEN
    -- Crea organizzazione
    INSERT INTO organizations (id, name, slug, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'Test Organization', 'test-org', NOW(), NOW())
    RETURNING id INTO v_org_id;
  END IF;
  
  -- Ottieni un professional
  SELECT id INTO v_prof_id FROM users WHERE role = 'PROFESSIONAL' LIMIT 1;
  
  -- Ottieni un client  
  SELECT id INTO v_client_id FROM users WHERE role = 'CLIENT' LIMIT 1;
  
  -- Ottieni una richiesta esistente
  SELECT id INTO v_request_id FROM "assistanceRequests" LIMIT 1;
  
  -- Se non ci sono richieste, creane una
  IF v_request_id IS NULL AND v_client_id IS NOT NULL THEN
    INSERT INTO "assistanceRequests" (
      id, title, description, status, priority,
      "clientId", "organizationId", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(),
      'Riparazione urgente impianto',
      'Perdita acqua dal rubinetto della cucina',
      'PENDING',
      'HIGH',
      v_client_id,
      v_org_id,
      NOW(),
      NOW()
    ) RETURNING id INTO v_request_id;
  END IF;
  
  IF v_request_id IS NOT NULL AND v_prof_id IS NOT NULL AND v_org_id IS NOT NULL THEN
    -- Cancella preventivi esistenti per pulire
    DELETE FROM quotes;
    
    -- Crea 3 preventivi di test
    
    -- Preventivo 1: PENDING
    INSERT INTO quotes (
      id, title, description, status, 
      "subtotal", "taxAmount", "totalAmount",
      "requestId", "professionalId", "organizationId",
      "validUntil", version, "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(),
      'Preventivo Riparazione Impianto Elettrico',
      'Intervento completo per riparazione impianto con sostituzione componenti',
      'PENDING',
      50000, 11000, 61000,
      v_request_id, v_prof_id, v_org_id,
      NOW() + INTERVAL '30 days', 1, NOW(), NOW()
    );
    
    -- Preventivo 2: ACCEPTED
    INSERT INTO quotes (
      id, title, description, status,
      "subtotal", "taxAmount", "totalAmount",
      "requestId", "professionalId", "organizationId",
      "validUntil", version, "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(),
      'Preventivo Manutenzione Caldaia',
      'Controllo e manutenzione ordinaria caldaia con certificazione',
      'ACCEPTED',
      30000, 6600, 36600,
      v_request_id, v_prof_id, v_org_id,
      NOW() + INTERVAL '15 days', 1, NOW() - INTERVAL '2 days', NOW()
    );
    
    -- Preventivo 3: DRAFT
    INSERT INTO quotes (
      id, title, description, status,
      "subtotal", "taxAmount", "totalAmount",
      "requestId", "professionalId", "organizationId",
      "validUntil", version, "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(),
      'Preventivo Installazione Climatizzatore',
      'Fornitura e installazione nuovo sistema di climatizzazione',
      'DRAFT',
      150000, 33000, 183000,
      v_request_id, v_prof_id, v_org_id,
      NOW() + INTERVAL '45 days', 1, NOW() - INTERVAL '1 hour', NOW()
    );
    
    RAISE NOTICE 'Creati 3 preventivi di test';
  ELSE
    RAISE NOTICE 'Dati mancanti:';
    RAISE NOTICE 'Request ID: %', v_request_id;
    RAISE NOTICE 'Professional ID: %', v_prof_id;
    RAISE NOTICE 'Organization ID: %', v_org_id;
  END IF;
END $$;

-- Verifica i preventivi creati
SELECT 
  q.id,
  q.title,
  q.status,
  q."totalAmount",
  q."organizationId",
  q."createdAt"
FROM quotes q
ORDER BY q."createdAt" DESC;

SELECT 'Totale preventivi nel database:' as info, COUNT(*) as total FROM quotes;
EOF

echo "Done!"
