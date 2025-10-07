# 🚀 GUIDA RAPIDA HEALTH CHECK SYSTEM
## ✅ SISTEMA COMPLETAMENTE FUNZIONANTE (v5.1 - Fixed 11/01/2025)

## Accesso
**URL**: http://localhost:5193/admin/health  
**Ruolo richiesto**: ADMIN o SUPER_ADMIN

---

## 📊 COSA VEDI NELLA DASHBOARD

### 1. Stato Generale del Sistema
```
Punteggio Salute: 89% (ATTENZIONE)
├── Moduli Funzionanti: 7/8
├── Moduli Attenzione: 1/8  
└── Moduli Critici: 0/8

Moduli Disponibili: 7 su 8 moduli (88%)
Test Superati: 25 su 33 test (76%)
```

### 2. Riepilogo Test Eseguiti (Box Cliccabili)
```
┌─────────────┬────────────┬──────────────┬───────────┐
│ Test Totali │  Passati   │   Warning    │  Falliti  │
│     33      │     25     │      6       │     2     │
└─────────────┴────────────┴──────────────┴───────────┘
```
**Clicca su ogni box per vedere la lista dettagliata dei test!**

### 3. Card dei Moduli (8 totali)
Ogni card mostra:
- Nome modulo (es: Sistema Database)
- Health Score (0-100%)
- Griglia con contatori test: Passati/Warning/Falliti
- Problemi principali visibili subito
- Pulsante refresh per aggiornare solo quel modulo

---

## 🎮 COME USARLO

### Test Rapido Sistema
1. Clicca **"Esegui Tutti i Test"** (in alto a destra)
2. Attendi ~10 secondi
3. Controlla i risultati nel riepilogo

### Verificare Problemi
1. Guarda i box "Warning" e "Falliti"
2. **Clicca sul box** per vedere quali test hanno problemi
3. Esempio: "Sistema Backup: Last backup 55 hours ago"

### Test Singolo Modulo
1. Trova la card del modulo (es: Sistema Database)
2. Clicca l'icona **refresh** sulla card
3. Solo quel modulo viene aggiornato

### Dettagli Completi
1. Clicca su una card modulo
2. Si apre un modal con tutti i dettagli
3. Oppure clicca "Mostra tutti i dettagli" sulla card

---

## 📈 INTERPRETAZIONE METRICHE

### Punteggio Salute
- **🟢 >80%**: OTTIMO - Sistema in salute
- **🟡 60-80%**: ATTENZIONE - Alcuni problemi da verificare
- **🔴 <60%**: CRITICO - Intervento immediato richiesto

### Moduli vs Test
- **Moduli**: I componenti principali (8 totali)
- **Test**: I controlli specifici (33 totali)
- Un modulo può avere 3-5 test

### Problemi Comuni e Soluzioni

| Problema | Modulo | Soluzione |
|----------|--------|-----------|
| "Last backup 55 hours ago" | Backup | Eseguire backup manuale |
| "Slow queries detected" | Database | Ottimizzare query lente |
| "Low 2FA adoption" | Auth | Incoraggiare utenti ad attivare 2FA |
| "High token usage" | AI | Monitorare costi OpenAI |
| "Many pending requests" | Richieste | Assegnare professionisti |

---

## ⚡ COMANDI RAPIDI

### Aggiornamento Automatico
☑️ Attiva "Aggiornamento automatico" per refresh ogni 30 secondi

### Esportazione Report
Tab "Automazione e Avvisi" → "Genera Report"

### Storico
Tab "Automazione e Avvisi" → "Storico Check"

---

## 🆘 TROUBLESHOOTING

### "Cannot connect to Redis"
```bash
# Avvia Redis
redis-server
```

### "Database connection slow"
```sql
-- Controlla connessioni attive
SELECT count(*) FROM pg_stat_activity;
```

### "WebSocket not initialized"
```bash
# Riavvia backend
cd backend && npm run dev
```

---

## 📞 CONTATTI SUPPORTO

**Problemi tecnici**: lucamambelli@lmtecnologie.it  
**Documentazione completa**: `/Docs/04-SISTEMI/`

---

*Health Check System v5.0 - Aggiornato al 10/01/2025*
