# Fix per i problemi dei preventivi

## Problemi identificati:

### 1. Sezione preventivi nel dettaglio richiesta
- La sezione si mostra SOLO se ci sono già preventivi
- Dovrebbe sempre mostrare la sezione con pulsante "Aggiungi Preventivo"

### 2. Modal selezione richiesta vuoto
- Il filtro `professionalId` potrebbe non funzionare correttamente
- Potrebbe essere un problema di formato ID (string vs number)

## File da modificare:
1. RequestDetailPage.tsx - sempre mostrare sezione preventivi
2. NewQuotePage.tsx - fix filtro richieste

Timestamp: 2025-08-31 18:30
