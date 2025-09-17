# 🧪 Documentazione Test Automatici

> **Sistema di Test Completo** per il Sistema Richiesta Assistenza  
> Ultimo aggiornamento: 25 Agosto 2025

## 📋 Indice

1. [Panoramica](#panoramica)
2. [Tipologie di Test](#tipologie-di-test)
3. [Come Eseguire i Test](#come-eseguire-i-test)
4. [Struttura dei Test](#struttura-dei-test)
5. [Test Disponibili](#test-disponibili)
6. [Coverage e Report](#coverage-e-report)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Panoramica

Il sistema include una **suite completa di test automatici** che copre:
- ✅ **Unit Test**: Test delle singole funzioni e componenti
- ✅ **Integration Test**: Test delle interazioni tra componenti
- ✅ **E2E Test**: Test del flusso utente completo
- ✅ **API Test**: Test degli endpoint REST
- ✅ **WebSocket Test**: Test delle connessioni real-time

### Stack di Testing

| Tipo | Framework | Descrizione |
|------|-----------|-------------|
| **Backend** | Vitest | Test runner veloce per Node.js |
| **API** | Supertest | Test delle API HTTP |
| **E2E** | Playwright | Test automatici del browser |
| **Coverage** | V8 | Analisi copertura codice |

---

## 🔧 Tipologie di Test

### 1. Unit Test
Test isolati di singole funzioni o moduli.

**Esempio:**
```typescript
describe('Authentication', () => {
  it('should hash password correctly', async () => {
    const password = 'TestPassword123';
    const hashed = await hashPassword(password);
    expect(hashed).not.toBe(password);
    expect(await verifyPassword(password, hashed)).toBe(true);
  });
});
```

### 2. Integration Test
Test che verificano l'interazione tra più componenti.

**Esempio:**
```typescript
describe('User Journey', () => {
  it('should complete full request flow', async () => {
    // 1. Login
    // 2. Create request
    // 3. Assign professional
    // 4. Create quote
    // 5. Accept quote
  });
});
```

### 3. End-to-End Test
Test che simulano l'interazione utente nel browser.

**Esempio:**
```typescript
test('should login and create request', async ({ page }) => {
  await page.goto('/auth');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button:has-text("Accedi")');
  await expect(page).toHaveURL(/.*dashboard/);
});
```

---

## 🚀 Come Eseguire i Test

### Metodo 1: Script Automatico (Consigliato)

```bash
# Esegui lo script interattivo
./run-tests.sh

# Opzioni disponibili:
# 1) Test Backend
# 2) Test E2E Frontend  
# 3) Test Completi
# 4) Test con Coverage
# 5) Test Specifico
```

### Metodo 2: Comandi Diretti

#### Test Backend
```bash
cd backend
npm test                    # Tutti i test backend
npm run test:coverage       # Con coverage report
npm test auth              # Solo test auth
npm test websocket         # Solo test websocket
```

#### Test E2E Frontend
```bash
# Dalla root del progetto
npx playwright test        # Tutti i test E2E
npx playwright test auth   # Solo test autenticazione
npx playwright test --ui   # Con interfaccia grafica
npx playwright test --debug # Modalità debug
```

#### Test Specifici
```bash
# Test singolo file
cd backend
npx vitest run src/__tests__/auth.test.ts

# Test con pattern
npx vitest run --grep "login"

# Test in watch mode
npx vitest --watch
```

---

## 📁 Struttura dei Test

```
richiesta-assistenza/
├── backend/
│   ├── src/
│   │   └── __tests__/
│   │       ├── setup.ts           # Setup globale test
│   │       ├── auth.test.ts       # Test autenticazione
│   │       ├── websocket.test.ts  # Test WebSocket
│   │       ├── api.test.ts        # Test API endpoints
│   │       └── integration.test.ts # Test integrazione
│   └── vitest.config.ts          # Config Vitest
├── tests/
│   ├── auth.e2e.test.ts         # E2E autenticazione
│   └── requests.e2e.test.ts     # E2E richieste
├── playwright.config.ts          # Config Playwright
└── run-tests.sh                 # Script esecuzione
```

---

## ✅ Test Disponibili

### Test Autenticazione (`auth.test.ts`)

| Test | Descrizione |
|------|-------------|
| Registration | Registrazione nuovo utente |
| Login | Login con credenziali valide |
| Invalid Credentials | Gestione credenziali errate |
| Account Lockout | Blocco dopo 5 tentativi |
| Token Refresh | Rinnovo access token |
| 2FA Setup | Configurazione 2FA |
| Password Reset | Reset password |

### Test WebSocket (`websocket.test.ts`)

| Test | Descrizione |
|------|-------------|
| Connection | Connessione con token JWT |
| Authentication | Verifica autenticazione |
| Invalid Token | Rifiuto token non validi |
| Events | Gestione eventi real-time |
| Rooms | Gestione rooms e canali |
| Disconnection | Disconnessione pulita |

### Test API (`api.test.ts`)

| Test | Descrizione |
|------|-------------|
| Requests CRUD | Create, Read, Update, Delete richieste |
| Categories | Gestione categorie |
| User Profile | Gestione profilo utente |
| Authorization | Controllo permessi |
| Rate Limiting | Limite richieste |
| Validation | Validazione input |

### Test E2E (`*.e2e.test.ts`)

| Test | Descrizione |
|------|-------------|
| Login Flow | Flusso completo login |
| Registration | Registrazione via UI |
| Create Request | Creazione richiesta |
| View Requests | Lista e filtri |
| Professional Flow | Dashboard professionista |
| Quote Management | Gestione preventivi |

---

## 📊 Coverage e Report

### Generare Coverage Report

```bash
cd backend
npm run test:coverage
```

### Visualizzare Report

```bash
# Apri nel browser
open backend/coverage/index.html

# O con live server
npx live-server backend/coverage
```

### Metriche Target

| Metrica | Target | Attuale |
|---------|--------|---------|
| **Statements** | > 80% | - |
| **Branches** | > 75% | - |
| **Functions** | > 80% | - |
| **Lines** | > 80% | - |

### Report Playwright

```bash
# Genera report HTML
npx playwright show-report

# Trace viewer per debug
npx playwright show-trace trace.zip
```

---

## 💡 Best Practices

### 1. Naming Convention
```typescript
// ✅ BUONO: Descrittivo e chiaro
describe('Authentication System', () => {
  it('should register new user with valid data', () => {});
  it('should reject duplicate email addresses', () => {});
});

// ❌ CATTIVO: Vago e poco chiaro
describe('auth', () => {
  it('works', () => {});
  it('fails sometimes', () => {});
});
```

### 2. Test Isolation
```typescript
// ✅ BUONO: Test isolati e indipendenti
beforeEach(async () => {
  // Setup pulito per ogni test
  await cleanDatabase();
  testUser = await createTestUser();
});

afterEach(async () => {
  // Cleanup dopo ogni test
  await deleteTestUser(testUser.id);
});
```

### 3. Async/Await
```typescript
// ✅ BUONO: Gestione corretta async
it('should fetch user data', async () => {
  const user = await getUserById(1);
  expect(user).toBeDefined();
});

// ❌ CATTIVO: Promise non gestite
it('should fetch user data', () => {
  getUserById(1).then(user => {
    expect(user).toBeDefined();
  });
});
```

### 4. Test Data
```typescript
// ✅ BUONO: Dati di test espliciti
const testUser = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};

// ❌ CATTIVO: Dati hardcoded sparsi
await createUser('john@gmail.com', '123456');
```

---

## 🔧 Troubleshooting

### Problema: "Cannot find module"

**Soluzione:**
```bash
cd backend
npm install
npm run prisma:generate
```

### Problema: "Database connection failed"

**Soluzione:**
```bash
# Verifica PostgreSQL
pg_isready

# Verifica variabili ambiente
echo $DATABASE_URL

# Usa test database
export DATABASE_URL="postgresql://user:pass@localhost:5432/test_db"
```

### Problema: "Port already in use"

**Soluzione:**
```bash
# Trova processo sulla porta
lsof -i:3200
lsof -i:5193

# Killa processo
kill -9 [PID]
```

### Problema: "Playwright browser not installed"

**Soluzione:**
```bash
npx playwright install
npx playwright install-deps
```

### Problema: "Test timeout"

**Soluzione:**
```typescript
// Aumenta timeout per test lenti
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 secondi
  // ...
});
```

---

## 📈 CI/CD Integration

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          npm ci
          cd backend && npm ci
      
      - name: Run backend tests
        run: cd backend && npm test
      
      - name: Run E2E tests
        run: npx playwright test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          directory: ./backend/coverage
```

---

## 🎯 Checklist Test

Prima di ogni release, verificare:

- [ ] Tutti i test backend passano
- [ ] Tutti i test E2E passano
- [ ] Coverage > 80%
- [ ] Nessun test skippato senza motivo
- [ ] Test di sicurezza eseguiti
- [ ] Test di performance accettabili
- [ ] Test su diversi browser (Chrome, Firefox, Safari)
- [ ] Test su mobile (se applicabile)

---

## 📚 Risorse Utili

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

*Test Suite sviluppata con ❤️ per garantire qualità e affidabilità del sistema*
