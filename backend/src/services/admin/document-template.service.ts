import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

interface CreateTemplateData {
  name: string;
  description?: string;
  type: string;
  content: string;
  createdById: string;
  metadata?: {
    tags?: string[];
    category?: string;
    isPublic?: boolean;
  };
}

interface UpdateTemplateData {
  name?: string;
  description?: string;
  content?: string;
  metadata?: {
    tags?: string[];
    category?: string;
    isPublic?: boolean;
  };
}

interface CreateFromDocumentData {
  documentId: string;
  versionId?: string;
  name: string;
  description?: string;
  createdById: string;
}

// Ottieni tutti i template (pubblici + propri dell'utente)
export async function getAllTemplates(userId: string) {
  try {
    const templates = await prisma.documentTemplate.findMany({
      where: {
        OR: [
          { createdById: userId },
          { metadata: { path: ['isPublic'], equals: true } }
        ],
        deletedAt: null
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return templates;
  } catch (error) {
    logger.error('Error getting templates:', error);
    throw error;
  }
}

// Ottieni un template specifico
export async function getTemplateById(id: string, userId: string) {
  try {
    const template = await prisma.documentTemplate.findFirst({
      where: {
        id,
        OR: [
          { createdById: userId },
          { metadata: { path: ['isPublic'], equals: true } }
        ],
        deletedAt: null
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });
    return template;
  } catch (error) {
    logger.error('Error getting template:', error);
    throw error;
  }
}

// Crea un nuovo template
export async function createTemplate(data: CreateTemplateData) {
  try {
    const template = await prisma.documentTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        content: data.content,
        createdById: data.createdById,
        metadata: data.metadata || {}
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });
    
    logger.info('Template created:', { id: template.id, name: template.name });
    return template;
  } catch (error) {
    logger.error('Error creating template:', error);
    throw error;
  }
}

// Crea template da documento esistente
export async function createTemplateFromDocument(data: CreateFromDocumentData) {
  try {
    // Trova il documento e la versione
    const document = await prisma.legalDocument.findUnique({
      where: { id: data.documentId },
      include: {
        versions: {
          where: data.versionId ? { id: data.versionId } : {},
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    const version = document.versions[0];
    if (!version) {
      throw new Error('No version found for this document');
    }

    // Crea il template dal contenuto della versione
    const template = await prisma.documentTemplate.create({
      data: {
        name: data.name,
        description: data.description || `Template creato da: ${document.displayName}`,
        type: document.type,
        content: version.content,
        createdById: data.createdById,
        metadata: {
          sourceDocumentId: document.id,
          sourceVersionId: version.id,
          sourceDocumentName: document.displayName
        }
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });
    
    logger.info('Template created from document:', { 
      templateId: template.id, 
      documentId: data.documentId,
      versionId: version.id 
    });
    
    return template;
  } catch (error) {
    logger.error('Error creating template from document:', error);
    throw error;
  }
}

// Aggiorna un template
export async function updateTemplate(id: string, userId: string, data: UpdateTemplateData) {
  try {
    // Verifica che l'utente sia il proprietario
    const existing = await prisma.documentTemplate.findFirst({
      where: {
        id,
        createdById: userId,
        deletedAt: null
      }
    });

    if (!existing) {
      return null;
    }

    const updated = await prisma.documentTemplate.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        content: data.content,
        metadata: data.metadata ? {
          ...existing.metadata as any,
          ...data.metadata
        } : existing.metadata
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    logger.info('Template updated:', { id: updated.id });
    return updated;
  } catch (error) {
    logger.error('Error updating template:', error);
    throw error;
  }
}

// Elimina un template (soft delete)
export async function deleteTemplate(id: string, userId: string) {
  try {
    // Verifica che l'utente sia il proprietario
    const existing = await prisma.documentTemplate.findFirst({
      where: {
        id,
        createdById: userId,
        deletedAt: null
      }
    });

    if (!existing) {
      return false;
    }

    await prisma.documentTemplate.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    });

    logger.info('Template deleted:', { id });
    return true;
  } catch (error) {
    logger.error('Error deleting template:', error);
    throw error;
  }
}
