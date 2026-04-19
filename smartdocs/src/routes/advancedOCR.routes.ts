/**
 * advancedOCR.routes.ts
 * 
 * API routes per Advanced OCR (Docling + PaddleOCR-VL)
 * 
 * Endpoints:
 * - POST /api/ocr/process - Processa documento con OCR avanzato
 * - GET /api/ocr/engines - Verifica disponibilità motori OCR
 * - GET /api/ocr/health - Health check
 * 
 * @author SmartDocs AI
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { AdvancedOCRService, AdvancedOCROptions } from '../services/AdvancedOCRService';
import { logger } from '../utils/logger';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const ocrService = new AdvancedOCRService();

/**
 * POST /api/ocr/process
 * Processa un documento con OCR avanzato
 */
router.post('/process', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { buffer, mimetype, originalname } = req.file;
    
    // Parse options
    const options: AdvancedOCROptions = {
      engine: req.body.engine || 'auto',
      enableOCR: req.body.enableOCR !== 'false',
      enableTableExtraction: req.body.enableTableExtraction !== 'false',
      enableFormulaRecognition: req.body.enableFormulaRecognition === 'true',
      enableChartRecognition: req.body.enableChartRecognition === 'true',
      ocrLanguages: req.body.ocrLanguages ? req.body.ocrLanguages.split(',') : ['it', 'en'],
      outputFormat: req.body.outputFormat || 'markdown',
      imageResolution: parseFloat(req.body.imageResolution || '2.0'),
      preserveImages: req.body.preserveImages === 'true',
      fullPageOCR: req.body.fullPageOCR === 'true'
    };

    logger.info(`[AdvancedOCR API] Processing file: ${originalname}, engine: ${options.engine}`);

    const result = await ocrService.processDocument(
      buffer,
      mimetype,
      originalname,
      options
    );

    res.json({
      success: true,
      data: {
        fileName: originalname,
        engine: result.metadata.engine,
        text: result.text,
        markdown: result.markdown,
        html: result.html,
        metadata: result.metadata,
        tables: result.metadata.tables,
        formulas: result.metadata.formulas,
        charts: result.metadata.charts,
        warnings: result.warnings
      }
    });

  } catch (error: any) {
    logger.error('[AdvancedOCR API] Processing error:', error);
    
    res.status(500).json({
      success: false,
      error: 'OCR processing failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/ocr/engines
 * Verifica disponibilità motori OCR
 */
router.get('/engines', async (req: Request, res: Response) => {
  try {
    const engines = await ocrService.checkEngineAvailability();

    res.json({
      success: true,
      data: {
        engines: {
          docling: {
            available: engines.docling,
            description: 'Docling - Multi-format document processing (DOCX, HTML, PDF)',
            strengths: ['DOCX conversion', 'Table extraction', 'Multi-format support']
          },
          paddleocr: {
            available: engines.paddleocr,
            description: 'PaddleOCR-VL - Vision-Language Model (109 languages, formulas, charts)',
            strengths: ['Multilingual OCR', 'Formula recognition', 'Chart detection']
          }
        },
        recommendation: engines.docling && engines.paddleocr
          ? 'Both engines available - auto-selection will optimize per document type'
          : engines.docling
          ? 'Docling only - good for most documents, but formulas not supported'
          : engines.paddleocr
          ? 'PaddleOCR-VL only - excellent for PDFs and scientific documents'
          : 'No advanced OCR engines available - install with scripts/install_ocr_dependencies.sh'
      }
    });

  } catch (error: any) {
    logger.error('[AdvancedOCR API] Engine check error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to check OCR engines',
      message: error.message
    });
  }
});

/**
 * GET /api/ocr/health
 * Health check
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const engines = await ocrService.checkEngineAvailability();
    const anyAvailable = engines.docling || engines.paddleocr;

    res.json({
      success: true,
      status: anyAvailable ? 'healthy' : 'degraded',
      message: anyAvailable 
        ? 'Advanced OCR service operational'
        : 'Advanced OCR engines not available',
      engines
    });

  } catch (error: any) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

export default router;
