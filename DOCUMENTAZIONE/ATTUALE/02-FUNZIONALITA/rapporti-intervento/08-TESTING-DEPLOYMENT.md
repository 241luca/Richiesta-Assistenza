# 📋 DEPLOYMENT & MAINTENANCE GUIDE

## DEPLOYMENT CHECKLIST COMPLETO

### Pre-Deployment
- [ ] Tutti i test passano (unit, integration, e2e)
- [ ] Code review completato
- [ ] Documentazione aggiornata
- [ ] Database migrations testate
- [ ] Backup database effettuato
- [ ] Variabili ambiente configurate
- [ ] SSL certificati pronti

### Deployment Steps

#### 1. Preparazione Database
```bash
# Backup database esistente
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Test migration su staging
npx prisma migrate deploy --preview-feature

# Esegui migration su production
npx prisma migrate deploy

# Esegui seed per dati iniziali
npx tsx prisma/seeds/intervention-report-seed.ts
```

#### 2. Build Applicazione
```bash
# Frontend build
cd client
npm run build

# Backend build
cd ../backend
npm run build

# Verifica build
npm run test:build
```

#### 3. Deploy su Server
```bash
# Deploy con PM2
pm2 start ecosystem.config.js --env production

# Verifica stato
pm2 status
pm2 logs
```

### Post-Deployment
- [ ] Test smoke su produzione
- [ ] Monitoring attivo
- [ ] Alert configurati
- [ ] Backup verificato
- [ ] Performance baseline registrata

---

## MONITORING & MAINTENANCE

### 1. Monitoring Setup

#### Health Checks
```typescript
// backend/src/monitoring/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
      () => this.disk.checkStorage('storage', { 
        thresholdPercent: 0.9, 
        path: '/' 
      }),
    ]);
  }

  @Get('reports')
  async checkReports() {
    const stats = await this.getReportStats();
    return {
      status: 'healthy',
      reports: {
        total: stats.total,
        today: stats.today,
        pending: stats.pending,
        errors: stats.errors
      },
      performance: {
        avgGenerationTime: stats.avgPdfTime,
        avgResponseTime: stats.avgApiTime
      }
    };
  }
}
```

### 2. Performance Monitoring

```typescript
// backend/src/monitoring/performance.service.ts
@Injectable()
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 1000 values
    if (values.length > 1000) {
      values.shift();
    }
  }

  getStats(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;

    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      p95: this.percentile(values, 0.95),
      p99: this.percentile(values, 0.99)
    };
  }

  private percentile(values: number[], p: number) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }
}
```

### 3. Error Tracking

```typescript
// backend/src/monitoring/error.interceptor.ts
@Injectable()
export class ErrorTrackingInterceptor implements NestInterceptor {
  constructor(
    private logger: LoggerService,
    private alertService: AlertService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return next.handle().pipe(
      catchError(err => {
        const errorLog = {
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
          userId: user?.id,
          error: {
            name: err.name,
            message: err.message,
            stack: err.stack
          },
          body: request.body,
          query: request.query
        };

        this.logger.error('Request error', errorLog);

        // Alert for critical errors
        if (this.isCriticalError(err)) {
          this.alertService.sendAlert({
            level: 'critical',
            title: `Critical Error: ${err.name}`,
            message: err.message,
            context: errorLog
          });
        }

        return throwError(err);
      })
    );
  }

  private isCriticalError(error: any): boolean {
    return error.name === 'DatabaseError' ||
           error.name === 'PaymentError' ||
           error.status === 500;
  }
}
```

---

## MAINTENANCE PROCEDURES

### 1. Backup Automation

```bash
#!/bin/bash
# backup-reports.sh

# Configuration
BACKUP_DIR="/backups/reports"
DB_NAME="richiesta_assistenza"
S3_BUCKET="s3://backups/reports"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR/$(date +%Y%m%d)

# Database backup
echo "Starting database backup..."
pg_dump $DATABASE_URL | gzip > $BACKUP_DIR/$(date +%Y%m%d)/db_$(date +%H%M%S).sql.gz

# Files backup (uploads, pdfs)
echo "Starting files backup..."
tar -czf $BACKUP_DIR/$(date +%Y%m%d)/files_$(date +%H%M%S).tar.gz \
  /app/uploads \
  /app/generated-pdfs

# Upload to S3
echo "Uploading to S3..."
aws s3 sync $BACKUP_DIR/$(date +%Y%m%d)/ $S3_BUCKET/$(date +%Y%m%d)/

# Clean old backups
echo "Cleaning old backups..."
find $BACKUP_DIR -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \;

echo "Backup completed successfully"
```

### 2. Database Maintenance

```sql
-- Maintenance queries da eseguire settimanalmente

-- 1. Vacuum e analyze
VACUUM ANALYZE intervention_report;
VACUUM ANALYZE intervention_report_template;
VACUUM ANALYZE intervention_material;

-- 2. Reindex tabelle critiche
REINDEX TABLE intervention_report;
REINDEX TABLE request_attachments;

-- 3. Clean up old drafts
DELETE FROM intervention_report 
WHERE status_id = 'draft' 
  AND updated_at < NOW() - INTERVAL '30 days';

-- 4. Archive old reports
INSERT INTO intervention_report_archive
SELECT * FROM intervention_report
WHERE created_at < NOW() - INTERVAL '1 year'
  AND status_id = 'signed';

DELETE FROM intervention_report
WHERE id IN (
  SELECT id FROM intervention_report_archive
);

-- 5. Statistics update
ANALYZE;
```

### 3. Performance Optimization

```typescript
// backend/src/optimization/cache.service.ts
@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async cacheReport(reportId: string, data: any): Promise<void> {
    await this.cacheManager.set(
      `report:${reportId}`,
      data,
      { ttl: 3600 } // 1 hour
    );
  }

  async getCachedReport(reportId: string): Promise<any> {
    return this.cacheManager.get(`report:${reportId}`);
  }

  async invalidateReport(reportId: string): Promise<void> {
    await this.cacheManager.del(`report:${reportId}`);
  }

  async warmupCache(): Promise<void> {
    // Preload frequently accessed data
    const templates = await this.prisma.interventionReportTemplate.findMany({
      where: { isActive: true }
    });

    for (const template of templates) {
      await this.cacheManager.set(
        `template:${template.id}`,
        template,
        { ttl: 86400 } // 24 hours
      );
    }
  }
}
```

---

## TROUBLESHOOTING GUIDE

### Common Issues & Solutions

#### 1. PDF Generation Timeout
**Problema**: Timeout durante generazione PDF per rapporti con molte foto

**Soluzione**:
```typescript
// Increase timeout
const browser = await puppeteer.launch({
  timeout: 60000, // 60 seconds
  args: ['--disable-dev-shm-usage']
});

// Optimize images before PDF
async function optimizeImages(photos: any[]) {
  return Promise.all(photos.map(async photo => {
    if (photo.size > 1024 * 1024) { // > 1MB
      return compressImage(photo, { quality: 0.8 });
    }
    return photo;
  }));
}
```

#### 2. Database Connection Pool Exhausted
**Problema**: "too many connections" error

**Soluzione**:
```typescript
// Optimize connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Reduce if needed
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  statement_timeout: 30000,
});

// Implement connection monitoring
pool.on('error', (err) => {
  console.error('Unexpected pool error', err);
  process.exit(-1);
});
```

#### 3. Memory Leaks
**Problema**: Aumento progressivo memoria

**Soluzione**:
```typescript
// Clean up resources
class ReportService {
  async generatePdf(reportId: string) {
    let browser;
    try {
      browser = await puppeteer.launch();
      // ... generate PDF
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

// Monitor memory usage
setInterval(() => {
  const used = process.memoryUsage();
  console.log('Memory usage:', {
    rss: Math.round(used.rss / 1024 / 1024) + ' MB',
    heap: Math.round(used.heapUsed / 1024 / 1024) + ' MB',
  });
  
  if (used.heapUsed > 500 * 1024 * 1024) { // > 500MB
    console.warn('High memory usage detected');
    // Trigger garbage collection if needed
    if (global.gc) global.gc();
  }
}, 60000);
```

---

## 📊 METRICHE DI SUCCESSO

### KPI Sistema Rapporti

| Metrica | Target | Formula |
|---------|--------|---------|
| Tempo medio compilazione | < 15 min | AVG(end_time - start_time) |
| Tasso completamento | > 90% | (completed / total) * 100 |
| Tasso firma cliente | > 85% | (signed / sent) * 100 |
| Tempo firma cliente | < 24h | AVG(signed_at - sent_at) |
| Soddisfazione cliente | > 4.5/5 | AVG(feedback_rating) |
| PDF generati con successo | > 99% | (success / total) * 100 |
| Materiali per rapporto | 3-5 | AVG(materials_count) |
| Foto per rapporto | 2-6 | AVG(photos_count) |

### Dashboard Monitoring

```sql
-- Query per dashboard
CREATE VIEW reports_dashboard AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_reports,
  COUNT(CASE WHEN status_id = 'signed' THEN 1 END) as signed_reports,
  AVG(total_hours) as avg_hours,
  AVG(EXTRACT(EPOCH FROM (client_signed_at - sent_to_client_at))/3600) as avg_sign_time_hours,
  COUNT(DISTINCT professional_id) as active_professionals,
  COUNT(CASE WHEN follow_up_required THEN 1 END) as followup_needed
FROM intervention_report
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 📝 DOCUMENTAZIONE UTENTE FINALE

### Per Professionisti
1. **Guida Rapida**: Come creare il primo rapporto
2. **Video Tutorial**: Uso timer e widget
3. **FAQ**: Problemi comuni e soluzioni
4. **Best Practices**: Compilazione efficace

### Per Clienti  
1. **Come Firmare**: Processo firma digitale
2. **Verifica Rapporto**: Cosa controllare
3. **Contestazioni**: Come aprire una disputa
4. **Download PDF**: Salvare e stampare

### Per Amministratori
1. **Setup Iniziale**: Configurazione sistema
2. **Template Management**: Creazione template
3. **Report Analytics**: Interpretazione dati
4. **Troubleshooting**: Risoluzione problemi

---

## ✅ CONCLUSIONE

Il **Sistema Rapporti di Intervento** è ora completamente:
- ✅ Sviluppato con tutte le funzionalità
- ✅ Testato a tutti i livelli
- ✅ Documentato per sviluppatori e utenti
- ✅ Pronto per il deployment
- ✅ Monitorabile e manutenibile

### Prossimi Sviluppi Suggeriti
1. **App Mobile**: Compilazione rapporti da smartphone
2. **Firma Biometrica**: Touch/Face ID per firma
3. **AI Assistant**: Compilazione assistita con AI
4. **Integrazione Fatturazione**: Generazione automatica fatture
5. **Dashboard Analytics**: Business intelligence avanzata

---

**Sistema sviluppato con successo!** 🎉

Il sistema è pronto per essere messo in produzione seguendo le guide di deployment e maintenance fornite.
