        this.addMetric('test_backup_size_kb', Math.round(stats.size / 1024));
        
        // Clean up test backup
        fs.unlinkSync(testBackupPath);
      } else {
        throw new Error('Backup file not created');
      }
      
    } catch (error: any) {
      this.addCheck({
        name: 'backup_creation_test',
        description: 'Backup creation capability',
        status: CheckStatus.FAIL,
        message: `Backup creation failed: ${error.message}`,
        severity: CheckSeverity.HIGH
      });
      
      this.addRecommendation('Ensure pg_dump is installed and accessible');
      this.addRecommendation('Verify DATABASE_URL credentials are correct');
      
      // Clean up if exists
      if (fs.existsSync(testBackupPath)) {
        fs.unlinkSync(testBackupPath);
      }
    }
  }
  
  private async checkBackupScripts(): Promise<void> {
    this.log('Checking backup scripts...', 'info');
    
    const scriptsToCheck = [
      {
        path: path.join(process.cwd(), '..', 'scripts', 'backup-database.sh'),
        description: 'Main backup script'
      },
      {
        path: path.join(process.cwd(), '..', 'scripts', 'restore-database.sh'),
        description: 'Restore script'
      },
      {
        path: path.join(process.cwd(), 'src/services/simple-backup.service.ts'),
        description: 'Backup service'
      },
      {
        path: path.join(process.cwd(), 'src/routes/simple-backup.routes.ts'),
        description: 'Backup API routes'
      }
    ];
    
    let allScriptsExist = true;
    const missingScripts: string[] = [];
    
    for (const script of scriptsToCheck) {
      const exists = fs.existsSync(script.path);
      if (!exists) {
        allScriptsExist = false;
        missingScripts.push(script.description);
        this.log(`Missing script: ${script.description}`, 'warning');
      }
    }
    
    this.addCheck({
      name: 'backup_scripts',
      description: 'Backup script availability',
      status: allScriptsExist ? CheckStatus.PASS : CheckStatus.WARN,
      message: allScriptsExist 
        ? 'All backup scripts present' 
        : `Missing scripts: ${missingScripts.join(', ')}`,
      severity: CheckSeverity.MEDIUM
    });
    
    if (!allScriptsExist) {
      this.addRecommendation('Create missing backup scripts for complete functionality');
    }
  }
  
  private async checkRestoreCapability(): Promise<void> {
    this.log('Checking restore capability...', 'info');
    
    try {
      // Check if psql is available
      const { stdout } = await execAsync('which psql');
      const psqlPath = stdout.trim();
      
      this.addCheck({
        name: 'restore_capability',
        description: 'Database restore capability',
        status: CheckStatus.PASS,
        message: `psql found at: ${psqlPath}`,
        severity: CheckSeverity.HIGH
      });
      
      // Check if we have any backup to potentially restore
      const backups = fs.existsSync(this.backupDir) 
        ? fs.readdirSync(this.backupDir).filter(f => f.endsWith('.sql') || f.endsWith('.backup'))
        : [];
      
      if (backups.length === 0) {
        this.addMetric('restorable_backups', 0);
        this.addRecommendation('No backups available to restore - create a backup first');
      } else {
        this.addMetric('restorable_backups', backups.length);
      }
      
    } catch (error: any) {
      this.addCheck({
        name: 'restore_capability',
        description: 'Database restore capability',
        status: CheckStatus.FAIL,
        message: 'psql not found - restore capability limited',
        severity: CheckSeverity.HIGH
      });
      
      this.addRecommendation('Install PostgreSQL client tools for restore capability');
    }
  }
  
  private async checkBackupRetention(): Promise<void> {
    this.log('Checking backup retention...', 'info');
    
    if (!fs.existsSync(this.backupDir)) {
      this.addCheck({
        name: 'backup_retention',
        description: 'Backup retention policy',
        status: CheckStatus.SKIP,
        message: 'No backup directory to check',
        severity: CheckSeverity.LOW
      });
      return;
    }
    
    const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30');
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    
    const files = fs.readdirSync(this.backupDir)
      .filter(f => f.endsWith('.sql') || f.endsWith('.sql.gz') || f.endsWith('.backup'))
      .map(f => ({
        name: f,
        path: path.join(this.backupDir, f),
        stats: fs.statSync(path.join(this.backupDir, f))
      }));
    
    const oldBackups = files.filter(f => f.stats.mtime < cutoffDate);
    const recentBackups = files.filter(f => f.stats.mtime >= cutoffDate);
    
    this.addCheck({
      name: 'backup_retention',
      description: 'Backup retention policy compliance',
      status: oldBackups.length === 0 ? CheckStatus.PASS : CheckStatus.WARN,
      message: oldBackups.length === 0 
        ? `All backups within ${retentionDays} day retention`
        : `${oldBackups.length} backups older than ${retentionDays} days`,
      value: oldBackups.length,
      expected: 0,
      severity: CheckSeverity.LOW
    });
    
    this.addMetric('old_backups', oldBackups.length);
    this.addMetric('recent_backups', recentBackups.length);
    this.addMetric('retention_policy_days', retentionDays);
    
    if (oldBackups.length > 0) {
      this.addRecommendation(`Remove ${oldBackups.length} old backups to comply with retention policy`);
      
      // Calculate space that could be freed
      const spaceToFree = oldBackups.reduce((sum, f) => sum + f.stats.size, 0);
      const spaceToFreeMB = Math.round(spaceToFree / 1024 / 1024);
      this.addMetric('space_to_free_mb', spaceToFreeMB);
    }
  }
  
  private async checkBackupEncryption(): Promise<void> {
    this.log('Checking backup encryption...', 'info');
    
    const encryptionEnabled = process.env.BACKUP_ENCRYPTION === 'true';
    const encryptionKey = !!process.env.BACKUP_ENCRYPTION_KEY;
    
    if (!encryptionEnabled) {
      this.addCheck({
        name: 'backup_encryption',
        description: 'Backup encryption status',
        status: CheckStatus.WARN,
        message: 'Backup encryption not enabled',
        severity: CheckSeverity.MEDIUM
      });
      
      this.addRecommendation('Enable backup encryption for sensitive data protection');
    } else if (!encryptionKey) {
      this.addCheck({
        name: 'backup_encryption',
        description: 'Backup encryption status',
        status: CheckStatus.FAIL,
        message: 'Encryption enabled but no key configured',
        severity: CheckSeverity.HIGH
      });
    } else {
      this.addCheck({
        name: 'backup_encryption',
        description: 'Backup encryption status',
        status: CheckStatus.PASS,
        message: 'Backup encryption properly configured',
        severity: CheckSeverity.MEDIUM
      });
    }
    
    this.addMetric('encryption_enabled', encryptionEnabled);
  }
  
  private async checkBackupStatistics(): Promise<void> {
    this.log('Collecting backup statistics...', 'info');
    
    try {
      // Database size
      const dbSizeResult = await prisma.$queryRaw<any[]>`
        SELECT pg_database_size(current_database()) as size
      `;
      const dbSizeMB = Math.round(dbSizeResult[0].size / 1024 / 1024);
      
      this.addMetric('database_size_mb', dbSizeMB);
      
      // Table count
      const tableCountResult = await prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      const tableCount = parseInt(tableCountResult[0].count);
      
      this.addMetric('table_count', tableCount);
      
      // Check if database is growing rapidly
      const growthWarningThreshold = 1000; // MB
      if (dbSizeMB > growthWarningThreshold) {
        this.addRecommendation('Database is large - consider implementing incremental backups');
      }
      
      // Estimate backup time based on size
      const estimatedBackupTime = Math.round(dbSizeMB / 10); // Rough estimate: 10MB/s
      this.addMetric('estimated_backup_time_seconds', estimatedBackupTime);
      
      // Check backup frequency recommendation
      if (dbSizeMB < 100) {
        this.addMetric('recommended_backup_frequency', 'daily');
      } else if (dbSizeMB < 1000) {
        this.addMetric('recommended_backup_frequency', 'twice daily');
      } else {
        this.addMetric('recommended_backup_frequency', 'hourly incremental');
      }
      
    } catch (error: any) {
      this.log(`Statistics collection error: ${error.message}`, 'warning');
    }
    
    // Calculate health score adjustments
    if (this.result.score === 100) {
      this.log('Backup system is perfectly healthy!', 'success');
    } else if (this.result.score >= 80) {
      this.log('Backup system is healthy with minor issues', 'success');
    } else if (this.result.score >= 60) {
      this.log('Backup system needs attention', 'warning');
    } else {
      this.log('Backup system has critical issues!', 'error');
    }
  }
}

// Esecuzione
async function main() {
  const healthCheck = new BackupSystemHealthCheck();
  const result = await healthCheck.execute();
  
  // Output formattato
  console.log('\n' + '='.repeat(60));
  console.log(`HEALTH CHECK RESULT: ${result.displayName}`);
  console.log('='.repeat(60));
  console.log(`Status: ${result.status.toUpperCase()} (Score: ${result.score}/100)`);
  console.log(`Execution Time: ${result.executionTime}ms`);
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    result.warnings.forEach(w => console.log(`  - ${w}`));
  }
  
  if (result.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    result.errors.forEach(e => console.log(`  - ${e}`));
  }
  
  if (result.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    result.recommendations.forEach(r => console.log(`  - ${r}`));
  }
  
  console.log('\n📊 METRICS:');
  Object.entries(result.metrics).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  console.log('\n' + '='.repeat(60));
  
  // Exit con codice appropriato
  process.exit(result.status === 'healthy' ? 0 : 1);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default BackupSystemHealthCheck;
