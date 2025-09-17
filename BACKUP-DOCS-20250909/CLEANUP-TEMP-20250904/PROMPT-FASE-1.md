# 📋 PROMPT FASE 1 - MIGRAZIONE DATABASE

Copia questo prompt in una nuova sessione Claude:

---

Sono un assistente che deve completare la **FASE 1** della rimozione del multi-tenancy dal sistema Richiesta Assistenza.

## CONTESTO
Il sistema attualmente ha un campo `organizationId` in tutte le tabelle che deve essere rimosso completamente. È già stato preparato tutto il necessario per la migrazione.

## DOCUMENTI DA LEGGERE PRIMA DI INIZIARE
1. **LEGGERE OBBLIGATORIAMENTE**: `/Users/lucamambelli/Desktop/Richiesta-Assistenza/FASE-1-ISTRUZIONI.md`
   - Contiene TUTTE le istruzioni dettagliate passo-passo
   - Include comandi esatti da eseguire
   - Ha checklist di validazione
   - Spiega procedure di rollback

2. **CONSULTARE**: `/Users/lucamambelli/Desktop/Richiesta-Assistenza/PIANO-MASTER-RIMOZIONE-MULTITENANCY.md`
   - Per verificare lo stato generale del progetto
   - Per aggiornare lo stato di avanzamento

## FILE GIÀ PREPARATI
- `/backend/prisma/schema-new.prisma` - Nuovo schema senza organizationId
- `/backend/migrations/remove-multitenancy.sql` - Script SQL per la migrazione
- `/backups/2025-01-25-pre-removal/` - Directory per i backup

## OBIETTIVO FASE 1
Applicare la migrazione al database PostgreSQL e aggiornare Prisma per rimuovere completamente il multi-tenancy.

## TASK DA COMPLETARE
1. ✅ Leggere completamente FASE-1-ISTRUZIONI.md
2. ✅ Verificare lo stato attuale del database
3. ✅ Fare backup completo del database
4. ✅ Applicare la migrazione SQL
5. ✅ Sostituire lo schema Prisma
6. ✅ Sincronizzare Prisma con il database
7. ✅ Verificare che tutto funzioni
8. ✅ Aggiornare la documentazione
9. ✅ Aggiornare PIANO-MASTER-RIMOZIONE-MULTITENANCY.md con stato completamento
10. ✅ Creare report in `/REPORT-SESSIONI-CLAUDE/2025-01-GENNAIO/fase1-migrazione-db.md`

## STRUMENTI DISPONIBILI
Hai accesso completo a:
- Filesystem (lettura/scrittura file)
- Terminal (esecuzione comandi bash)
- PostgreSQL (database assistenza_db)
- Prisma CLI
- Editor di testo

## REGOLE IMPORTANTI
- **SEGUIRE ESATTAMENTE** le istruzioni in FASE-1-ISTRUZIONI.md
- **FARE BACKUP** prima di ogni operazione critica
- **DOCUMENTARE** ogni comando eseguito nel report
- **IN CASO DI ERRORE**: seguire la procedura di rollback nelle istruzioni
- **NON PROCEDERE** se ci sono errori non risolti

## VALIDAZIONE FINALE
La FASE 1 sarà completa quando:
- ✅ Database migrato senza errori
- ✅ Tabella Organization non esiste più
- ✅ Campo organizationId rimosso da tutte le tabelle
- ✅ Schema Prisma sincronizzato
- ✅ Nessuna perdita di dati
- ✅ PIANO-MASTER aggiornato
- ✅ Report di sessione creato

## COME INIZIARE
1. Apri e leggi completamente `/Users/lucamambelli/Desktop/Richiesta-Assistenza/FASE-1-ISTRUZIONI.md`
2. Segui le istruzioni STEP by STEP
3. Documenta tutto nel report di sessione

**INIZIA LEGGENDO IL FILE FASE-1-ISTRUZIONI.md**
