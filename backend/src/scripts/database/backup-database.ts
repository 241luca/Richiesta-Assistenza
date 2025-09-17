/**
 * Script: Database Backup
 * Crea un backup completo del database PostgreSQL
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../../utils/logger';

const execAsync = promisify(exec);

interface BackupParams {
  compress?: boolean;
  excludeTables?: string[];
}

export async function execute(params: BackupParams = {}) {
  const { compress = true, excludeTables = [] } = params;
  
  try {
    logger.info('🔄 Starting database backup...');
    
    // Get database connection info from env
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not configured');
    }
    
    // Create backup directory if not exists
    const backupDir = path.join('/Users/lucamambelli/Desktop', 'backup-ra', 'database');
    await fs.mkdir(backupDir, { recursive: true });
    
    // Generate backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql${compress ? '.gz' : ''}`;
    const filepath = path.join(backupDir, filename);
    
    logger.info(`📁 Backup file: ${filename}`);
    
    // Build pg_dump command
    let command = `pg_dump "${databaseUrl}"`;
    
    // Add exclude tables if specified
    if (excludeTables.length > 0) {
      excludeTables.forEach(table => {
        command += ` --exclude-table="${table}"`;
      });
    }
    
    // Add compression if needed
    if (compress) {
      command += ' | gzip';
    }
    
    command += ` > "${filepath}"`;
    
    logger.info('⏳ Running backup command...');
    
    // Execute backup
    await execAsync(command);
    
    // Verify backup file exists
    const stats = await fs.stat(filepath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    logger.info(`✅ Backup completed successfully`);
    logger.info(`📊 File size: ${sizeMB} MB`);
    
    return {
      success: true,
      filename,
      filepath,
      size: sizeMB,
      compressed: compress,
      timestamp: new Date()
    };
    
  } catch (error) {
    logger.error('❌ Backup failed:', error);
    throw error;
  }
}

// Metadata for Script Manager
export const metadata = {
  id: 'backup-database',
  name: 'Database Backup',
  description: 'Crea un backup completo del database PostgreSQL',
  category: 'database',
  risk: 'low',
  parameters: [
    {
      name: 'compress',
      type: 'boolean',
      default: true,
      description: 'Comprimi il file di backup'
    },
    {
      name: 'excludeTables',
      type: 'array',
      required: false,
      description: 'Tabelle da escludere dal backup',
      default: []
    }
  ],
  requireConfirmation: false,
  minRole: 'ADMIN'
};
