#!/bin/bash

echo "=== Creazione preventivi di test ==="
psql -U postgres -d assistenza_db << 'EOF'
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
  SELECT id INTO v_org_id FROM organizations WHERE name = 'Test Organization' LIMIT 1;
  
  -- Ottieni un professional
  SELECT id INTO v_prof_id FROM users WHERE role = 'PROFESSIONAL' AND "organizationId" = v_org_id LIMIT 1;
  
  -- Ottieni un client
  SELECT id INTO v_client_id FROM users WHERE role = 'CLIENT' AND "organizationId" = v_org_id LIMIT 1;
  
  -- Ottieni una richiesta esistente
  SELECT id INTO v_request_id 
  FROM "assistanceRequests" 
  WHERE "clientId" = v_client_id 
  AND "organizationId" = v_org_id 
  LIMIT 1;
  
  IF v_request_id IS NOT NULL AND v_prof_id IS NOT NULL THEN
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
    RAISE NOTICE 'Non è possibile creare preventivi: mancano dati necessari';
    RAISE NOTICE 'Request ID: %, Professional ID: %, Org ID: %', v_request_id, v_prof_id, v_org_id;
  END IF;
END $$;

-- Verifica i preventivi creati
SELECT 
  q.id,
  q.title,
  q.status,
  q."totalAmount",
  q."createdAt"
FROM quotes q
ORDER BY q."createdAt" DESC
LIMIT 10;

SELECT 'Totale preventivi nel database:' as info, COUNT(*) as total FROM quotes;
EOF

echo "Done!"
