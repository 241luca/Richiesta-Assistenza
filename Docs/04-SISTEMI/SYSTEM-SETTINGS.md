# SYSTEM SETTINGS - DOCUMENTAZIONE
**Data**: 16 Gennaio 2025  
**Versione**: 1.0.0

## 📋 STATO IMPLEMENTAZIONE

### ✅ COMPLETATO
- **Pagina System Settings** (`/admin/system-settings`)
- **API Backend** (`/api/admin/system-settings`)
- **Database Table** (`SystemSettings`)
- **CRUD Completo** (Create, Read, Update, Delete)

### 📍 PERCORSI
- **Frontend**: `/src/pages/admin/SystemSettingsPage.tsx`
- **Backend Routes**: `/backend/src/routes/admin/system-settings.routes.ts`
- **Database**: Tabella `SystemSettings` in Prisma schema

### 🔧 FUNZIONALITÀ IMPLEMENTATE
1. **Gestione Impostazioni**
   - Create/Read/Update/Delete impostazioni
   - Categorie: Branding, Azienda, Contatti, Privacy, Sistema
   - Tipi campo: string, text, boolean, email, url, color

2. **Interfaccia**
   - Layout a tab per categorie
   - Modifica inline
   - Preview immagini per logo/favicon
   - Filtri e ricerca

3. **API Endpoints**
   - `GET /api/admin/system-settings` - Lista tutte
   - `POST /api/admin/system-settings` - Crea nuova
   - `PUT /api/admin/system-settings/:id` - Aggiorna
   - `DELETE /api/admin/system-settings/:id` - Elimina

### 📦 SEED DATA
Script disponibile: `/backend/seed-system-settings.js`
```bash
cd backend
node seed-system-settings.js
```

### ⚠️ NOTE
- Logo e favicon vanno caricati manualmente
- Richiede ruolo ADMIN o SUPER_ADMIN
- Le impostazioni con `isEditable: false` sono protette

### 🚀 UTILIZZO
1. Accedi come admin
2. Vai a `/admin/system-settings`
3. Crea/modifica impostazioni per categoria
4. Il sistema usa queste impostazioni globalmente

---
**Fine documentazione System Settings**
