# Documentazione Tabelle Sistema

## 📋 Indice
1. [Panoramica](#panoramica)
2. [Professioni](#professioni)
3. [Stati e Valori Sistema](#stati-e-valori-sistema)
4. [Guida Utilizzo](#guida-utilizzo)
5. [Configurazione Tecnica](#configurazione-tecnica)

---

## 📌 Panoramica

Il modulo **Tabelle Sistema** permette la gestione centralizzata di tutte le tabelle di configurazione e gli enum utilizzati nell'applicazione.

### Accesso
**Menu → Tabelle Sistema**

### Permessi
- **Visualizzazione**: ADMIN, SUPER_ADMIN
- **Modifica**: ADMIN, SUPER_ADMIN
- **Eliminazione**: SUPER_ADMIN

### Sezioni Disponibili
1. **Professioni** - Gestione professioni per professionisti
2. **Stati e Valori Sistema** - Enum di sistema

---

## 🔧 Professioni

### Descrizione
Gestione completa delle professioni disponibili per i professionisti nel sistema.

### Funzionalità

#### ✅ Implementate
- **Visualizzazione lista** con ordinamento
- **Creazione** nuove professioni
- **Modifica** professioni esistenti
- **Eliminazione** (solo se non utilizzate)
- **Attivazione/Disattivazione**
- **Badge contatore** professionisti associati

#### 📊 Campi Gestiti
| Campo | Tipo | Descrizione | Obbligatorio |
|-------|------|-------------|--------------|
| Nome | String | Nome della professione | ✅ |
| Slug | String | URL-friendly identifier | ✅ |
| Descrizione | Text | Descrizione dettagliata | ❌ |
| Ordine | Number | Posizione nella lista | ✅ |
| Attivo | Boolean | Stato attivazione | ✅ |

### Professioni Predefinite
1. Idraulico
2. Elettricista
3. Falegname
4. Muratore
5. Imbianchino
6. Fabbro
7. Tecnico Climatizzazione
8. Tecnico Elettrodomestici
9. Giardiniere
10. Tecnico Informatico
11. Serramentista
12. Piastrellista
13. Decoratore
14. Tecnico Allarmi
15. Pulizie Professionali

---

## 📊 Stati e Valori Sistema

### Descrizione
Visualizzazione e gestione di tutti gli enum di sistema organizzati per categoria logica.

### Categorie

#### 🔵 Gestione Richieste
Valori utilizzati per il ciclo di vita delle richieste di assistenza.

**Stati Richieste**
| Valore | Etichetta | Descrizione | Colore |
|--------|-----------|-------------|--------|
| PENDING | In Attesa | Richiesta in attesa di assegnazione | 🟡 Giallo |
| ASSIGNED | Assegnata | Assegnata a un professionista | 🔵 Blu |
| IN_PROGRESS | In Corso | Lavoro in corso | 🟣 Indaco |
| COMPLETED | Completata | Lavoro completato | 🟢 Verde |
| CANCELLED | Annullata | Richiesta annullata | 🔴 Rosso |

**Livelli Priorità**
| Valore | Etichetta | Descrizione | Colore |
|--------|-----------|-------------|--------|
| LOW | Bassa | Non urgente | ⚪ Grigio |
| MEDIUM | Media | Normale | 🟡 Giallo |
| HIGH | Alta | Urgente | 🟠 Arancione |
| URGENT | Urgente | Molto urgente | 🔴 Rosso |

#### 🟢 Gestione Preventivi
Stati del ciclo di vita dei preventivi.

**Stati Preventivi**
| Valore | Etichetta | Descrizione | Colore |
|--------|-----------|-------------|--------|
| DRAFT | Bozza | Preventivo in preparazione | ⚪ Grigio |
| SENT | Inviato | Inviato al cliente | 🔵 Blu |
| VIEWED | Visualizzato | Visto dal cliente | 🟣 Indaco |
| ACCEPTED | Accettato | Accettato dal cliente | 🟢 Verde |
| REJECTED | Rifiutato | Rifiutato dal cliente | 🔴 Rosso |
| EXPIRED | Scaduto | Preventivo scaduto | ⚫ Grigio |

#### 🟣 Sistema Pagamenti
Gestione metodi e stati pagamento.

**Metodi di Pagamento**
| Valore | Etichetta | Descrizione | Colore |
|--------|-----------|-------------|--------|
| CASH | Contanti | Pagamento in contanti | 🟢 Verde |
| CARD | Carta | Carta di credito/debito | 🔵 Blu |
| BANK_TRANSFER | Bonifico | Bonifico bancario | 🟣 Indaco |
| STRIPE | Stripe | Pagamento online Stripe | 🟣 Viola |
| PAYPAL | PayPal | Pagamento PayPal | 🟡 Giallo |

**Stati Pagamenti**
| Valore | Etichetta | Descrizione | Colore |
|--------|-----------|-------------|--------|
| PENDING | In Attesa | Pagamento in attesa | 🟡 Giallo |
| PROCESSING | In Elaborazione | Pagamento in elaborazione | 🔵 Blu |
| COMPLETED | Completato | Pagamento completato | 🟢 Verde |
| FAILED | Fallito | Pagamento fallito | 🔴 Rosso |
| REFUNDED | Rimborsato | Pagamento rimborsato | ⚪ Grigio |

#### 🩷 Sistema Notifiche
Tipologie e canali di notifica.

**Tipi di Notifica**
| Valore | Etichetta | Descrizione | Colore |
|--------|-----------|-------------|--------|
| SYSTEM | Sistema | Notifiche di sistema | ⚪ Grigio |
| REQUEST | Richiesta | Notifiche richieste | 🔵 Blu |
| QUOTE | Preventivo | Notifiche preventivi | 🟢 Verde |
| PAYMENT | Pagamento | Notifiche pagamenti | 🟣 Viola |
| CHAT | Messaggio | Notifiche chat | 🟣 Indaco |

**Canali di Notifica**
| Valore | Etichetta | Descrizione | Colore |
|--------|-----------|-------------|--------|
| EMAIL | Email | Invio via email | 🔵 Blu |
| SMS | SMS | Invio via SMS | 🟢 Verde |
| PUSH | Push | Notifiche push | 🟣 Viola |
| WEBSOCKET | WebSocket | Real-time in app | 🟣 Indaco |

#### ⚫ Gestione Utenti
Ruoli e stati degli utenti.

**Ruoli Utente**
| Valore | Etichetta | Descrizione | Colore |
|--------|-----------|-------------|--------|
| CLIENT | Cliente | Utente cliente | 🔵 Blu |
| PROFESSIONAL | Professionista | Professionista/tecnico | 🟢 Verde |
| ADMIN | Amministratore | Amministratore sistema | 🟣 Viola |
| SUPER_ADMIN | Super Admin | Super amministratore | 🔴 Rosso |
| STAFF | Staff | Staff interno | 🟣 Indaco |

**Stati Utente**
| Valore | Etichetta | Descrizione | Colore |
|--------|-----------|-------------|--------|
| ACTIVE | Attivo | Account attivo | 🟢 Verde |
| INACTIVE | Inattivo | Account inattivo | ⚪ Grigio |
| SUSPENDED | Sospeso | Account sospeso | 🟠 Arancione |
| BANNED | Bannato | Account bannato | 🔴 Rosso |
| PENDING | In Attesa | In attesa di verifica | 🟡 Giallo |

#### 🟪 Intelligenza Artificiale
Configurazioni per l'assistente AI.

**Stili Risposta AI**
| Valore | Etichetta | Descrizione | Colore |
|--------|-----------|-------------|--------|
| FORMAL | Formale | Risposta professionale | 🟣 Viola |
| INFORMAL | Informale | Risposta colloquiale | 🔵 Blu |
| TECHNICAL | Tecnico | Linguaggio tecnico | 🟣 Indaco |
| EDUCATIONAL | Educativo | Stile didattico | 🟢 Verde |

**Livelli Dettaglio AI**
| Valore | Etichetta | Descrizione | Colore |
|--------|-----------|-------------|--------|
| BASIC | Base | Risposta essenziale | ⚪ Grigio |
| INTERMEDIATE | Intermedio | Dettaglio medio | 🔵 Blu |
| ADVANCED | Avanzato | Molto dettagliato | 🟣 Viola |
| EXPERT | Esperto | Massimo dettaglio tecnico | 🔴 Rosso |

### Funzionalità
- ✅ **Visualizzazione organizzata** per categoria
- ✅ **Tabelle espandibili** con click
- ✅ **Descrizioni dettagliate** per ogni valore
- ✅ **Badge colorati** per identificazione visiva
- ✅ **Icone distintive** per ogni enum
- ⏳ Modifica valori (in sviluppo)
- ⏳ Aggiunta nuovi valori (in sviluppo)
- ⏳ Eliminazione valori (in sviluppo)

---

## 📖 Guida Utilizzo

### Per Amministratori

#### Gestione Professioni

**Aggiungere una Professione:**
1. Vai in **Tabelle Sistema**
2. Resta nella tab **Professioni**
3. Clicca **"Aggiungi Professione"**
4. Compila il form:
   - Nome (es: "Antennista")
   - Slug (auto-generato)
   - Descrizione (opzionale)
   - Ordine visualizzazione
   - Stato attivo
5. Clicca **"Crea Professione"**

**Modificare una Professione:**
1. Trova la professione nella lista
2. Clicca l'icona **matita** 🔵
3. Modifica i campi nel modal
4. Clicca **"Salva Modifiche"**

**Eliminare una Professione:**
1. Verifica che abbia **0 professionisti** associati
2. Clicca l'icona **cestino** 🔴
3. Conferma l'eliminazione

#### Visualizzare Stati Sistema

1. Vai nella tab **"Stati e Valori Sistema"**
2. Clicca sulla **freccia** per espandere una categoria
3. Visualizza tutti i valori con:
   - Codice tecnico (VALUE)
   - Etichetta italiana
   - Descrizione
   - Colore associato

### Per Sviluppatori

#### Struttura File

```
src/
├── pages/admin/
│   └── SystemEnumsPage.tsx       # Pagina principale
├── components/admin/
│   └── EnumsTab.tsx              # Tab Stati e Valori
└── services/api/
    └── enums.ts                  # (futuro) API per enum
```

#### Aggiungere Nuovo Enum

1. Modifica `SYSTEM_ENUMS_CONFIG` in `EnumsTab.tsx`:

```typescript
const SYSTEM_ENUMS_CONFIG = {
  // ... altri enum ...
  
  nuovoEnum: {
    name: 'Nome Enum',
    description: 'Descrizione',
    icon: IconComponent,
    category: 'categoria',
    color: 'colore',
    values: [
      { 
        value: 'VALORE', 
        label: 'Etichetta', 
        color: 'colore', 
        description: 'Descrizione' 
      }
    ]
  }
};
```

2. Aggiungi la categoria se necessaria:

```typescript
const categoryNames = {
  // ... altre categorie ...
  nuovaCategoria: 'Nome Categoria'
};
```

---

## ⚙️ Configurazione Tecnica

### Database Schema

#### Tabella Profession
```sql
CREATE TABLE "Profession" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  isActive BOOLEAN DEFAULT true,
  displayOrder INTEGER DEFAULT 0,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP
);
```

#### Relazione con User
```sql
ALTER TABLE "User" 
ADD COLUMN professionId UUID REFERENCES "Profession"(id);
```

### API Endpoints

#### Professioni
- `GET /api/professions` - Lista professioni
- `POST /api/professions` - Crea professione
- `PUT /api/professions/:id` - Modifica professione
- `DELETE /api/professions/:id` - Elimina professione
- `PUT /api/professions/user/:userId` - Assegna professione a utente

#### Stati Sistema (Futuro)
- `GET /api/enums` - Lista tutti gli enum
- `GET /api/enums/:type` - Dettaglio enum specifico
- `POST /api/enums/:type/values` - Aggiungi valore
- `PUT /api/enums/:type/values/:id` - Modifica valore
- `DELETE /api/enums/:type/values/:id` - Elimina valore

### Permessi e Sicurezza

```typescript
// Middleware di autorizzazione
function requireAdmin(req, res, next) {
  if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Accesso negato' });
  }
  next();
}

// Applicato a tutte le route di modifica
router.post('/professions', requireAdmin, createProfession);
router.put('/professions/:id', requireAdmin, updateProfession);
router.delete('/professions/:id', requireAdmin, deleteProfession);
```

---

## 🚀 Roadmap

### Prossimi Sviluppi

1. **Fase 1 - CRUD Completo Stati**
   - [ ] API per modifica enum
   - [ ] Validazione modifiche
   - [ ] Audit log modifiche

2. **Fase 2 - Import/Export**
   - [ ] Export configurazioni in JSON
   - [ ] Import da file
   - [ ] Backup automatico

3. **Fase 3 - Validazioni Avanzate**
   - [ ] Controllo dipendenze
   - [ ] Impatto modifiche
   - [ ] Rollback modifiche

4. **Fase 4 - Multi-lingua**
   - [ ] Traduzioni per ogni valore
   - [ ] Gestione locale
   - [ ] Export traduzioni

---

## 📝 Changelog

### v1.1.0 (04/09/2025)
- ✅ Aggiunta sezione "Stati e Valori Sistema"
- ✅ Traduzione completa tutti gli enum
- ✅ Organizzazione per categorie
- ✅ Descrizioni dettagliate
- ✅ Interfaccia espandibile

### v1.0.0 (04/09/2025)
- ✅ Implementazione gestione Professioni
- ✅ CRUD completo professioni
- ✅ Integrazione con professionisti

---

*Ultimo aggiornamento: 04/09/2025*
