/**
 * Script: Clear Cache
 * Pulisce la cache Redis del sistema
 */

import { createClient } from 'redis';
import { logger } from '../../utils/logger';

interface ClearCacheParams {
  pattern?: string;
}

export async function execute(params: ClearCacheParams = {}) {
  const { pattern = '*' } = params;
  
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  
  try {
    logger.info('🔄 Connecting to Redis...');
    await client.connect();
    
    logger.info(`🔍 Searching for keys matching pattern: ${pattern}`);
    
    // Get all keys matching pattern
    const keys = await client.keys(pattern);
    
    if (keys.length === 0) {
      logger.info('ℹ️ No keys found matching the pattern');
      return {
        success: true,
        keysDeleted: 0,
        message: 'No keys to delete'
      };
    }
    
    logger.info(`📋 Found ${keys.length} keys to delete`);
    
    // Delete keys in batches
    const batchSize = 100;
    let deleted = 0;
    
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      await client.del(batch);
      deleted += batch.length;
      logger.info(`Deleted ${deleted}/${keys.length} keys...`);
    }
    
    logger.info('✅ Cache cleared successfully');
    
    return {
      success: true,
      keysDeleted: deleted,
      message: `Successfully deleted ${deleted} keys`
    };
    
  } catch (error) {
    logger.error('❌ Failed to clear cache:', error);
    throw error;
  } finally {
    await client.disconnect();
  }
}

// Metadata for Script Manager
export const metadata = {
  id: 'clear-cache',
  name: 'Clear Cache',
  description: 'Pulisce la cache Redis del sistema',
  category: 'maintenance',
  risk: 'low',
  parameters: [
    {
      name: 'pattern',
      type: 'string',
      required: false,
      description: 'Pattern delle chiavi da eliminare (es: user:*)',
      default: '*'
    }
  ],
  requireConfirmation: false,
  minRole: 'ADMIN'
};