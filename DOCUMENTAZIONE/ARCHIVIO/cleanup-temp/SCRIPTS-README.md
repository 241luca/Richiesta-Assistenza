# 📋 Script di Gestione Database - Sistema Richiesta Assistenza

## 🚀 Script Principale

### `populate-default.sh`
**Script completo di popolamento database con tutti i dati di esempio**

```bash
./populate-default.sh
```

Questo script popola il database con:
- ✅ 6 Utenti (Admin, Staff, Cliente, Professionista)
- ✅ 8 Categorie di servizi
- ✅ 4 Richieste di assistenza  
- ✅ 4 Preventivi con voci dettagliate
- ✅ Notifiche per tutti gli utenti
- ✅ Messaggi nelle richieste

## 🔍 Script di Verifica

### `check-database.sh`
Verifica veloce dello stato del database

```bash
./check-database.sh
```

### `check-full-database.sh`
Verifica dettagliata con elenco completo dei dati

```bash
./check-full-database.sh
```

## 🧩 Script Parziali (per debug)

- `populate-database.sh` - Popolamento base (categorie e richieste)
- `populate-complete.sh` - Popolamento esteso
- `populate-quotes-notif.sh` - Solo preventivi e notifiche
- `complete-data.sh` - Completamento dati mancanti
- `final-complete.sh` - Completamento finale
- `add-messages.sh` - Aggiunta messaggi
- `messages-correct.sh` - Messaggi con schema corretto

## 👥 Credenziali di Accesso

Dopo il popolamento, puoi accedere con:

```
admin@assistenza.it / password123 (SUPER_ADMIN)
staff@assistenza.it / password123 (ADMIN)
luigi.bianchi@gmail.com / password123 (CLIENT)
mario.rossi@assistenza.it / password123 (PROFESSIONAL)
```

## 📊 Risultato Atteso

Dopo l'esecuzione di `populate-default.sh`:

```
👥 Utenti: 6
📂 Categorie: 8
📋 Richieste: 4
💰 Preventivi: 4
📝 Voci preventivo: 8
🔔 Notifiche: 4+
💬 Messaggi: 8+
```

## 🔧 Troubleshooting

Se alcuni dati non vengono creati:
1. Verifica che il seed iniziale sia stato eseguito (`npm run db:seed`)
2. Controlla i log per errori specifici
3. Usa `check-full-database.sh` per verificare cosa manca
4. Esegui nuovamente `populate-default.sh` (è idempotente)

## 💡 Note

- Gli script sono **idempotenti**: possono essere eseguiti più volte senza duplicare i dati
- I dati di esempio sono realistici e pronti per demo
- Tutti gli script sono nella directory root del progetto
