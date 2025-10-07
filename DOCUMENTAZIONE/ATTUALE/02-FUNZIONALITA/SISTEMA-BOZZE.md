# 💾 Sistema di Salvataggio Bozze v1.0

**Data implementazione**: 5 Ottobre 2025  
**Versione**: 1.0.0  
**Autore**: Claude Assistant

---

## 🎯 Panoramica

Il **Sistema di Salvataggio Bozze** permette agli utenti di salvare automaticamente i progressi nei form, evitando la perdita di dati in caso di chiusura accidentale del browser o problemi di connessione.

### ✨ Caratteristiche Principali

- **Salvataggio automatico** ogni 3 secondi
- **Banner di recupero** quando viene rilevata una bozza
- **Indicatore visivo** di stato attivo
- **Pulizia automatica** bozze vecchie (7 giorni)
- **Gestione intelligente** dei dati complessi
- **Solo modalità standard** (non in modalità veloce)

---

## 🏗️ Architettura

### 📁 File Implementati

```
src/
├── hooks/
│   └── useFormDraft.ts          # Hook principale per gestire bozze
├── components/
│   └── drafts/
│       ├── DraftBanner.tsx      # Banner per ripristinare bozze
│       └── index.ts             # Export dei componenti
└── pages/
    └── NewRequestPage.tsx       # Pagina implementata (modificata)
```

### 🔗 Dipendenze

- `lodash` - Per debounce
- `@heroicons/react` - Icone UI
- `react-hot-toast` - Notifiche

---

## 🎨 Componenti

### 1. useFormDraft Hook

```typescript
const { loadDraft, clearDraft, hasDraft, getDraftInfo } = useFormDraft(
  formData,      // Dati del form da salvare
  'unique_key',  // Chiave univoca per la bozza
  {
    enabled: true,        // Abilita/disabilita il salvataggio
    debounceMs: 3000,     // Intervallo di salvataggio (ms)
    maxAge: 7             // Giorni di mantenimento bozze
  }
);
```

**Funzioni disponibili:**
- `loadDraft()` - Carica una bozza esistente
- `clearDraft()` - Elimina la bozza corrente  
- `hasDraft()` - Verifica se esiste una bozza
- `getDraftInfo()` - Ottieni informazioni sulla bozza

### 2. DraftBanner Componente

```typescript
<DraftBanner
  draftInfo={getDraftInfo()}
  onRestore={handleRestoreDraft}
  onDismiss={handleDismissDraft}
  title="Bozza trovata"
  description="Descrizione personalizzata"
/>
```

**Props:**
- `draftInfo` - Informazioni sulla bozza
- `onRestore` - Callback per ripristinare  
- `onDismiss` - Callback per eliminare
- `title` - Titolo del banner (opzionale)
- `description` - Descrizione (opzionale)

### 3. DraftIndicator Componente

```typescript
<DraftIndicator
  isActive={true}
  lastSaved="5 minuti fa"
  className="text-center"
/>
```

**Props:**
- `isActive` - Se il salvataggio è attivo
- `lastSaved` - Ultimo salvataggio (opzionale)
- `className` - Classi CSS aggiuntive

---

## 💻 Implementazione Pratica

### Passo 1: Import

```typescript
import { useFormDraft } from '../hooks/useFormDraft';
import { DraftBanner, DraftIndicator } from '../components/drafts';
```

### Passo 2: Setup Hook

```typescript
const formData = watch(); // React Hook Form

const { loadDraft, clearDraft, hasDraft, getDraftInfo } = useFormDraft(
  formData,
  'my_form',
  { 
    enabled: true,
    debounceMs: 5000 
  }
);
```

### Passo 3: State Management

```typescript
const [showDraftBanner, setShowDraftBanner] = useState(false);
const [savedDraft, setSavedDraft] = useState(null);

// Controlla bozze all'avvio
useEffect(() => {
  if (hasDraft()) {
    const draft = loadDraft();
    setSavedDraft(draft);
    setShowDraftBanner(true);
  }
}, [hasDraft, loadDraft]);
```

### Passo 4: Funzioni di Gestione

```typescript
const handleRestoreDraft = () => {
  if (savedDraft) {
    // Ripristina i campi del form
    setValue('field1', savedDraft.data.field1);
    setValue('field2', savedDraft.data.field2);
    // ... altri campi
    
    setShowDraftBanner(false);
    toast.success('Bozza ripristinata!');
  }
};

const handleDismissDraft = () => {
  clearDraft();
  setShowDraftBanner(false);
  setSavedDraft(null);
  toast.success('Bozza eliminata.');
};
```

### Passo 5: UI Components

```typescript
{/* Banner per recupero bozze */}
{showDraftBanner && savedDraft && (
  <DraftBanner
    draftInfo={getDraftInfo()}
    onRestore={handleRestoreDraft}
    onDismiss={handleDismissDraft}
  />
)}

{/* Indicatore salvataggio attivo */}
<DraftIndicator 
  isActive={true}
  lastSaved={getDraftInfo()?.timeAgo}
/>
```

### Passo 6: Cleanup

```typescript
// Nel mutation onSuccess
const submitMutation = useMutation({
  onSuccess: () => {
    clearDraft(); // Elimina bozza dopo successo
    navigate('/success');
  }
});
```

---

## 🔧 Configurazione Avanzata

### Personalizzazione Hook

```typescript
const { loadDraft, clearDraft } = useFormDraft(
  formData,
  'complex_form',
  {
    enabled: isLoggedIn && !isReadOnly,  // Condizioni dinamiche
    debounceMs: 2000,                    // Salvataggio veloce
    maxAge: 30                          // Mantieni 30 giorni
  }
);
```

### Dati Complessi

```typescript
const complexFormData = {
  ...watchedFields,
  fileNames: files.map(f => f.name),    // Solo metadata file
  selectedOptions: selectedItems,       // Array di opzioni
  nestedData: { user: userData }        // Oggetti annidati
};

const { loadDraft } = useFormDraft(complexFormData, 'complex_form');
```

### Gestione Errori

```typescript
const handleRestoreDraft = () => {
  try {
    const draft = loadDraft();
    if (draft?.data) {
      // Ripristina con validazione
      Object.entries(draft.data).forEach(([key, value]) => {
        if (hasProperty(form, key) && value !== null) {
          setValue(key, value, { shouldValidate: true });
        }
      });
    }
  } catch (error) {
    console.error('Errore ripristino:', error);
    toast.error('Impossibile ripristinare la bozza');
  }
};
```

---

## 🎯 Best Practices

### ✅ Cosa Fare

1. **Sempre eliminare** bozze dopo submit successo
2. **Validare** i dati prima del ripristino
3. **Informare l'utente** sui file che non possono essere ripristinati
4. **Usare chiavi univoche** per ogni form
5. **Testare** il flusso completo di ripristino

### ❌ Cosa Evitare

1. **Non salvare** dati sensibili (password, token)
2. **Non salvare** file binari (solo metadata)
3. **Non ripristinare** campi non esistenti
4. **Non mantenere** bozze troppo a lungo
5. **Non abilitare** in form di login/pagamento

### 🔒 Sicurezza

- I dati sono salvati in **localStorage** (solo locale)
- **Nessun dato** è inviato al server automaticamente
- **Pulizia automatica** delle bozze vecchie
- **Validazione** dei dati ripristinati

---

## 🧪 Testing

### Test Manuale

1. **Riempi parzialmente** un form
2. **Chiudi la pagina** o ricarica
3. **Torna al form** - deve apparire il banner
4. **Clicca "Ripristina"** - verifica che i dati tornino
5. **Completa e invia** - verifica che la bozza sia eliminata

### Test Automatico

```typescript
// Test del hook
describe('useFormDraft', () => {
  test('salva e carica bozze', () => {
    const { result } = renderHook(() => 
      useFormDraft({ name: 'test' }, 'test_key')
    );
    
    expect(result.current.hasDraft()).toBe(false);
    
    // Simula salvataggio
    act(() => {
      result.current.saveDraft();
    });
    
    expect(result.current.hasDraft()).toBe(true);
  });
});
```

---

## 🔮 Sviluppi Futuri

### Versione 1.1 (Pianificata)
- [ ] **Salvataggio cloud** per utenti loggati
- [ ] **Sincronizzazione multi-device**
- [ ] **Versioning delle bozze**
- [ ] **Ripristino selettivo** per campo

### Versione 1.2 (Roadmap)
- [ ] **Compressione automatica** dati grandi
- [ ] **Crittografia locale** per dati sensibili
- [ ] **Analytics** utilizzo bozze
- [ ] **Backup automatico** su server

---

## 🆘 Troubleshooting

### Problemi Comuni

**❓ "La bozza non si salva"**
- Verifica che `enabled: true`
- Controlla la console per errori
- Verifica che i dati non siano vuoti

**❓ "Il banner non appare"**
- Controlla che `hasDraft()` sia true
- Verifica lo state `showDraftBanner`
- Controlla che la bozza non sia scaduta

**❓ "Errore nel ripristino"**
- Verifica la validità del JSON salvato
- Controlla che i campi del form esistano ancora
- Verifica la compatibilità dei tipi di dato

### Debug

```typescript
// Abilita log dettagliati
const { loadDraft, getDraftInfo } = useFormDraft(data, key, {
  enabled: true
});

// Controlla stato bozza
console.log('Has draft:', hasDraft());
console.log('Draft info:', getDraftInfo());
console.log('Draft data:', loadDraft());
```

---

**🎉 Sistema di Bozze implementato con successo!**  
**Ora gli utenti non perderanno mai più i loro progressi! 💾✨**
