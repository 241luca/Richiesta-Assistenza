# 📋 RESPONSEFORMATTER - Standard di Comunicazione API

> ⚠️ **DOCUMENTO CRITICO**: Questo è lo standard OBBLIGATORIO per TUTTE le comunicazioni API nel progetto

**Ultima revisione**: 10 Gennaio 2025  
**Versione**: 1.0  
**Stato**: ✅ ATTIVO E VINCOLANTE

---

## 🎯 SCOPO E IMPORTANZA

Il **ResponseFormatter** è il sistema standardizzato per la comunicazione tra Backend e Frontend nel progetto Richiesta Assistenza. 

### Perché è CRITICO:
1. **Consistenza**: Tutte le API rispondono con la stessa struttura
2. **Sicurezza**: Previene errori React da oggetti non renderizzabili
3. **Manutenibilità**: Un solo punto per modificare il formato risposte
4. **Type Safety**: TypeScript può inferire correttamente i tipi
5. **Debug**: Struttura prevedibile per debugging e logging

---

## 🏗️ ARCHITETTURA

### Due File Separati

Il sistema utilizza **DUE file ResponseFormatter distinti**:

#### 1. Backend ResponseFormatter
**Percorso**: `/backend/src/utils/responseFormatter.ts`  
**Scopo**: CREARE risposte standardizzate  
**Uso**: ESCLUSIVAMENTE nelle routes, MAI nei services

#### 2. Frontend ResponseFormatter  
**Percorso**: `/src/utils/responseFormatter.ts`  
**Scopo**: INTERPRETARE risposte dal backend  
**Uso**: Nei componenti React per gestire dati ed errori

### Perché Sono Separati

1. **Separazione delle responsabilità**: Backend crea, Frontend interpreta
2. **Indipendenza**: Backend e Frontend sono progetti separati
3. **Dipendenze diverse**: Backend usa Prisma, Frontend usa Axios
4. **Evoluzione indipendente**: Possono evolvere separatamente mantenendo compatibilità

---

## 📦 STRUTTURA DELLE RISPOSTE

### Risposta di Successo

```json
{
  "success": true,
  "message": "Descrizione operazione completata",
  "data": {
    // Dati richiesti dall'operazione
  },
  "metadata": {
    // Metadati opzionali (paginazione, etc.)
  },
  "timestamp": "2025-01-10T12:00:00.000Z"
}
```

### Risposta di Errore

```json
{
  "success": false,
  "message": "Descrizione leggibile dell'errore",
  "error": {
    "code": "ERROR_CODE",
    "details": null // o array di errori Zod o altri dettagli
  },
  "timestamp": "2025-01-10T12:00:00.000Z"
}
```

### Risposta con Paginazione

```json
{
  "success": true,
  "message": "Lista recuperata con successo",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  },
  "timestamp": "2025-01-10T12:00:00.000Z"
}
```

---

## 💻 USO NEL BACKEND

### ✅ CORRETTO - Solo nelle Routes

```typescript
// routes/users.routes.ts
import { ResponseFormatter } from '../utils/responseFormatter';

router.get('/users', authenticate, async (req, res) => {
  try {
    // Il service ritorna SOLO i dati
    const users = await userService.getAllUsers();
    
    // La route usa ResponseFormatter per formattare
    return res.json(ResponseFormatter.success(
      users,
      'Utenti recuperati con successo'
    ));
  } catch (error) {
    logger.error('Error fetching users:', error);
    
    // Gestione errori strutturata
    if (error instanceof z.ZodError) {
      return res.status(400).json(ResponseFormatter.error(
        'Dati non validi',
        'VALIDATION_ERROR',
        error.errors
      ));
    }
    
    if (error.name === 'NotFoundError') {
      return res.status(404).json(ResponseFormatter.error(
        'Risorsa non trovata',
        'NOT_FOUND'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore interno del server',
      'INTERNAL_ERROR'
    ));
  }
});

// Con paginazione
router.get('/users/paginated', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const { data, total } = await userService.getUsersPaginated(page, limit);
    
    return res.json(ResponseFormatter.paginated(
      data,
      {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      'Utenti recuperati con successo'
    ));
  } catch (error) {
    // gestione errori...
  }
});
```

### ❌ SBAGLIATO - MAI nei Services

```typescript
// services/user.service.ts

// ❌ SBAGLIATO - Service non deve usare ResponseFormatter
export async function getAllUsers() {
  const users = await prisma.user.findMany();
  return ResponseFormatter.success(users); // NO!!!
}

// ✅ CORRETTO - Service ritorna solo dati
export async function getAllUsers() {
  return await prisma.user.findMany();
}

// ✅ CORRETTO - Service con logica business
export async function getUsersPaginated(page: number, limit: number) {
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count()
  ]);
  
  return { data, total }; // Solo dati, niente formatting
}
```

---

## 🎨 USO NEL FRONTEND

### Import e Setup

```typescript
// Importa sempre dal percorso corretto
import { ResponseFormatter } from '@/utils/responseFormatter';

// O importa le funzioni di convenienza
import { 
  getErrorMessage, 
  isValidationError,
  isAuthError,
  getValidationErrors 
} from '@/utils/responseFormatter';
```

### Gestione Errori con React Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { ResponseFormatter } from '@/utils/responseFormatter';
import toast from 'react-hot-toast';

function UserList() {
  // Query
  const { data, error, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users'),
    onError: (error) => {
      // Usa ResponseFormatter per estrarre messaggio leggibile
      toast.error(ResponseFormatter.getErrorMessage(error));
    }
  });

  // Mutation
  const createUserMutation = useMutation({
    mutationFn: (userData) => api.post('/users', userData),
    
    onSuccess: (response) => {
      // Estrai dati e messaggio dalla risposta
      const data = ResponseFormatter.getData(response);
      const message = ResponseFormatter.getMessage(response);
      
      toast.success(message);
      queryClient.invalidateQueries(['users']);
    },
    
    onError: (error) => {
      // Gestione errori completa
      const errorMessage = ResponseFormatter.getErrorMessage(error);
      toast.error(errorMessage);
      
      // Gestione specifica per validazione
      if (ResponseFormatter.isValidationError(error)) {
        const validationErrors = ResponseFormatter.getValidationErrors(error);
        
        // Mostra errori per campo
        Object.entries(validationErrors || {}).forEach(([field, error]) => {
          console.error(`Campo ${field}: ${error}`);
        });
      }
      
      // Gestione errori di autenticazione
      if (ResponseFormatter.isAuthError(error)) {
        navigate('/login');
      }
      
      // Gestione errori di autorizzazione
      if (ResponseFormatter.isAuthorizationError(error)) {
        toast.error('Non hai i permessi per questa operazione');
      }
    }
  });

  return (
    // UI component...
  );
}
```

### Gestione Errori in Form

```typescript
function UserForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const mutation = useMutation({
    mutationFn: (data) => api.post('/users', data),
    
    onError: (error) => {
      const errorMessage = ResponseFormatter.getErrorMessage(error);
      toast.error(errorMessage);
      
      // Se ci sono errori di validazione, mostrali nel form
      if (ResponseFormatter.isValidationError(error)) {
        const validationErrors = ResponseFormatter.getValidationErrors(error);
        if (validationErrors) {
          setErrors(validationErrors);
        }
      }
    }
  });

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" />
      {errors.email && <span className="text-red-500">{errors.email}</span>}
      
      <input name="password" />
      {errors.password && <span className="text-red-500">{errors.password}</span>}
      
      <button type="submit">Invia</button>
    </form>
  );
}
```

---

## 🔍 CODICI ERRORE STANDARD

### Codici di Sistema

- `INTERNAL_ERROR` - Errore generico del server
- `NOT_FOUND` - Risorsa non trovata
- `BAD_REQUEST` - Richiesta malformata
- `VALIDATION_ERROR` - Errore di validazione dati
- `UNAUTHORIZED` - Non autenticato
- `FORBIDDEN` - Non autorizzato
- `TOKEN_EXPIRED` - Token JWT scaduto
- `TOKEN_INVALID` - Token JWT non valido
- `CONFLICT` - Conflitto (es. duplicato)
- `TOO_MANY_REQUESTS` - Rate limit superato

### Codici Business Logic

- `FETCH_ERROR` - Errore nel recupero dati
- `CREATE_ERROR` - Errore nella creazione
- `UPDATE_ERROR` - Errore nell'aggiornamento
- `DELETE_ERROR` - Errore nella cancellazione
- `QUOTA_EXCEEDED` - Quota superata
- `PAYMENT_REQUIRED` - Pagamento richiesto
- `SERVICE_UNAVAILABLE` - Servizio non disponibile

---

## ✅ VERIFICA E TEST

### Script di Verifica

```bash
#!/bin/bash
# Verifica che ResponseFormatter sia usato correttamente

echo "Verifico ResponseFormatter nel progetto..."

# 1. Deve essere in TUTTE le routes
ROUTES_WITHOUT_RF=$(grep -L "ResponseFormatter" backend/src/routes/*.ts)
if [ -n "$ROUTES_WITHOUT_RF" ]; then
  echo "❌ Routes senza ResponseFormatter:"
  echo "$ROUTES_WITHOUT_RF"
  exit 1
fi

# 2. NON deve essere nei services
SERVICES_WITH_RF=$(grep -l "ResponseFormatter" backend/src/services/*.ts)
if [ -n "$SERVICES_WITH_RF" ]; then
  echo "❌ Services con ResponseFormatter (ERRORE):"
  echo "$SERVICES_WITH_RF"
  exit 1
fi

# 3. Frontend deve usare ResponseFormatter per errori
COMPONENTS_WITH_DIRECT_ERROR=$(grep -r "error.message\|error.response.data.error" src/components/ src/pages/)
if [ -n "$COMPONENTS_WITH_DIRECT_ERROR" ]; then
  echo "⚠️ Componenti che accedono direttamente agli errori:"
  echo "$COMPONENTS_WITH_DIRECT_ERROR"
fi

echo "✅ Verifica completata"
```

### Test Unitari

```typescript
// __tests__/responseFormatter.test.ts
import { ResponseFormatter } from '../utils/responseFormatter';

describe('ResponseFormatter Backend', () => {
  it('should format success response', () => {
    const data = { id: 1, name: 'Test' };
    const response = ResponseFormatter.success(data, 'Success');
    
    expect(response).toHaveProperty('success', true);
    expect(response).toHaveProperty('data', data);
    expect(response).toHaveProperty('message', 'Success');
    expect(response).toHaveProperty('timestamp');
  });

  it('should format error response', () => {
    const response = ResponseFormatter.error('Error', 'ERROR_CODE', { field: 'value' });
    
    expect(response).toHaveProperty('success', false);
    expect(response).toHaveProperty('message', 'Error');
    expect(response.error).toHaveProperty('code', 'ERROR_CODE');
    expect(response.error).toHaveProperty('details');
  });
});

describe('ResponseFormatter Frontend', () => {
  it('should extract error message from Axios error', () => {
    const axiosError = {
      response: {
        data: {
          success: false,
          message: 'Test error',
          error: { code: 'TEST_ERROR' }
        }
      }
    };
    
    const message = ResponseFormatter.getErrorMessage(axiosError);
    expect(message).toBe('Test error');
  });

  it('should handle validation errors', () => {
    const validationError = {
      response: {
        data: {
          success: false,
          message: 'Validation failed',
          error: {
            code: 'VALIDATION_ERROR',
            details: [
              { path: ['email'], message: 'Email non valida' },
              { path: ['password'], message: 'Password troppo corta' }
            ]
          }
        }
      }
    };
    
    const isValidation = ResponseFormatter.isValidationError(validationError);
    expect(isValidation).toBe(true);
    
    const errors = ResponseFormatter.getValidationErrors(validationError);
    expect(errors).toHaveProperty('email', 'Email non valida');
    expect(errors).toHaveProperty('password', 'Password troppo corta');
  });
});
```

---

## 🚨 ERRORI COMUNI DA EVITARE

### 1. ResponseFormatter nei Services

```typescript
// ❌ SBAGLIATO
// services/user.service.ts
export async function getUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  return ResponseFormatter.success(user); // NO!
}

// ✅ CORRETTO
export async function getUser(id: string) {
  return await prisma.user.findUnique({ where: { id } });
}
```

### 2. Risposte Custom nelle Routes

```typescript
// ❌ SBAGLIATO
router.get('/users', (req, res) => {
  const users = await service.getUsers();
  res.json({ data: users }); // NO! Usa ResponseFormatter
});

// ✅ CORRETTO
router.get('/users', (req, res) => {
  const users = await service.getUsers();
  res.json(ResponseFormatter.success(users, 'Utenti recuperati'));
});
```

### 3. Accesso Diretto agli Errori nel Frontend

```typescript
// ❌ SBAGLIATO
onError: (error) => {
  toast.error(error.message); // Potrebbe essere undefined
  toast.error(error.response.data.error); // Potrebbe essere un oggetto
}

// ✅ CORRETTO
onError: (error) => {
  toast.error(ResponseFormatter.getErrorMessage(error));
}
```

### 4. Rendering di Oggetti Errore in React

```typescript
// ❌ SBAGLIATO - Causa "Objects are not valid as a React child"
return <div>{error}</div>;
return <div>{error.response.data.error}</div>;

// ✅ CORRETTO
return <div>{ResponseFormatter.getErrorMessage(error)}</div>;
```

---

## 📊 VANTAGGI E BENEFICI

### Per lo Sviluppo

1. **Consistenza**: Un solo formato per tutte le API
2. **Type Safety**: TypeScript può inferire correttamente i tipi
3. **Manutenibilità**: Modifiche centralizzate
4. **Testing**: Facile da testare con struttura prevedibile

### Per il Debug

1. **Logging Strutturato**: Formato consistente nei log
2. **Error Tracking**: Facile integrazione con Sentry/LogRocket
3. **Network Tab**: Risposte sempre leggibili nel browser

### Per la UX

1. **Messaggi Chiari**: Utenti vedono sempre messaggi comprensibili
2. **Gestione Errori**: Nessun crash dell'applicazione
3. **Feedback Immediato**: Toast e notifiche consistenti

---

## 📚 RIFERIMENTI

- **File Backend**: `/backend/src/utils/responseFormatter.ts`
- **File Frontend**: `/src/utils/responseFormatter.ts`
- **Documentazione Principale**: `/ISTRUZIONI-PROGETTO.md`
- **Template Routes**: `/ISTRUZIONI-PROGETTO.md#templates`
- **Pre-commit Check**: `/scripts/pre-commit-check.sh`

---

## 🔄 MIGRAZIONE

Se hai codice esistente che non usa ResponseFormatter:

### Backend - Migrazione Routes

```typescript
// PRIMA
router.get('/users', async (req, res) => {
  try {
    const users = await service.getUsers();
    res.json({ users }); // Custom format
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DOPO
router.get('/users', async (req, res) => {
  try {
    const users = await service.getUsers();
    res.json(ResponseFormatter.success(users, 'Utenti recuperati'));
  } catch (error) {
    res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero utenti',
      'FETCH_ERROR'
    ));
  }
});
```

### Frontend - Migrazione Error Handling

```typescript
// PRIMA
onError: (error) => {
  const message = error?.response?.data?.message || 
                   error?.message || 
                   'Errore sconosciuto';
  toast.error(message);
}

// DOPO
import { ResponseFormatter } from '@/utils/responseFormatter';

onError: (error) => {
  toast.error(ResponseFormatter.getErrorMessage(error));
}
```

---

**IMPORTANTE**: Questo documento è parte delle regole vincolanti del progetto. Ogni API DEVE seguire questo standard senza eccezioni.

**Ultimo aggiornamento**: 10 Gennaio 2025  
**Autore**: Team Sviluppo  
**Versione**: 1.0
