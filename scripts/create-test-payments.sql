-- Script per creare pagamenti di test realistici
-- Data: 29/01/2025
-- Sistema: Richiesta Assistenza

-- IMPORTANTE: Eseguire questo script nel database PostgreSQL
-- Assicurarsi che esistano utenti e richieste nel sistema

-- Prima controlliamo se abbiamo utenti e richieste
DO $$
DECLARE
  v_client1_id UUID;
  v_client2_id UUID;
  v_client3_id UUID;
  v_prof1_id UUID;
  v_prof2_id UUID;
  v_request1_id UUID;
  v_request2_id UUID;
  v_quote1_id UUID;
  v_quote2_id UUID;
BEGIN
  -- Trova o crea clienti di test
  SELECT id INTO v_client1_id FROM "User" WHERE role = 'CLIENT' LIMIT 1;
  SELECT id INTO v_client2_id FROM "User" WHERE role = 'CLIENT' OFFSET 1 LIMIT 1;
  SELECT id INTO v_client3_id FROM "User" WHERE role = 'CLIENT' OFFSET 2 LIMIT 1;
  
  -- Trova professionisti
  SELECT id INTO v_prof1_id FROM "User" WHERE role = 'PROFESSIONAL' LIMIT 1;
  SELECT id INTO v_prof2_id FROM "User" WHERE role = 'PROFESSIONAL' OFFSET 1 LIMIT 1;

  -- Se non ci sono utenti sufficienti, creali
  IF v_client1_id IS NULL THEN
    INSERT INTO "User" (id, email, username, password, "firstName", "lastName", "fullName", role, status, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'mario.rossi@test.it', 'mrossi', '$2a$10$dummy', 'Mario', 'Rossi', 'Mario Rossi', 'CLIENT', 'active', NOW(), NOW())
    RETURNING id INTO v_client1_id;
  END IF;

  IF v_client2_id IS NULL THEN
    INSERT INTO "User" (id, email, username, password, "firstName", "lastName", "fullName", role, status, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'laura.bianchi@test.it', 'lbianchi', '$2a$10$dummy', 'Laura', 'Bianchi', 'Laura Bianchi', 'CLIENT', 'active', NOW(), NOW())
    RETURNING id INTO v_client2_id;
  END IF;

  IF v_prof1_id IS NULL THEN
    INSERT INTO "User" (id, email, username, password, "firstName", "lastName", "fullName", role, status, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'giuseppe.verdi@test.it', 'gverdi', '$2a$10$dummy', 'Giuseppe', 'Verdi', 'Giuseppe Verdi', 'PROFESSIONAL', 'active', NOW(), NOW())
    RETURNING id INTO v_prof1_id;
  END IF;

  -- Inserisci pagamenti di test con stati diversi
  
  -- 1. Pagamento COMPLETATO per riparazione caldaia (settembre)
  INSERT INTO "Payment" (
    id, "clientId", "professionalId", amount, currency, type, status, 
    "paymentMethod", "totalAmount", "professionalAmount", "platformFee", "platformFeePercentage",
    description, "requiresInvoice", "paidAt", "processedAt", "createdAt", "updatedAt"
  ) VALUES (
    gen_random_uuid(), 
    v_client1_id, 
    v_prof1_id,
    250.00, 'EUR', 'FULL_PAYMENT', 'COMPLETED',
    'CARD', 250.00, 212.50, 37.50, 15,
    'Riparazione caldaia - intervento urgente',
    true,
    '2025-09-15 10:30:00', '2025-09-15 10:31:00',
    '2025-09-15 10:00:00', NOW()
  );

  -- 2. Pagamento COMPLETATO per installazione condizionatore (agosto)
  INSERT INTO "Payment" (
    id, "clientId", "professionalId", amount, currency, type, status,
    "paymentMethod", "totalAmount", "professionalAmount", "platformFee", "platformFeePercentage",
    description, "requiresInvoice", "paidAt", "processedAt", "createdAt", "updatedAt"
  ) VALUES (
    gen_random_uuid(),
    v_client2_id,
    v_prof1_id,
    850.00, 'EUR', 'FINAL_PAYMENT', 'COMPLETED',
    'BANK_TRANSFER', 850.00, 722.50, 127.50, 15,
    'Installazione condizionatore dual split',
    true,
    '2025-08-20 14:00:00', '2025-08-22 09:00:00',
    '2025-08-18 16:00:00', NOW()
  );

  -- 3. Acconto COMPLETATO per ristrutturazione bagno (settembre)
  INSERT INTO "Payment" (
    id, "clientId", "professionalId", amount, currency, type, status,
    "paymentMethod", "totalAmount", "professionalAmount", "platformFee", "platformFeePercentage",
    description, "requiresInvoice", "paidAt", "processedAt", "createdAt", "updatedAt"
  ) VALUES (
    gen_random_uuid(),
    v_client1_id,
    v_prof2_id,
    1500.00, 'EUR', 'DEPOSIT', 'COMPLETED',
    'CARD', 1500.00, 1275.00, 225.00, 15,
    'Acconto 30% ristrutturazione bagno',
    true,
    '2025-09-10 11:00:00', '2025-09-10 11:01:00',
    '2025-09-10 10:45:00', NOW()
  );

  -- 4. Pagamento PENDING per riparazione elettrodomestico (oggi)
  INSERT INTO "Payment" (
    id, "clientId", "professionalId", amount, currency, type, status,
    "paymentMethod", "totalAmount", "professionalAmount", "platformFee", "platformFeePercentage",
    description, "requiresInvoice", "createdAt", "updatedAt"
  ) VALUES (
    gen_random_uuid(),
    v_client3_id,
    v_prof1_id,
    120.00, 'EUR', 'FULL_PAYMENT', 'PENDING',
    'CARD', 120.00, 102.00, 18.00, 15,
    'Riparazione lavastoviglie - in attesa di pagamento',
    false,
    NOW() - INTERVAL '2 hours', NOW()
  );

  -- 5. Pagamento FAILED per imbiancatura (settembre)
  INSERT INTO "Payment" (
    id, "clientId", "professionalId", amount, currency, type, status,
    "paymentMethod", "totalAmount", "professionalAmount", "platformFee", "platformFeePercentage",
    description, "requiresInvoice", "failedAt", "createdAt", "updatedAt"
  ) VALUES (
    gen_random_uuid(),
    v_client2_id,
    v_prof2_id,
    450.00, 'EUR', 'FULL_PAYMENT', 'FAILED',
    'CARD', 450.00, 382.50, 67.50, 15,
    'Imbiancatura appartamento - carta rifiutata',
    true,
    '2025-09-25 18:00:00',
    '2025-09-25 17:45:00', NOW()
  );

  -- 6. Pagamento COMPLETATO con RIMBORSO PARZIALE (settembre)
  INSERT INTO "Payment" (
    id, "clientId", "professionalId", amount, currency, type, status,
    "paymentMethod", "totalAmount", "professionalAmount", "platformFee", "platformFeePercentage",
    description, "requiresInvoice", "paidAt", "processedAt", "refundedAt", "createdAt", "updatedAt"
  ) VALUES (
    gen_random_uuid(),
    v_client1_id,
    v_prof1_id,
    300.00, 'EUR', 'FULL_PAYMENT', 'PARTIALLY_REFUNDED',
    'CARD', 300.00, 255.00, 45.00, 15,
    'Riparazione perdita acqua - rimborsato parzialmente per materiale non utilizzato',
    true,
    '2025-09-05 09:00:00', '2025-09-05 09:01:00', '2025-09-08 14:00:00',
    '2025-09-05 08:45:00', NOW()
  );

  -- 7. Pagamento COMPLETATO recente (ieri)
  INSERT INTO "Payment" (
    id, "clientId", "professionalId", amount, currency, type, status,
    "paymentMethod", "totalAmount", "professionalAmount", "platformFee", "platformFeePercentage",
    description, "requiresInvoice", "paidAt", "processedAt", "createdAt", "updatedAt"
  ) VALUES (
    gen_random_uuid(),
    v_client3_id,
    v_prof1_id,
    180.00, 'EUR', 'FULL_PAYMENT', 'COMPLETED',
    'PAYPAL', 180.00, 153.00, 27.00, 15,
    'Manutenzione caldaia annuale',
    true,
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day' - INTERVAL '30 minutes', NOW()
  );

  -- 8. Pagamento CASH completato (settembre)
  INSERT INTO "Payment" (
    id, "clientId", "professionalId", amount, currency, type, status,
    "paymentMethod", "totalAmount", "professionalAmount", "platformFee", "platformFeePercentage",
    description, "requiresInvoice", "paidAt", "processedAt", "createdAt", "updatedAt"
  ) VALUES (
    gen_random_uuid(),
    v_client2_id,
    v_prof2_id,
    90.00, 'EUR', 'FULL_PAYMENT', 'COMPLETED',
    'CASH', 90.00, 76.50, 13.50, 15,
    'Piccola riparazione idraulica - pagamento in contanti',
    false,
    '2025-09-12 17:30:00', '2025-09-12 17:35:00',
    '2025-09-12 17:00:00', NOW()
  );

  -- 9. Acconto per lavoro programmato (settembre)
  INSERT INTO "Payment" (
    id, "clientId", "professionalId", amount, currency, type, status,
    "paymentMethod", "totalAmount", "professionalAmount", "platformFee", "platformFeePercentage",
    description, "requiresInvoice", "paidAt", "processedAt", "createdAt", "updatedAt"
  ) VALUES (
    gen_random_uuid(),
    v_client1_id,
    v_prof2_id,
    500.00, 'EUR', 'DEPOSIT', 'COMPLETED',
    'BANK_TRANSFER', 500.00, 425.00, 75.00, 15,
    'Acconto installazione pannelli solari',
    true,
    '2025-09-22 10:00:00', '2025-09-23 09:00:00',
    '2025-09-21 15:00:00', NOW()
  );

  -- 10. Pagamento PROCESSING (in elaborazione)
  INSERT INTO "Payment" (
    id, "clientId", "professionalId", amount, currency, type, status,
    "paymentMethod", "totalAmount", "professionalAmount", "platformFee", "platformFeePercentage",
    description, "requiresInvoice", "createdAt", "updatedAt"
  ) VALUES (
    gen_random_uuid(),
    v_client2_id,
    v_prof1_id,
    320.00, 'EUR', 'FULL_PAYMENT', 'PROCESSING',
    'BANK_TRANSFER', 320.00, 272.00, 48.00, 15,
    'Sostituzione boiler - bonifico in elaborazione',
    true,
    NOW() - INTERVAL '12 hours', NOW()
  );

  -- Aggiungi alcuni rimborsi per rendere i dati più realistici
  -- Rimborso parziale per il pagamento 6
  INSERT INTO "Refund" (
    id, "paymentId", amount, currency, reason, "reasonCode", status,
    "requestedAt", "processedAt", "completedAt", "createdAt", "updatedAt"
  )
  SELECT 
    gen_random_uuid(),
    id,
    50.00, 'EUR', 
    'Materiale non utilizzato restituito',
    'REQUESTED_BY_CUSTOMER',
    'COMPLETED',
    '2025-09-08 10:00:00', '2025-09-08 14:00:00', '2025-09-08 14:05:00',
    '2025-09-08 10:00:00', NOW()
  FROM "Payment" 
  WHERE status = 'PARTIALLY_REFUNDED' 
  LIMIT 1;

  RAISE NOTICE 'Pagamenti di test creati con successo!';
END $$;

-- Verifica i dati inseriti
SELECT 
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM "Payment"
GROUP BY status
ORDER BY status;
