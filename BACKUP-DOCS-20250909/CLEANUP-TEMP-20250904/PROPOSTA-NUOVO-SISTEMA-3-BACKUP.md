# 🎯 NUOVO SISTEMA BACKUP - 3 TIPI SEPARATI

## DESIGN PROPOSTO

### 📊 INTERFACCIA SEMPLICE:

```
┌─────────────────────────────────────────────┐
│           SISTEMA BACKUP                     │
├─────────────────────────────────────────────┤
│                                             │
│  [🗄️ Backup Database]  [📁 Backup Codice]  │
│  [📎 Backup Allegati]   [🔄 Backup Tutto]   │
│                                             │
├─────────────────────────────────────────────┤
│ BACKUP ESISTENTI:                          │
├─────────────────────────────────────────────┤
│                                             │
│ 📊 DATABASE                                │
│ ├─ db-2025-09-03-08-30.sql.gz (45 MB)     │
│ │  [📥 Scarica] [❌ Elimina]               │
│ ├─ db-2025-09-03-06-00.sql.gz (44 MB)     │
│ │  [📥 Scarica] [❌ Elimina]               │
│                                             │
│ 📁 CODICE                                   │
│ ├─ code-2025-09-03-08-00.tar.gz (120 MB)  │
│ │  [📥 Scarica] [❌ Elimina]               │
│                                             │
│ 📎 ALLEGATI                                 │
│ ├─ uploads-2025-09-03-07-45.tar.gz (250MB)│
│ │  [📥 Scarica] [❌ Elimina]               │
│                                             │
└─────────────────────────────────────────────┘
```

## 🛠️ IMPLEMENTAZIONE TECNICA

### 1️⃣ BACKUP DATABASE
```bash
# Usa pg_dump nativo di PostgreSQL
pg_dump $DATABASE_URL > backup.sql
gzip backup.sql
# Risultato: db-2025-09-03-08-30.sql.gz
```

### 2️⃣ BACKUP CODICE
```bash
# Crea archivio del codice escludendo node_modules e file temporanei
tar -czf code-backup.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=uploads \
  --exclude=*.backup \
  ./backend ./src ./shared
# Risultato: code-2025-09-03-08-00.tar.gz
```

### 3️⃣ BACKUP ALLEGATI
```bash
# Comprimi tutta la cartella uploads
tar -czf uploads-backup.tar.gz ./uploads
# Risultato: uploads-2025-09-03-07-45.tar.gz
```

## 📝 SCHEMA DATABASE SEMPLIFICATO

```sql
CREATE TABLE backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL, -- 'DATABASE', 'CODE', 'UPLOADS'
  filename VARCHAR(255) NOT NULL,
  filepath VARCHAR(500) NOT NULL,
  size BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Niente campi inutili come deletedAt, status, ecc.
-- Solo l'essenziale!
```

## 🚀 NUOVO SERVIZIO SUPER SEMPLICE

```typescript
class SimpleBackupService {
  private backupDir = '/backend/backups';
  
  // 1. BACKUP DATABASE
  async backupDatabase(): Promise<Backup> {
    const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm');
    const filename = `db-${timestamp}.sql.gz`;
    const filepath = path.join(this.backupDir, filename);
    
    // Esegui pg_dump + gzip
    await exec(`pg_dump ${DATABASE_URL} | gzip > ${filepath}`);
    
    // Verifica che esista
    const stats = fs.statSync(filepath);
    
    // Salva nel DB
    return await prisma.backup.create({
      data: {
        type: 'DATABASE',
        filename,
        filepath,
        size: stats.size,
        created_by: userId
      }
    });
  }
  
  // 2. BACKUP CODICE
  async backupCode(): Promise<Backup> {
    const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm');
    const filename = `code-${timestamp}.tar.gz`;
    const filepath = path.join(this.backupDir, filename);
    
    // Crea tar.gz escludendo file non necessari
    await exec(`tar -czf ${filepath} \
      --exclude=node_modules \
      --exclude=.git \
      --exclude=uploads \
      --exclude='*.backup*' \
      ./backend ./src ./shared`);
    
    const stats = fs.statSync(filepath);
    
    return await prisma.backup.create({
      data: {
        type: 'CODE',
        filename,
        filepath,
        size: stats.size,
        created_by: userId
      }
    });
  }
  
  // 3. BACKUP UPLOADS
  async backupUploads(): Promise<Backup> {
    const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm');
    const filename = `uploads-${timestamp}.tar.gz`;
    const filepath = path.join(this.backupDir, filename);
    
    // Comprimi uploads
    await exec(`tar -czf ${filepath} ./uploads`);
    
    const stats = fs.statSync(filepath);
    
    return await prisma.backup.create({
      data: {
        type: 'UPLOADS',
        filename,
        filepath,
        size: stats.size,
        created_by: userId
      }
    });
  }
  
  // 4. LISTA BACKUP (solo quelli che esistono davvero!)
  async listBackups(type?: string): Promise<Backup[]> {
    const where = type ? { type } : {};
    const backups = await prisma.backup.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });
    
    // IMPORTANTE: Verifica che i file esistano!
    return backups.filter(b => fs.existsSync(b.filepath));
  }
  
  // 5. ELIMINA BACKUP
  async deleteBackup(id: string): Promise<void> {
    const backup = await prisma.backup.findUnique({ where: { id } });
    
    // Elimina file fisico
    if (fs.existsSync(backup.filepath)) {
      fs.unlinkSync(backup.filepath);
    }
    
    // Elimina record DB
    await prisma.backup.delete({ where: { id } });
  }
  
  // 6. DOWNLOAD BACKUP
  async downloadBackup(id: string): Promise<Stream> {
    const backup = await prisma.backup.findUnique({ where: { id } });
    
    if (!fs.existsSync(backup.filepath)) {
      throw new Error('File non trovato!');
    }
    
    return fs.createReadStream(backup.filepath);
  }
}
```

## ✅ VANTAGGI DI QUESTO APPROCCIO

1. **SEPARAZIONE CHIARA**
   - Database: Solo dati
   - Codice: Solo sorgenti
   - Uploads: Solo file utente

2. **AFFIDABILITÀ 100%**
   - Comandi shell diretti (pg_dump, tar)
   - Niente librerie JavaScript fragili
   - Verifica sempre che il file esista

3. **VELOCITÀ**
   - Backup database: ~5 secondi
   - Backup codice: ~10 secondi
   - Backup uploads: dipende dalla dimensione

4. **RIPRISTINO FACILE**
   ```bash
   # Ripristina database
   gunzip < db-backup.sql.gz | psql $DATABASE_URL
   
   # Ripristina codice
   tar -xzf code-backup.tar.gz
   
   # Ripristina uploads
   tar -xzf uploads-backup.tar.gz
   ```

## 🎨 INTERFACCIA REACT SEMPLICE

```jsx
function BackupPage() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const createBackup = async (type) => {
    setLoading(true);
    try {
      await api.post('/backup', { type });
      toast.success(`Backup ${type} creato!`);
      refreshBackups();
    } catch (error) {
      toast.error('Errore nel backup!');
    }
    setLoading(false);
  };
  
  return (
    <div className="p-6">
      <h1>Sistema Backup</h1>
      
      {/* Bottoni per creare backup */}
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => createBackup('DATABASE')}
          disabled={loading}
          className="btn btn-primary"
        >
          🗄️ Backup Database
        </button>
        
        <button 
          onClick={() => createBackup('CODE')}
          disabled={loading}
          className="btn btn-secondary"
        >
          📁 Backup Codice
        </button>
        
        <button 
          onClick={() => createBackup('UPLOADS')}
          disabled={loading}
          className="btn btn-warning"
        >
          📎 Backup Allegati
        </button>
      </div>
      
      {/* Lista backup esistenti */}
      <div className="space-y-4">
        {['DATABASE', 'CODE', 'UPLOADS'].map(type => (
          <div key={type}>
            <h3>{type}</h3>
            {backups
              .filter(b => b.type === type)
              .map(backup => (
                <div key={backup.id} className="flex items-center justify-between">
                  <span>{backup.filename} ({formatSize(backup.size)})</span>
                  <div>
                    <button onClick={() => download(backup.id)}>📥 Scarica</button>
                    <button onClick={() => deleteBackup(backup.id)}>❌ Elimina</button>
                  </div>
                </div>
              ))
            }
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🚀 TEMPO DI IMPLEMENTAZIONE

- **Backend service**: 1 ora
- **API routes**: 30 minuti  
- **Frontend**: 1 ora
- **Test**: 30 minuti

**TOTALE: 3 ore per un sistema PERFETTO!**

---

## 📌 CONCLUSIONE

Questo sistema è:
- ✅ **SEMPLICE** - Niente complessità inutile
- ✅ **AFFIDABILE** - Usa strumenti nativi del sistema
- ✅ **TRASPARENTE** - Vedi sempre cosa c'è
- ✅ **VELOCE** - Backup in pochi secondi
- ✅ **SICURO** - Verifica sempre l'esistenza dei file

Che ne dici? Vuoi procedere con questo approccio?
