import { Request, Response } from 'express';
import { DocumentService } from '../../services/DocumentService';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../../utils/logger';

export class DocumentController {
  private service: DocumentService;

  constructor() {
    this.service = new DocumentService();
  }

  async list(req: Request, res: Response) {
    const { containerId, type, limit = 50, offset = 0 } = req.query;

    const documents = await this.service.listDocuments({
      containerId: containerId as string,
      type: type as string,
      limit: Number(limit),
      offset: Number(offset)
    });

    res.json({
      success: true,
      data: documents,
      meta: {
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  }

  async upload(req: Request, res: Response) {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const { containerId, type, metadata } = req.body;

    const document = await this.service.uploadDocument({
      file: req.file,
      containerId,
      type,
      metadata: metadata ? JSON.parse(metadata) : {}
    });

    logger.info('Document uploaded', {
      documentId: document.id,
      filename: req.file.originalname,
      size: req.file.size
    });

    res.status(201).json({
      success: true,
      data: document
    });
  }

  async getById(req: Request, res: Response) {
    const { id } = req.params;

    const document = await this.service.getDocumentById(id);

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    res.json({
      success: true,
      data: document
    });
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;

    await this.service.deleteDocument(id);

    logger.info('Document deleted', { documentId: id });

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  }

  async download(req: Request, res: Response) {
    const { id } = req.params;

    const { stream, filename, mimetype } = await this.service.downloadDocument(id);

    res.setHeader('Content-Type', mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    stream.pipe(res);
  }

  // ✅ NEW: Get document chunks with metadata
  async getChunks(req: Request, res: Response) {
    const { id } = req.params;

    const chunks = await this.service.getDocumentChunks(id);

    res.json({
      success: true,
      data: chunks
    });
  }

  // ✅ NEW: Get complete document analysis
  async getAnalysis(req: Request, res: Response) {
    const { id } = req.params;

    const analysis = await this.service.getDocumentAnalysis(id);

    res.json({
      success: true,
      data: analysis
    });
  }
}
