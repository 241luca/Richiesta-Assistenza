-- Script SQL per verificare lo stato del database
-- Esegui questo nel tuo client PostgreSQL

-- 1. Conta gli utenti per ruolo
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;

-- 2. Conta le richieste totali
SELECT COUNT(*) as total_requests 
FROM assistance_requests;

-- 3. Conta le richieste per stato
SELECT status, COUNT(*) as count 
FROM assistance_requests 
GROUP BY status;

-- 4. Verifica se ci sono richieste assegnate a professionisti
SELECT 
    COUNT(*) as requests_with_professional,
    COUNT(DISTINCT professional_id) as unique_professionals
FROM assistance_requests 
WHERE professional_id IS NOT NULL;

-- 5. Trova Mario Rossi e verifica le sue richieste
SELECT 
    u.id,
    u.full_name,
    u.role,
    COUNT(ar.id) as assigned_requests
FROM users u
LEFT JOIN assistance_requests ar ON ar.professional_id = u.id
WHERE u.role = 'PROFESSIONAL' AND u.full_name = 'Mario Rossi'
GROUP BY u.id, u.full_name, u.role;

-- 6. Verifica i preventivi
SELECT COUNT(*) as total_quotes 
FROM quotes;

-- 7. Mostra esempio di richiesta (prime 5)
SELECT 
    id,
    title,
    status,
    client_id,
    professional_id,
    created_at
FROM assistance_requests
LIMIT 5;

-- 8. IMPORTANTE: Verifica il tipo di dato di professional_id
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'assistance_requests' 
AND column_name IN ('id', 'client_id', 'professional_id');

-- 9. Se non ci sono richieste assegnate, vediamo se ci sono professionisti
SELECT id, full_name, email, role 
FROM users 
WHERE role = 'PROFESSIONAL'
LIMIT 5;

-- 10. Crea dati di test per Mario Rossi
-- ATTENZIONE: Esegui solo se vuoi creare dati di test!

-- Prima trova gli ID necessari
-- SELECT id FROM users WHERE role = 'PROFESSIONAL' AND full_name = 'Mario Rossi'; -- Sostituisci PROFESSIONAL_ID
-- SELECT id FROM users WHERE role = 'CLIENT' LIMIT 1; -- Sostituisci CLIENT_ID

-- Poi crea una richiesta di test (sostituisci gli ID)
/*
INSERT INTO assistance_requests (
    id,
    client_id,
    professional_id,
    title,
    description,
    category,
    status,
    priority,
    address,
    city,
    province,
    postal_code,
    requested_date,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'CLIENT_ID_QUI', -- Sostituisci con un ID cliente reale
    'PROFESSIONAL_ID_QUI', -- Sostituisci con l'ID di Mario Rossi
    'Richiesta Test Dashboard',
    'Richiesta di test per verificare che la dashboard funzioni',
    'Elettricista',
    'ASSIGNED',
    'MEDIUM',
    'Via Test 123',
    'Milano',
    'MI',
    '20100',
    NOW(),
    NOW(),
    NOW()
);
*/
