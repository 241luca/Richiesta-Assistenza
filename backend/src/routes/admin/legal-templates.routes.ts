import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { Role } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * GET /api/admin/legal-documents/templates
 * Ottieni tutti i template documenti legali dal database
 */
router.get('/',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      // Prima cerca template dal database
      let templates = await prisma.legalDocumentTemplate.findMany({
        orderBy: { type: 'asc' }
      });

      // Se non ci sono template nel DB, ritorna template di default
      if (!templates || templates.length === 0) {
        templates = getDefaultTemplates();
      }

      return res.json(ResponseFormatter.success(templates));
    } catch (error: any) {
      logger.error('Error fetching templates:', error);
      return res.status(500).json(
        ResponseFormatter.error('Failed to fetch templates', 'FETCH_ERROR')
      );
    }
  }
);

/**
 * GET /api/admin/legal-documents/templates/:type
 * Ottieni template specifico per tipo
 */
router.get('/:type',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const { type } = req.params;
      
      // Cerca nel database
      let template = await prisma.legalDocumentTemplate.findFirst({
        where: { type }
      });

      // Se non esiste nel DB, usa il default
      if (!template) {
        const defaults = getDefaultTemplates();
        template = defaults.find(t => t.type === type) || null;
      }

      if (!template) {
        return res.status(404).json(
          ResponseFormatter.error('Template not found', 'NOT_FOUND')
        );
      }

      return res.json(ResponseFormatter.success(template));
    } catch (error: any) {
      logger.error('Error fetching template:', error);
      return res.status(500).json(
        ResponseFormatter.error('Failed to fetch template', 'FETCH_ERROR')
      );
    }
  }
);

/**
 * POST /api/admin/legal-documents/templates
 * Crea un nuovo template
 */
router.post('/',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const { name, type, title, content, language } = req.body;

      const newTemplate = await prisma.legalDocumentTemplate.create({
        data: {
          id: uuidv4(),
          name,
          type,
          title,
          content,
          language: language || 'it',
          category: req.body.category || 'LEGAL',
          variables: req.body.variables || {},
          updatedAt: new Date()
        }
      });

      return res.status(201).json(
        ResponseFormatter.success(newTemplate, 'Template created successfully')
      );
    } catch (error: any) {
      logger.error('Error creating template:', error);
      return res.status(500).json(
        ResponseFormatter.error('Failed to create template', 'CREATE_ERROR')
      );
    }
  }
);

/**
 * PUT /api/admin/legal-documents/templates/:id
 * Aggiorna un template
 */
router.put('/:id',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const { id } = req.params;
      
      const updatedTemplate = await prisma.legalDocumentTemplate.update({
        where: { id },
        data: req.body
      });

      return res.json(
        ResponseFormatter.success(updatedTemplate, 'Template updated successfully')
      );
    } catch (error: any) {
      logger.error('Error updating template:', error);
      return res.status(500).json(
        ResponseFormatter.error('Failed to update template', 'UPDATE_ERROR')
      );
    }
  }
);

/**
 * DELETE /api/admin/legal-documents/templates/:id
 * Elimina un template
 */
router.delete('/:id',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const { id } = req.params;
      
      // Non eliminare template di default
      const template = await prisma.legalDocumentTemplate.findUnique({
        where: { id }
      });

      if (template?.isDefault) {
        return res.status(400).json(
          ResponseFormatter.error('Cannot delete default template', 'DELETE_RESTRICTED')
        );
      }

      await prisma.legalDocumentTemplate.delete({
        where: { id }
      });

      return res.json(
        ResponseFormatter.success(null, 'Template deleted successfully')
      );
    } catch (error: any) {
      logger.error('Error deleting template:', error);
      return res.status(500).json(
        ResponseFormatter.error('Failed to delete template', 'DELETE_ERROR')
      );
    }
  }
);

/**
 * Funzione helper per template di default
 */
function getDefaultTemplates() {
  const currentDate = new Date().toLocaleDateString('it-IT');
  const now = new Date();
  
  return [
    {
      id: 'default-privacy',
      type: 'PRIVACY_POLICY',
      name: 'Privacy Policy GDPR',
      title: 'Informativa sulla Privacy',
      language: 'it',
      category: 'LEGAL',
      createdAt: now,
      updatedAt: now,
      content: `<h1>Informativa sulla Privacy</h1>
<p><em>Ai sensi del Regolamento UE 2016/679 (GDPR)</em></p>
<p>Ultimo aggiornamento: ${currentDate}</p>

<h2>1. Titolare del Trattamento</h2>
<p>Il Titolare del trattamento dei dati personali è <strong>[Nome Azienda]</strong>, con sede legale in [Indirizzo].</p>

<h2>2. Tipologie di Dati Raccolti</h2>
<p>Raccogliamo le seguenti categorie di dati personali:</p>
<ul>
  <li>Dati anagrafici (nome, cognome, data di nascita)</li>
  <li>Dati di contatto (indirizzo email, numero di telefono)</li>
  <li>Dati di navigazione (indirizzo IP, browser utilizzato)</li>
  <li>Dati di utilizzo del servizio</li>
</ul>

<h2>3. Finalità del Trattamento</h2>
<p>I dati personali sono trattati per le seguenti finalità:</p>
<ul>
  <li>Erogazione del servizio richiesto</li>
  <li>Adempimento degli obblighi contrattuali</li>
  <li>Adempimento degli obblighi di legge</li>
  <li>Marketing diretto (previo consenso)</li>
</ul>

<h2>4. Base Giuridica del Trattamento</h2>
<p>Il trattamento dei dati si fonda sulle seguenti basi giuridiche:</p>
<ul>
  <li>Esecuzione di un contratto (art. 6.1.b GDPR)</li>
  <li>Obbligo legale (art. 6.1.c GDPR)</li>
  <li>Consenso dell'interessato (art. 6.1.a GDPR)</li>
</ul>`,
      variables: {
        company_name: '[Nome Azienda]',
        company_address: '[Indirizzo]',
        update_date: currentDate
      },
      isDefault: true
    },
    {
      id: 'default-terms',
      type: 'TERMS_SERVICE',
      name: 'Termini e Condizioni',
      title: 'Termini e Condizioni di Servizio',
      language: 'it',
      category: 'LEGAL',
      createdAt: now,
      updatedAt: now,
      content: `<h1>Termini e Condizioni di Servizio</h1>
<p>Ultimo aggiornamento: ${currentDate}</p>

<h2>1. Accettazione dei Termini</h2>
<p>Utilizzando i nostri servizi, accetti di essere vincolato dai presenti termini e condizioni.</p>

<h2>2. Descrizione del Servizio</h2>
<p>Il nostro servizio fornisce una piattaforma per la gestione delle richieste di assistenza tecnica.</p>

<h2>3. Obblighi dell'Utente</h2>
<p>L'utente si impegna a:</p>
<ul>
  <li>Fornire informazioni accurate e veritiere</li>
  <li>Non utilizzare il servizio per scopi illegali</li>
  <li>Rispettare i diritti di proprietà intellettuale</li>
</ul>`,
      variables: {
        company_name: '[Nome Azienda]',
        update_date: currentDate
      },
      isDefault: true
    },
    {
      id: 'default-cookie',
      type: 'COOKIE_POLICY',
      name: 'Cookie Policy',
      title: 'Informativa sui Cookie',
      language: 'it',
      category: 'LEGAL',
      createdAt: now,
      updatedAt: now,
      content: `<h1>Informativa sui Cookie</h1>
<p>Ultimo aggiornamento: ${currentDate}</p>

<h2>1. Cosa sono i Cookie</h2>
<p>I cookie sono piccoli file di testo che vengono memorizzati sul tuo dispositivo quando visiti il nostro sito.</p>

<h2>2. Tipologie di Cookie Utilizzati</h2>
<ul>
  <li><strong>Cookie Tecnici:</strong> Necessari per il funzionamento del sito</li>
  <li><strong>Cookie Analitici:</strong> Per analizzare l'utilizzo del sito</li>
  <li><strong>Cookie di Terze Parti:</strong> Gestiti da servizi esterni</li>
</ul>

<h2>3. Gestione dei Cookie</h2>
<p>Puoi gestire le preferenze sui cookie attraverso le impostazioni del tuo browser.</p>`,
      variables: {
        update_date: currentDate
      },
      isDefault: true
    }
  ];
}

export default router;
