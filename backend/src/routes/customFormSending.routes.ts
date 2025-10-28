/**
 * Custom Form Sending Routes
 * API endpoints per l'invio e la compilazione di custom forms
 * 
 * @module routes/customFormSending
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { customFormSendingService } from '../services/customFormSending.service';
import { validate } from '../middleware/validate';
import { body, param } from 'express-validator';

const router = Router();

/**
 * POST /api/custom-forms/:formId/send
 * Invia un custom form a una richiesta specifica
 * Solo il professionista assegnato può inviare form
 */
router.post('/:formId/send', [
  param('formId').isLength({ min: 25, max: 25 }).withMessage('Form ID deve essere un CUID valido'),
  body('requestId').isUUID().withMessage('requestId deve essere un UUID valido'),
  validate
], async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { formId } = req.params;
    const { requestId } = req.body;

    const result = await customFormSendingService.sendFormToRequest(
      {
        requestId,
        customFormId: formId,
        senderId: userId
      },
      req
    );

    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error('Errore nella route POST /custom-forms/:formId/send:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

/**
 * GET /api/requests/:requestId/forms
 * Ottiene tutti i form inviati a una richiesta specifica
 */
router.get('/requests/:requestId/forms', [
  param('requestId').isUUID().withMessage('requestId deve essere un UUID valido'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const result = await customFormSendingService.getRequestForms(requestId);
    
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Errore nella route GET /requests/:requestId/forms:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

/**
 * GET /api/request-forms/:id
 * Ottiene un form specifico con le risposte
 */
router.get('/request-forms/:id', [
  param('id').isLength({ min: 25, max: 25 }).withMessage('ID deve essere un CUID valido'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await customFormSendingService.getFormWithResponses(id);
    
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('Errore nella route GET /request-forms/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

/**
 * POST /api/request-forms/:id/save-draft
 * Salva le risposte parziali come bozza
 */
router.post('/request-forms/:id/save-draft', [
  param('id').isLength({ min: 25, max: 25 }).withMessage('ID deve essere un CUID valido'),
  body('responses').isArray().withMessage('Responses deve essere un array'),
  body('responses.*.fieldId').notEmpty().withMessage('fieldId è obbligatorio'),
  body('responses.*.fieldName').notEmpty().withMessage('fieldName è obbligatorio'),
  body('responses.*.fieldType').notEmpty().withMessage('fieldType è obbligatorio'),
  validate
], async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { responses } = req.body;

    const result = await customFormSendingService.saveFormResponses(
      {
        requestCustomFormId: id,
        responses,
        submittedBy: userId
      },
      req
    );

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Errore nella route POST /request-forms/:id/save-draft:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

/**
 * POST /api/request-forms/:id/submit
 * Completa la compilazione del form
 */
router.post('/request-forms/:id/submit', [
  param('id').isLength({ min: 25, max: 25 }).withMessage('ID deve essere un CUID valido'),
  body('responses').isArray().withMessage('Responses deve essere un array'),
  body('responses.*.fieldId').notEmpty().withMessage('fieldId è obbligatorio'),
  body('responses.*.fieldName').notEmpty().withMessage('fieldName è obbligatorio'),
  body('responses.*.fieldType').notEmpty().withMessage('fieldType è obbligatorio'),
  validate
], async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { responses } = req.body;

    const result = await customFormSendingService.submitFormResponse(
      {
        requestCustomFormId: id,
        responses,
        submittedBy: userId
      },
      req
    );

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Errore nella route POST /request-forms/:id/submit:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

/**
 * DELETE /api/request-forms/:id
 * Rimuove un form inviato a una richiesta
 * Solo il professionista che l'ha inviato può rimuoverlo
 * Non è possibile rimuovere form già compilati
 */
router.delete('/request-forms/:id', [
  param('id').isLength({ min: 25, max: 25 }).withMessage('ID deve essere un CUID valido'),
  validate
], async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const result = await customFormSendingService.removeFormFromRequest(id, userId, req);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Errore nella route DELETE /request-forms/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

/**
 * PATCH /api/request-forms/:id/verify
 * Marca un form come verificato dal professionista
 * Solo il professionista della richiesta può verificare
 */
router.patch('/request-forms/:id/verify', [
  param('id').isLength({ min: 25, max: 25 }).withMessage('ID deve essere un CUID valido'),
  body('isVerified').isBoolean().withMessage('isVerified deve essere un boolean'),
  validate
], async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { isVerified } = req.body;

    const result = await customFormSendingService.verifyForm(id, userId, isVerified, req);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Errore nella route PATCH /request-forms/:id/verify:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

export default router;
