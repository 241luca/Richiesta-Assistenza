/**
 * CHECK CHI È L'UTENTE LOGGATO
 */

-- Esegui queste query nel database per vedere la situazione reale:

-- 1. Trova Mario Rossi e il suo ID
SELECT id, email, full_name, role 
FROM users 
WHERE full_name = 'Mario Rossi' AND role = 'PROFESSIONAL';

-- 2. Conta le richieste assegnate a Mario
-- SOSTITUISCI 'ID_DI_MARIO' con l'ID trovato sopra
SELECT COUNT(*) as richieste_di_mario 
FROM assistance_requests 
WHERE professional_id = 'ID_DI_MARIO';

-- 3. Mostra TUTTI i professionisti e quante richieste hanno
SELECT 
    u.id,
    u.email,
    u.full_name,
    COUNT(ar.id) as numero_richieste
FROM users u
LEFT JOIN assistance_requests ar ON ar.professional_id = u.id
WHERE u.role = 'PROFESSIONAL'
GROUP BY u.id, u.email, u.full_name;

-- 4. Se l'utente loggato ha email diversa da Mario, ecco il problema
-- Guarda nella dashboard del frontend quale email è mostrata in alto a destra
