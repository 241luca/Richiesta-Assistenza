/**
 * Knowledge Base Routes
 * Gestisce articoli e contenuti della knowledge base
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/checkRole';
import { validateRequest } from '../middleware/validation';
import { auditLogger } from '../middleware/auditLogger';
import { z } from 'zod';
import { prisma } from '../config/database';
import { ResponseFormatter } from '../utils/responseFormatter';
import logger from '../utils/logger';
import * as aiService from '../services/ai.service';

const router = Router();

// Schema di validazione
const articleSchema = z.object({
  title: z.string().min(3, 'Titolo troppo corto'),
  content: z.string().min(10, 'Contenuto troppo corto'),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  published: z.boolean().optional()
});

const feedbackSchema = z.object({
  articleId: z.string(),
  helpful: z.boolean(),
  comment: z.string().optional()
});

/**
 * GET /api/kb/articles
 * Ottieni tutti gli articoli pubblicati
 */
router.get('/articles', async (req, res) => {
  try {
    const { 
      category, 
      search, 
      tags,
      page = 1, 
      limit = 20,
      sort = 'views'
    } = req.query;
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    // Costruisci filtri
    const where: any = {
      published: true
    };
    
    if (category) {
      where.category = category as string;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      where.tags = { hasEvery: tagArray as string[] };
    }
    
    // Query articoli
    const [articles, total] = await Promise.all([
      prisma.knowledgeBaseArticle.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: sort === 'views' ? { views: 'desc' } : 
                 sort === 'helpful' ? { helpful: 'desc' } :
                 { createdAt: 'desc' },
        include: {
          authorUser: {
            select: {
              id: true,
              fullName: true,
              avatar: true
            }
          }
        }
      }),
      prisma.knowledgeBaseArticle.count({ where })
    ]);
    
    // Incrementa visualizzazioni
    if (articles.length > 0) {
      await prisma.knowledgeBaseArticle.updateMany({
        where: { id: { in: articles.map(a => a.id) } },
        data: { views: { increment: 1 } }
      });
    }
    
    return res.json(ResponseFormatter.success(
      {
        articles,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      },
      'Articoli recuperati'
    ));
  } catch (error) {
    logger.error('Errore recupero articoli KB:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore recupero articoli',
      'KB_FETCH_ERROR'
    ));
  }
});

/**
 * GET /api/kb/articles/:id
 * Ottieni un articolo specifico
 */
router.get('/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const article = await prisma.knowledgeBaseArticle.findUnique({
      where: { id },
      include: {
        authorUser: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            role: true
          }
        },
        feedback: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
    
    if (!article) {
      return res.status(404).json(ResponseFormatter.error(
        'Articolo non trovato',
        'ARTICLE_NOT_FOUND'
      ));
    }
    
    // Incrementa visualizzazioni
    await prisma.knowledgeBaseArticle.update({
      where: { id },
      data: { views: { increment: 1 } }
    });
    
    return res.json(ResponseFormatter.success(
      article,
      'Articolo recuperato'
    ));
  } catch (error) {
    logger.error('Errore recupero articolo KB:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore recupero articolo',
      'KB_FETCH_ERROR'
    ));
  }
});

/**
 * POST /api/kb/articles
 * Crea un nuovo articolo (solo admin/professional)
 */
router.post('/articles',
  authenticate,
  checkRole(['ADMIN', 'SUPER_ADMIN', 'PROFESSIONAL']),
  validateRequest(articleSchema),
  auditLogger('KB_CREATE_ARTICLE'),
  async (req, res) => {
    try {
      const { title, content, category, tags, imageUrl, videoUrl, published } = req.body;
      
      // Genera embedding con AI per ricerca semantica
      let embedding = null;
      try {
        const embeddingText = `${title} ${content}`.substring(0, 1000);
        embedding = await aiService.generateEmbedding(embeddingText);
      } catch (error) {
        logger.error('Errore generazione embedding:', error);
      }
      
      const article = await prisma.knowledgeBaseArticle.create({
        data: {
          title,
          content,
          category,
          tags: tags || [],
          imageUrl,
          videoUrl,
          author: req.user.id,
          published: published || false,
          embedding,
          metadata: {
            createdBy: req.user.fullName,
            createdFrom: 'web'
          }
        },
        include: {
          authorUser: {
            select: {
              id: true,
              fullName: true,
              avatar: true
            }
          }
        }
      });
      
      return res.status(201).json(ResponseFormatter.success(
        article,
        'Articolo creato con successo'
      ));
    } catch (error) {
      logger.error('Errore creazione articolo KB:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Errore creazione articolo',
        'KB_CREATE_ERROR'
      ));
    }
  }
);

/**
 * PUT /api/kb/articles/:id
 * Aggiorna un articolo
 */
router.put('/articles/:id',
  authenticate,
  checkRole(['ADMIN', 'SUPER_ADMIN']),
  validateRequest(articleSchema),
  auditLogger('KB_UPDATE_ARTICLE'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, category, tags, imageUrl, videoUrl, published } = req.body;
      
      // Verifica che l'articolo esista
      const existing = await prisma.knowledgeBaseArticle.findUnique({
        where: { id }
      });
      
      if (!existing) {
        return res.status(404).json(ResponseFormatter.error(
          'Articolo non trovato',
          'ARTICLE_NOT_FOUND'
        ));
      }
      
      // Rigenera embedding se contenuto cambiato
      let embedding = existing.embedding;
      if (title !== existing.title || content !== existing.content) {
        try {
          const embeddingText = `${title} ${content}`.substring(0, 1000);
          embedding = await aiService.generateEmbedding(embeddingText);
        } catch (error) {
          logger.error('Errore generazione embedding:', error);
        }
      }
      
      const article = await prisma.knowledgeBaseArticle.update({
        where: { id },
        data: {
          title,
          content,
          category,
          tags: tags || [],
          imageUrl,
          videoUrl,
          published,
          embedding,
          metadata: {
            ...existing.metadata as any,
            updatedBy: req.user.fullName,
            updatedAt: new Date().toISOString()
          }
        },
        include: {
          authorUser: {
            select: {
              id: true,
              fullName: true,
              avatar: true
            }
          }
        }
      });
      
      return res.json(ResponseFormatter.success(
        article,
        'Articolo aggiornato con successo'
      ));
    } catch (error) {
      logger.error('Errore aggiornamento articolo KB:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Errore aggiornamento articolo',
        'KB_UPDATE_ERROR'
      ));
    }
  }
);

/**
 * DELETE /api/kb/articles/:id
 * Elimina un articolo (solo admin)
 */
router.delete('/articles/:id',
  authenticate,
  checkRole(['ADMIN', 'SUPER_ADMIN']),
  auditLogger('KB_DELETE_ARTICLE'),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      await prisma.knowledgeBaseArticle.delete({
        where: { id }
      });
      
      return res.json(ResponseFormatter.success(
        null,
        'Articolo eliminato con successo'
      ));
    } catch (error) {
      logger.error('Errore eliminazione articolo KB:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Errore eliminazione articolo',
        'KB_DELETE_ERROR'
      ));
    }
  }
);

/**
 * POST /api/kb/feedback
 * Invia feedback su un articolo
 */
router.post('/feedback',
  authenticate,
  validateRequest(feedbackSchema),
  auditLogger('KB_FEEDBACK'),
  async (req, res) => {
    try {
      const { articleId, helpful, comment } = req.body;
      
      // Verifica che l'articolo esista
      const article = await prisma.knowledgeBaseArticle.findUnique({
        where: { id: articleId }
      });
      
      if (!article) {
        return res.status(404).json(ResponseFormatter.error(
          'Articolo non trovato',
          'ARTICLE_NOT_FOUND'
        ));
      }
      
      // Crea feedback
      const feedback = await prisma.knowledgeBaseFeedback.create({
        data: {
          articleId,
          userId: req.user.id,
          helpful,
          comment
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true
            }
          }
        }
      });
      
      // Aggiorna contatori articolo
      await prisma.knowledgeBaseArticle.update({
        where: { id: articleId },
        data: helpful ? 
          { helpful: { increment: 1 } } : 
          { notHelpful: { increment: 1 } }
      });
      
      return res.status(201).json(ResponseFormatter.success(
        feedback,
        'Feedback inviato con successo'
      ));
    } catch (error) {
      logger.error('Errore invio feedback KB:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Errore invio feedback',
        'KB_FEEDBACK_ERROR'
      ));
    }
  }
);

/**
 * GET /api/kb/search
 * Ricerca semantica con AI
 */
router.get('/search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json(ResponseFormatter.error(
        'Query di ricerca richiesta',
        'QUERY_REQUIRED'
      ));
    }
    
    // Genera embedding per la query
    let queryEmbedding;
    try {
      queryEmbedding = await aiService.generateEmbedding(query as string);
    } catch (error) {
      logger.error('Errore generazione embedding query:', error);
      
      // Fallback a ricerca testuale
      const articles = await prisma.knowledgeBaseArticle.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: query as string, mode: 'insensitive' } },
            { content: { contains: query as string, mode: 'insensitive' } }
          ]
        },
        take: parseInt(limit as string),
        include: {
          authorUser: {
            select: {
              id: true,
              fullName: true
            }
          }
        }
      });
      
      return res.json(ResponseFormatter.success(
        articles,
        'Ricerca completata (testuale)'
      ));
    }
    
    // Ricerca semantica con embedding
    // Nota: In produzione, useresti un database vettoriale come Pinecone o pgvector
    const allArticles = await prisma.knowledgeBaseArticle.findMany({
      where: { published: true },
      include: {
        authorUser: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });
    
    // Calcola similarità coseno (semplificato)
    const articlesWithScore = allArticles
      .filter(article => article.embedding)
      .map(article => {
        const score = calculateCosineSimilarity(
          queryEmbedding,
          article.embedding as any
        );
        return { ...article, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, parseInt(limit as string));
    
    return res.json(ResponseFormatter.success(
      articlesWithScore,
      'Ricerca semantica completata'
    ));
  } catch (error) {
    logger.error('Errore ricerca KB:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore ricerca',
      'KB_SEARCH_ERROR'
    ));
  }
});

/**
 * GET /api/kb/categories
 * Ottieni categorie disponibili
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.knowledgeBaseArticle.groupBy({
      by: ['category'],
      where: {
        published: true,
        category: { not: null }
      },
      _count: {
        category: true
      }
    });
    
    const formattedCategories = categories.map(cat => ({
      name: cat.category,
      count: cat._count.category
    }));
    
    return res.json(ResponseFormatter.success(
      formattedCategories,
      'Categorie recuperate'
    ));
  } catch (error) {
    logger.error('Errore recupero categorie KB:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore recupero categorie',
      'KB_CATEGORIES_ERROR'
    ));
  }
});

/**
 * GET /api/kb/popular
 * Ottieni articoli più popolari
 */
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const articles = await prisma.knowledgeBaseArticle.findMany({
      where: { published: true },
      orderBy: [
        { views: 'desc' },
        { helpful: 'desc' }
      ],
      take: parseInt(limit as string),
      include: {
        authorUser: {
          select: {
            id: true,
            fullName: true,
            avatar: true
          }
        }
      }
    });
    
    return res.json(ResponseFormatter.success(
      articles,
      'Articoli popolari recuperati'
    ));
  } catch (error) {
    logger.error('Errore recupero articoli popolari KB:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore recupero articoli popolari',
      'KB_POPULAR_ERROR'
    ));
  }
});

/**
 * GET /api/kb/related/:id
 * Ottieni articoli correlati
 */
router.get('/related/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;
    
    // Trova l'articolo corrente
    const currentArticle = await prisma.knowledgeBaseArticle.findUnique({
      where: { id }
    });
    
    if (!currentArticle) {
      return res.status(404).json(ResponseFormatter.error(
        'Articolo non trovato',
        'ARTICLE_NOT_FOUND'
      ));
    }
    
    // Trova articoli correlati per categoria e tags
    const relatedArticles = await prisma.knowledgeBaseArticle.findMany({
      where: {
        published: true,
        id: { not: id },
        OR: [
          { category: currentArticle.category },
          { tags: { hasSome: currentArticle.tags } }
        ]
      },
      orderBy: { views: 'desc' },
      take: parseInt(limit as string),
      include: {
        authorUser: {
          select: {
            id: true,
            fullName: true,
            avatar: true
          }
        }
      }
    });
    
    return res.json(ResponseFormatter.success(
      relatedArticles,
      'Articoli correlati recuperati'
    ));
  } catch (error) {
    logger.error('Errore recupero articoli correlati KB:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore recupero articoli correlati',
      'KB_RELATED_ERROR'
    ));
  }
});

// Funzione helper per calcolare similarità coseno
function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (normA * normB);
}

export default router;
