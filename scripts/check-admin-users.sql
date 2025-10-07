-- Query per verificare gli utenti admin nel database
SELECT id, email, role, "fullName" 
FROM "User" 
WHERE role IN ('ADMIN', 'SUPER_ADMIN')
LIMIT 5;