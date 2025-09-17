ISTRUZIONI PER RIPRISTINARE IL BACKUP
=====================================

Data backup: Mer  3 Set 2025 08:57:24 CEST
Directory: /Users/lucamambelli/Desktop/richiesta-assistenza/BACKUP-EMERGENZA

CONTENUTO DEL BACKUP:
--------------------
1. database-dump-20250903-085723.sql - Dump completo database PostgreSQL
2. uploads-20250903-085723/ - Tutti i file caricati
3. config-20250903-085723/ - File di configurazione
4. BACKUP-COMPLETO-20250903-085723.tar.gz - Archivio compresso di tutto

COME RIPRISTINARE:
-----------------

1. RIPRISTINO DATABASE:
   psql "postgresql://postgres:postgres@localhost:5432/richiesta_assistenza" < database-dump-20250903-085723.sql

2. RIPRISTINO FILE:
   cp -r uploads-20250903-085723/* /path/to/richiesta-assistenza/uploads/

3. RIPRISTINO CONFIG:
   cp config-20250903-085723/.env /path/to/richiesta-assistenza/
   cp config-20250903-085723/backend.env /path/to/richiesta-assistenza/backend/.env

IMPORTANTE:
----------
- Fare SEMPRE un backup del sistema attuale prima di ripristinare
- Verificare che PostgreSQL sia in esecuzione
- Controllare i permessi dei file dopo il ripristino

