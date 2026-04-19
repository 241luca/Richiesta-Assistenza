import { Pool, QueryResult } from 'pg';
import { logger } from '../utils/logger';

export class DatabaseClient {
  private static instance: DatabaseClient;
  private pool: Pool;

  private constructor() {
    logger.info(`[DatabaseClient] Connecting to: ${process.env.DATABASE_URL}`);
    
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // 10s for complex queries
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected database error', err);
    });

    this.pool.on('connect', () => {
      logger.info('Database connection established');
    });
  }

  public static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient();
    }
    return DatabaseClient.instance;
  }

  async query(text: string, params?: any[]): Promise<QueryResult> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Query executed', {
        query: text.substring(0, 100),
        duration: `${duration}ms`,
        rows: result.rowCount
      });

      return result;
    } catch (error) {
      logger.error('Database query error', {
        query: text,
        params,
        error
      });
      throw error;
    }
  }

  async getClient() {
    return await this.pool.connect();
  }

  async close(): Promise<void> {
    await this.pool.end();
    logger.info('Database pool closed');
  }
}
