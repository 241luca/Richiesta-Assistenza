import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export class StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: any): Promise<string> {
    const filename = `${uuidv4()}${path.extname(file.originalname)}`;
    const filepath = path.join(this.uploadDir, filename);

    fs.copyFileSync(file.path, filepath);

    logger.info('File uploaded to storage', { filename, originalname: file.originalname });

    return `file://${filepath}`;
  }

  async downloadFile(storageUrl: string): Promise<fs.ReadStream> {
    const filepath = storageUrl.replace('file://', '');

    if (!fs.existsSync(filepath)) {
      throw new Error('File not found in storage');
    }

    return fs.createReadStream(filepath);
  }

  async deleteFile(storageUrl: string): Promise<void> {
    const filepath = storageUrl.replace('file://', '');

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      logger.info('File deleted from storage', { filepath });
    }
  }

  async getFileMetadata(storageUrl: string) {
    const filepath = storageUrl.replace('file://', '');
    
    if (!fs.existsSync(filepath)) {
      throw new Error('File not found');
    }

    const stats = fs.statSync(filepath);
    
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      path: filepath
    };
  }
}
