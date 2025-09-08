# 🔍 PIANO COMPLETO HARDCODED ANALYSIS - 28 Agosto 2025

## 📊 VALORI HARDCODED IDENTIFICATI

### 1. ENUM PRIORITY 
- **Valori**: LOW, MEDIUM, HIGH, URGENT
- **Location**: schema.prisma, request.routes.ts, RequestsPage.tsx
- **Colori attuali**:
  - LOW: Verde (success)
  - MEDIUM: Giallo (warning) 
  - HIGH: Arancione (danger)
  - URGENT: Rosso (critical)

### 2. ENUM REQUEST STATUS
- **Valori**: PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
- **Location**: schema.prisma, request.routes.ts, RequestsPage.tsx
- **Colori attuali**:
  - PENDING: Giallo (waiting)
  - ASSIGNED: Blu (assigned)
  - IN_PROGRESS: Arancione (working)
  - COMPLETED: Verde (success)
  - CANCELLED: Grigio (cancelled)

### 3. ENUM QUOTE STATUS
- **Valori**: DRAFT, PENDING, ACCEPTED, REJECTED, EXPIRED
- **Location**: schema.prisma, quote.routes.ts, QuotesPage.tsx
- **Colori attuali**:
  - DRAFT: Grigio (draft)
  - PENDING: Giallo (pending)
  - ACCEPTED: Verde (success)
  - REJECTED: Rosso (rejected)
  - EXPIRED: Arancione (expired)

### 4. USER ROLES
- **Valori**: SUPER_ADMIN, ADMIN, PROFESSIONAL, CLIENT
- **Location**: schema.prisma, Layout.tsx, auth middleware
- **Permessi**: Diversi livelli di accesso

### 5. FOOTER CONTENT
- **Testo**: "© 2025 Sistema Richiesta Assistenza v2.0 | Enterprise Edition"
- **Location**: Layout.tsx
- **Configurabile**: Testo, versione, anno

### 6. ENUM AI SETTINGS
- **Response Style**: FORMAL, INFORMAL, TECHNICAL, EDUCATIONAL
- **Detail Level**: BASIC, INTERMEDIATE, ADVANCED
- **Location**: schema.prisma, SubcategoryAiSettings

### 7. ENUM PAYMENT
- **Payment Status**: PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED
- **Payment Type**: DEPOSIT, FULL_PAYMENT, PARTIAL_PAYMENT
- **Location**: schema.prisma, payment services

### 8. NOTIFICATION PRIORITY
- **Valori**: LOW, NORMAL, HIGH, URGENT
- **Location**: schema.prisma, notification system

## 🎯 NUOVO SISTEMA ADMIN

### MENU AMMINISTRAZIONE (SUPER_ADMIN only)
- 📋 **Gestione Stati** (Request Status + colori)
- ⚡ **Gestione Priorità** (Priority + colori)  
- 💰 **Gestione Preventivi** (Quote Status + colori)
- 👥 **Gestione Ruoli** (User Roles + permessi)
- 🤖 **Impostazioni AI** (Response Styles + Detail Levels)
- 💳 **Impostazioni Pagamenti** (Payment Status/Types)
- 🔔 **Priorità Notifiche** (Notification Priority + colori)
- 📝 **Configurazione Footer** (Testo + versione + copyright)

### TABELLE DATABASE DA CREARE
1. `SystemEnums` - Gestione enum dinamici
2. `SystemSettings` - Impostazioni globali
3. `EnumValues` - Valori enum con metadati
4. `ColorSettings` - Configurazioni colori

### STRUTTURA PROPOSTA

```sql
-- Tabella per gestire gli enum di sistema
CREATE TABLE SystemEnums (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL, -- 'REQUEST_STATUS', 'PRIORITY', etc
  description TEXT,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP
);

-- Tabella per i valori degli enum
CREATE TABLE EnumValues (
  id UUID PRIMARY KEY, 
  enumId UUID REFERENCES SystemEnums(id),
  value VARCHAR(100) NOT NULL, -- 'PENDING', 'HIGH', etc
  label VARCHAR(255) NOT NULL, -- 'In Attesa', 'Alta', etc
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color
  textColor VARCHAR(7) DEFAULT '#FFFFFF',
  icon VARCHAR(100), -- Nome icona Heroicons
  order INTEGER DEFAULT 0,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP,
  UNIQUE(enumId, value)
);

-- Tabella per impostazioni sistema
CREATE TABLE SystemSettings (
  id UUID PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL, -- 'FOOTER_TEXT', 'APP_VERSION', etc
  value TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'string', -- string, number, boolean, json
  description TEXT,
  category VARCHAR(100) DEFAULT 'general',
  isEditable BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP
);
```

## 🚀 IMPLEMENTAZIONE

### STEP 1: Backup Sistema
✅ Fatto - backup in /backup/hardcoded-analysis-20250828/

### STEP 2: Schema Database  
- Creare migration con nuove tabelle
- Popolare dati iniziali da valori esistenti
- Mantenere compatibilità con enum esistenti

### STEP 3: Backend Services
- SystemEnumService per CRUD enum
- SystemSettingsService per configurazioni  
- Middleware per validazione enum dinamici
- API routes per admin

### STEP 4: Frontend Admin
- Componente EnumManager
- Componente SettingsManager
- ColorPicker component
- Menu amministrazione nel Layout

### STEP 5: Integrazione
- Aggiornare ResponseFormatter
- Aggiornare validazione Zod
- Aggiornare componenti UI (Badge, Status, etc)
- Testing completo

### STEP 6: Migrazione
- Script migrazione dati esistenti
- Backward compatibility
- Testing produzione

## ⚠️ ATTENZIONI
- Mantenere compatibilità esistente durante transizione
- Backup obbligatorio prima di ogni step  
- Testing approfondito validation logic
- Performance: cache enum values
- Security: solo SUPER_ADMIN può modificare

## 📝 DELIVERABLES
1. ✅ Sistema tabelle configurabili
2. ✅ Admin UI per gestione
3. ✅ API complete per CRUD
4. ✅ Migrazione dati esistenti
5. ✅ Documentazione aggiornata
6. ✅ Test coverage completo

---
**Data Analisi**: 28 Agosto 2025  
**Sviluppatore**: Claude Sonnet 4  
**Stato**: Piano Approvato - Pronto per implementazione
