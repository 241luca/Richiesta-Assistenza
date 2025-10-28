import { Request, Response } from 'express';
import { SmartDocsEngine } from '../../core/SmartDocsEngine';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../../utils/logger';

export class QueryController {
  private engine: SmartDocsEngine;

  constructor() {
    this.engine = new SmartDocsEngine();
  }

  async ingest(req: Request, res: Response) {
    const { type, content, title, containerId, metadata } = req.body;

    if (!type || !content) {
      throw new AppError('Type and content are required', 400);
    }

    const result = await this.engine.ingest({
      type,
      content,
      title,
      containerId,
      metadata
    });

    logger.info('Document ingested', {
      documentId: result.documentId,
      type,
      chunksCount: result.chunksProcessed
    });

    res.status(201).json({
      success: true,
      data: result
    });
  }

  async query(req: Request, res: Response) {
    const { question, containerId, limit = 5, threshold = 0.7 } = req.body;

    if (!question) {
      throw new AppError('Question is required', 400);
    }

    const result = await this.engine.query({
      question,
      containerId,
      limit: Number(limit),
      threshold: Number(threshold)
    });

    logger.info('Query executed', {
      question: question.substring(0, 100),
      containerId,
      resultsCount: result.sources.length
    });

    res.json({
      success: true,
      data: result
    });
  }

  async classify(req: Request, res: Response) {
    const { content, types } = req.body;

    if (!content) {
      throw new AppError('Content is required', 400);
    }

    const result = await this.engine.classify({
      content,
      types
    });

    logger.info('Document classified', {
      type: result.type,
      confidence: result.confidence
    });

    res.json({
      success: true,
      data: result
    });
  }

  async extract(req: Request, res: Response) {
    const { content, schema } = req.body;

    if (!content) {
      throw new AppError('Content is required', 400);
    }

    const result = await this.engine.extract({
      content,
      schema
    });

    logger.info('Data extracted from document', {
      fieldsExtracted: Object.keys(result.data).length
    });

    res.json({
      success: true,
      data: result
    });
  }
}
