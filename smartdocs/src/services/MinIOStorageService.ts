import * as Minio from 'minio';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import path from 'path';

export class MinIOStorageService {
  private client: Minio.Client;
  private bucketName: string;
  private initialized: boolean = false;

  constructor() {
    this.bucketName = process.env.MINIO_BUCKET || 'smartdocs';
    
    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
    });

    // Non chiamare initializeBucket nel costruttore
    // Verrà chiamato lazy al primo upload
  }

  /**
   * Inizializza bucket se non esiste (lazy)
   */
  private async ensureBucketExists() {
    if (this.initialized) return;

    try {
      const exists = await this.client.bucketExists(this.bucketName);
      if (!exists) {
        await this.client.makeBucket(this.bucketName, 'us-east-1');
        logger.info(`MinIO bucket created: ${this.bucketName}`);
      } else {
        logger.info(`MinIO bucket exists: ${this.bucketName}`);
      }
      this.initialized = true;
    } catch (error) {
      logger.error('Error initializing MinIO bucket:', error);
      logger.warn('MinIO not available - file upload will not work until MinIO is started');
      throw new Error('MinIO service not available. Please start MinIO server.');
    }
  }

  /**
   * Upload file to MinIO
   */
  async uploadFile(
    file: Express.Multer.File,
    containerId: string,
    documentId: string
  ): Promise<{
    objectName: string;
    url: string;
    size: number;
    contentType: string;
  }> {
    await this.ensureBucketExists();
    
    try {
      const fileExtension = path.extname(file.originalname);
      const objectName = `containers/${containerId}/${documentId}${fileExtension}`;

      const metadata = {
        'Content-Type': file.mimetype,
        'Original-Name': Buffer.from(file.originalname).toString('base64'),
        'Upload-Date': new Date().toISOString()
      };

      await this.client.putObject(
        this.bucketName,
        objectName,
        file.buffer,
        file.size,
        metadata
      );

      logger.info(`File uploaded to MinIO: ${objectName}`);

      // Generate presigned URL (valida 7 giorni)
      const url = await this.client.presignedGetObject(
        this.bucketName,
        objectName,
        7 * 24 * 60 * 60
      );

      return {
        objectName,
        url,
        size: file.size,
        contentType: file.mimetype
      };
    } catch (error) {
      logger.error('Error uploading file to MinIO:', error);
      throw error;
    }
  }

  /**
   * Get file from MinIO
   */
  async getFile(objectName: string): Promise<Buffer> {
    try {
      const chunks: Buffer[] = [];
      const stream = await this.client.getObject(this.bucketName, objectName);

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    } catch (error) {
      logger.error('Error getting file from MinIO:', error);
      throw error;
    }
  }

  /**
   * Delete file from MinIO
   */
  async deleteFile(objectName: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucketName, objectName);
      logger.info(`File deleted from MinIO: ${objectName}`);
    } catch (error) {
      logger.error('Error deleting file from MinIO:', error);
      throw error;
    }
  }

  /**
   * Get presigned download URL
   */
  async getDownloadUrl(objectName: string, expirySeconds: number = 3600): Promise<string> {
    try {
      return await this.client.presignedGetObject(
        this.bucketName,
        objectName,
        expirySeconds
      );
    } catch (error) {
      logger.error('Error generating presigned URL:', error);
      throw error;
    }
  }

  /**
   * List files in container
   */
  async listFiles(containerId: string): Promise<string[]> {
    try {
      const prefix = `containers/${containerId}/`;
      const objectsList: string[] = [];
      
      const stream = this.client.listObjects(this.bucketName, prefix, true);
      
      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
          if (obj.name) objectsList.push(obj.name);
        });
        stream.on('end', () => resolve(objectsList));
        stream.on('error', reject);
      });
    } catch (error) {
      logger.error('Error listing files from MinIO:', error);
      throw error;
    }
  }

  /**
   * Get file stats
   */
  async getFileStats(objectName: string) {
    try {
      return await this.client.statObject(this.bucketName, objectName);
    } catch (error) {
      logger.error('Error getting file stats:', error);
      throw error;
    }
  }
}

// Singleton instance
export const minioStorage = new MinIOStorageService();
