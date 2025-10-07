-- Query diretta per vedere i log di audit
-- Esegui in Prisma Studio o in qualsiasi client PostgreSQL

SELECT COUNT(*) as total_logs FROM "AuditLog";

SELECT 
    id,
    action,
    "userEmail",
    "entityType",
    success,
    severity,
    category,
    "timestamp"
FROM "AuditLog"
ORDER BY "timestamp" DESC
LIMIT 10;
