/**
 * Script: Database Backup
 * Crea un backup completo del database PostgreSQL
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../../utils/logger';
import { format } from 'date-fns';

const execAsync = promisify(exec);

interface BackupParams {
  compress?: boolean;
  excludeTables?: string[];
}

export async function execute(params: BackupParams = {}) {
  const { compress = true, excludeTables = [] } = params;
  
  try {
    logger.info('🔄 Starting database backup...');
    
    // Create backup directory if not exists
    const backupDir = path.join(process.cwd(), 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    
    // Generate backup filename
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
    const filename = `backup-${timestamp}.sql${compress ? '.gz' : ''}`;
    const filepath = path.join(backupDir, filename);
    
    // Get database URL from environment
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not configured');
    }
    
    // Build pg_dump command
    let command = `pg_dump ${dbUrl}`;
    
    // Add exclude tables if any
    if (excludeTables.length > 0) {
      excludeTables.forEach(table => {
        command += ` --exclude-table=${table}`;
      });
    }
    
    // Add compression if enabled
    if (compress) {
      command += ` | gzip`;
    }
    
    command += ` > ${filepath}`;
    
    logger.info(`Executing: ${command.replace(dbUrl, 'DATABASE_URL')}`);
    
    // Execute backup
    await execAsync(command);
    
    // Get file size
    const stats = await fs.stat(filepath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    logger.info(`✅ Backup completed successfully`);
    logger.info(`📁 File: ${filename}`);
    logger.info(`📊 Size: ${sizeMB} MB`);
    
    return {
      success: true,
      filename,
      filepath,
      size: stats.size,
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