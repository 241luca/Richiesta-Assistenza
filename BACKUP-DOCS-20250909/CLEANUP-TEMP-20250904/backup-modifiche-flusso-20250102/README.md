# Backup Modifiche Flusso Richieste - 02/01/2025

## Modifiche da implementare:
1. **Filtro Sottocategorie**: Mostrare solo sottocategorie con professionisti disponibili
2. **Assegnazione Staff**: Tracciare chi/come assegna le richieste  
3. **Data Intervento**: Obbligatoria per passare in IN_PROGRESS

## File modificati:
- Schema Prisma (aggiunta campi assignmentType, assignedBy)
- API Subcategories (conteggio professionisti)
- Frontend CategorySelector (filtro sottocategorie vuote)
- API Requests (logica assegnazione e cambio stato)
- Dashboard Admin (interfaccia assegnazione)

## Backup creato: 02/01/2025 alle ore correnti
