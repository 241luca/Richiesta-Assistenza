import { DatabaseClient } from '../database/client';
import { logger } from '../utils/logger';
import { minioStorage } from './MinIOStorageService';
import { OpenAIService } from './OpenAIService';
import pdfParse from 'pdf-parse';

export class DocumentProcessingService {
  private db: DatabaseClient;
  private openai: OpenAIService;

  constructor() {
    this.db = DatabaseClient.getInstance();
    this.openai = new OpenAIService();
  }

  /**
   * Processa un documento: estrae testo, genera chunks ed embeddings
   */
  async processDocument(documentId: string): Promise<void> {
    try {
      logger.info(`[DocumentProcessing] Starting processing for document ${documentId}`);

      // 1. Recupera info documento dal database
      const docQuery = await this.db.query(
        `SELECT id, title, storage_url, mime_type, metadata, container_id 
         FROM smartdocs.documents 
         WHERE id = $1`,
        [documentId]
      );

      if (docQuery.rows.length === 0) {
        throw new Error('Document not found');
      }

      const document = docQuery.rows[0];
      const metadata = typeof document.metadata === 'string' 
        ? JSON.parse(document.metadata) 
        : document.metadata;

      const storagePath = metadata.storage_path;

      // 2. Marca come PROCESSING
      await this.updateStatus(documentId, 'PROCESSING');

      // 3. Scarica file da MinIO
      logger.info(`[DocumentProcessing] Downloading file from MinIO: ${storagePath}`);
      const fileBuffer = await minioStorage.getFile(storagePath);

      // 4. Estrai testo basandosi sul tipo di file
      let extractedText: string;
      
      if (document.mime_type === 'application/pdf') {
        extractedText = await this.extractTextFromPDF(fileBuffer);
      } else if (document.mime_type === 'text/plain') {
        extractedText = fileBuffer.toString('utf-8');
      } else {
        throw new Error(`Unsupported file type: ${document.mime_type}`);
      }

      logger.info(`[DocumentProcessing] Extracted ${extractedText.length} characters from document`);

      // 5. Salva il contenuto estratto nel documento
      await this.db.query(
        'UPDATE smartdocs.documents SET content = $1 WHERE id = $2',
        [extractedText, documentId]
      );

      // 6. Ottieni configurazione chunking dal container
      const containerQuery = await this.db.query(
        'SELECT chunk_size, chunk_overlap FROM smartdocs.container_instances WHERE id = $1',
        [document.container_id]
      );

      const chunkSize = containerQuery.rows[0]?.chunk_size || 1000;
      const chunkOverlap = containerQuery.rows[0]?.chunk_overlap || 200;

      // 7. Divide in chunks
      const chunks = this.createChunks(extractedText, chunkSize, chunkOverlap);
      logger.info(`[DocumentProcessing] Created ${chunks.length} chunks`);

      // 8. Genera embeddings per ogni chunk
      await this.generateAndSaveEmbeddings(documentId, chunks);

      // 9. Marca come COMPLETED
      await this.updateStatus(documentId, 'COMPLETED');

      logger.info(`[DocumentProcessing] Document ${documentId} processed successfully`);

    } catch (error: any) {
      logger.error(`[DocumentProcessing] Error processing document ${documentId}:`, error);
      
      // Marca come ERROR
      await this.updateStatus(documentId, 'ERROR', error.message);
      
      throw error;
    }
  }

  /**
   * Estrae testo da PDF
   */
  private async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      logger.error('[DocumentProcessing] PDF parsing error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Divide il testo in chunks con overlap
   */
  private createChunks(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end).trim();
      
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      // Move forward by (chunkSize - overlap)
      start += chunkSize - overlap;
      
      // Stop if we're past the end
      if (start >= text.length) break;
    }

    return chunks;
  }

  /**
   * Genera embeddings e salva nel database
   */
  private async generateAndSaveEmbeddings(documentId: string, chunks: string[]): Promise<void> {
    logger.info(`[DocumentProcessing] Generating embeddings for ${chunks.length} chunks`);

    // Elimina eventuali embeddings esistenti
    await this.db.query('DELETE FROM smartdocs.embeddings WHERE document_id = $1', [documentId]);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        // Genera embedding con OpenAI
        const embedding = await this.openai.createEmbedding(chunk);

        // Salva nel database
        await this.db.query(
          `INSERT INTO smartdocs.embeddings (document_id, chunk_index, chunk_text, embedding)
           VALUES ($1, $2, $3, $4)`,
          [documentId, i, chunk, JSON.stringify(embedding)]
        );

        logger.info(`[DocumentProcessing] Generated embedding for chunk ${i + 1}/${chunks.length}`);

      } catch (error) {
        logger.error(`[DocumentProcessing] Error generating embedding for chunk ${i}:`, error);
        throw error;
      }
    }

    logger.info(`[DocumentProcessing] All embeddings saved successfully`);
  }

  /**
   * Aggiorna lo stato del documento
   */
  private async updateStatus(documentId: string, status: string, errorMessage?: string): Promise<void> {
    const updateQuery = errorMessage
      ? 'UPDATE smartdocs.documents SET processing_status = $1, error_message = $2, updated_at = NOW() WHERE id = $3'
      : 'UPDATE smartdocs.documents SET processing_status = $1, updated_at = NOW() WHERE id = $2';

    const params = errorMessage 
      ? [status, errorMessage, documentId]
      : [status, documentId];

    await this.db.query(updateQuery, params);
  }
}
