/**
 * Test endpoint per verificare il Request ID tracking
 * Da rimuovere in produzione
 */

import { Router } from 'express';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';
import { logInfo, logError, getRequestId } from '../middleware/requestId';

const router = Router();

// Test base - verifica che il requestId sia presente
router.get('/request-id', (req, res) => {
  const requestId = getRequestId(req);
  
  // Log con il nuovo sistema
  logInfo(req, 'Test request ID endpoint accessed', {
    testData: 'This is a test'
  });
  
  return res.json(
    ResponseFormatter.success(
      { 
        requestId,
        message: 'Request ID tracking is working!' 
      },
      'Request ID retrieved successfully'
    )
  );
});

// Test errore - verifica che il requestId sia incluso negli errori
router.get('/request-id/error', (req, res) => {
  const requestId = getRequestId(req);
  
  // Log dell'errore con il nuovo sistema
  logError(req, 'Test error with request ID', {
    errorType: 'test_error',
    intentional: true
  });
  
  // Simula un errore
  return res.status(400).json(
    ResponseFormatter.error(
      'This is a test error with request ID',
      'TEST_ERROR',
      { requestId }
    )
  );
});

// Test correlazione - verifica che più log abbiano lo stesso requestId
router.get('/request-id/correlation', async (req, res) => {
  const requestId = getRequestId(req);
  
  // Multipli log per testare la correlazione
  logInfo(req, 'Starting correlation test', { step: 1 });
  
  // Simula operazione asincrona
  await new Promise(resolve => setTimeout(resolve, 100));
  logInfo(req, 'Async operation completed', { step: 2 });
  
  // Altro log
  logInfo(req, 'Preparing response', { step: 3 });
  
  return res.json(
    ResponseFormatter.success(
      {
        requestId,
        message: 'Check logs - all should have the same requestId',
        steps: ['Start', 'Async operation', 'Response']
      },
      'Correlation test completed'
    )
  );
});

// Test headers - verifica che il requestId sia negli headers
router.get('/request-id/headers', (req, res) => {
  const requestId = getRequestId(req);
  const headerRequestId = req.headers['x-request-id'];
  
  return res.json(
    ResponseFormatter.success(
      {
        requestId,
        headerRequestId,
        match: requestId === headerRequestId,
        responseHeader: 'Check X-Request-ID in response headers'
      },
      'Headers test completed'
    )
  );
});

export default router;
