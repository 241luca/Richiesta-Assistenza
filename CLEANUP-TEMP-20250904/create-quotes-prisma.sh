#!/bin/bash

echo "=== Creazione preventivi di test con nomi tabelle Prisma ==="
psql -U lucamambelli -d assistenza_db << 'EOF'
-- Inserisci preventivi di test per l'organizzazione dell'admin
DO $$
DECLARE
  v_org_id UUID := '2ee571bf-0aab-4fde-98ba-2fe3e17b9d60';
  v_prof_id UUID;
  v_client_id UUID;
  v_request_id UUID;
BEGIN
  -- Ottieni un professional
  SELECT id INTO v_prof_id 
  FROM "User" 
  WHERE role = 'PROFESSIONAL' 
  AND "organizationId" = v_org_id 
  LIMIT 1;
  
  IF v_prof_id IS NULL THEN
    -- Ottieni qualsiasi professional
    SELECT id INTO v_prof_id FROM "User" WHERE role = 'PROFESSIONAL' LIMIT 1;
  END IF;
  
  -- Ottieni un client
  SELECT id INTO v_client_id 
  FROM "User" 
  WHERE role = 'CLIENT' 
  AND "organizationId" = v_org_id 
  LIMIT 1;
  
  IF v_client_id IS NULL THEN
    -- Ottieni qualsiasi client
    SELECT id INTO v_client_id FROM "User" WHERE role = 'CLIENT' LIMIT 1;
  END IF;
  
  -- Ottieni una richiesta
  SELECT id INTO v_request_id 
  FROM "AssistanceRequest" 
  WHERE "organizationId" = v_org_id 
  LIMIT 1;
  
  IF v_request_id IS NULL THEN
    -- Ottieni qualsiasi richiesta
    SELECT id INTO v_request_id FROM "AssistanceRequest" LIMIT 1;
  END IF;
  
  -- Se abbiamo tutti i dati necessari, crea i preventivi
  IF v_prof_id IS NOT NULL AND v_request_id IS NOT NULL THEN
    -- Preventivo 1: PENDING
    INSERT INTO "Quote" (
      id, title, description, status, 
      subtotal, "taxAmount", "totalAmount",
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
    ) ON CONFLICT DO NOTHING;
    
    -- Preventivo 2: ACCEPTED
    INSERT INTO "Quote" (
      id, title, description, status,
      subtotal, "taxAmount", "totalAmount",
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
    ) ON CONFLICT DO NOTHING;
    
    -- Preventivo 3: DRAFT
    INSERT INTO "Quote" (
      id, title, description, status,
      subtotal, "taxAmount", "totalAmount",
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
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Creati preventivi di test';
    RAISE NOTICE 'Professional ID: %', v_prof_id;
    RAISE NOTICE 'Request ID: %', v_request_id;
    RAISE NOTICE 'Organization ID: %', v_org_id;
  ELSE
    RAISE NOTICE 'Dati mancanti - Professional: %, Request: %', v_prof_id, v_request_id;
  END IF;
END $$;

-- Verifica i preventivi creati
SELECT 
  q.id,
  q.title,
  q.status,
  q."totalAmount"/100.0 as amount_euro,
  q."organizationId"
FROM "Quote" q
WHERE q."organizationId" = '2ee571bf-0aab-4fde-98ba-2fe3e17b9d60'
ORDER BY q."createdAt" DESC;

SELECT 'Totale preventivi per org admin:' as info, COUNT(*) as total 
FROM "Quote" 
WHERE "organizationId" = '2ee571bf-0aab-4fde-98ba-2fe3e17b9d60';
EOF

echo "Done!"
