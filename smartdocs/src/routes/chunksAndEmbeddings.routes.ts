import { Router, Request, Response } from 'express';
import { DatabaseClient } from '../database/client';
import { logger } from '../utils/logger';

const router = Router();
const db = DatabaseClient.getInstance();

/**
 * ============================================================================
 * ENDPOINT PER DEVELOPER - TEST E AFFINAMENTO SISTEMA
 * ============================================================================
 */

/**
 * GET /api/chunks/document/:documentId
 * Mostra i CHUNK GREZZI di un documento con metadati
 * 
 * Serve per:
 * - Verificare se il chunking è corretto
 * - Controllare se i chunk hanno senso semantico
 * - Debuggare problemi di divisione del testo
 */
router.get('/chunks/document/:documentId', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    // Query: Chunk con metadati arricchiti
    let query = `
      SELECT 
        e.id as chunk_id,
        e.chunk_index,
        e.chunk_text,
        e.token_count,
        cm.title as chunk_title,
        cm.section_path,
        cm.topic_keywords,
        cm.importance_score,
        cm.content_type,
        cm.is_section_header,
        cm.heading_level,
        cm.readability_score,
        cm.sentence_count,
        cm.word_count,
        d.title as document_title,
        d.external_doc_type,
        d.external_doc_id,
        d.processing_status,
        e.created_at
      FROM smartdocs.embeddings e
      LEFT JOIN smartdocs.chunk_metadata cm 
        ON e.document_id = cm.document_id AND e.chunk_index = cm.chunk_index
      JOIN smartdocs.documents d ON e.document_id = d.id
      WHERE e.document_id = $1
      ORDER BY e.chunk_index ASC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [documentId, parseInt(limit as string), parseInt(offset as string)]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Documento non trovato o senza chunk'
      });
    }

    res.json({
      success: true,
      data: {
        document_id: documentId,
        total_chunks: result.rowCount,
        chunks: result.rows,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      }
    });

  } catch (error: any) {
    logger.error('[ChunksAPI] Fetch chunks failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/embeddings/document/:documentId
 * Mostra gli EMBEDDING (vettori) di un documento
 * 
 * Serve per:
 * - Verificare che i vettori siano stati generati
 * - Testare ricerca semantica
 * - Debuggare problemi di embedding
 * 
 * Query param:
 * - include_vector=true → include il vettore (pesante!)
 * - limit → numero di embeddings
 */
router.get('/embeddings/document/:documentId', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const { limit = '50', offset = '0', include_vector = 'false' } = req.query;

    // Se non richiedi il vettore, lo escludiamo (è molto pesante)
    const selectVector = include_vector === 'true' 
      ? 'e.embedding::text as embedding_vector,' 
      : '';

    let query = `
      SELECT 
        e.id as embedding_id,
        e.chunk_index,
        e.chunk_text,
        e.token_count,
        ${selectVector}
        e.metadata,
        e.created_at,
        d.title as document_title,
        d.external_doc_type
      FROM smartdocs.embeddings e
      JOIN smartdocs.documents d ON e.document_id = d.id
      WHERE e.document_id = $1
      ORDER BY e.chunk_index ASC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [documentId, parseInt(limit as string), parseInt(offset as string)]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Documento non trovato o senza embeddings'
      });
    }

    res.json({
      success: true,
      data: {
        document_id: documentId,
        total_embeddings: result.rowCount,
        embeddings: result.rows,
        note: include_vector === 'true' ? 'Vettori inclusi (pesante!)' : 'Vettori esclusi. Usa ?include_vector=true per includerli',
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      }
    });

  } catch (error: any) {
    logger.error('[EmbeddingsAPI] Fetch embeddings failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/knowledge-graph/document/:documentId
 * Mostra le ENTITÀ ESTRATTE e le RELAZIONI dal knowledge graph
 * 
 * Serve per:
 * - Verificare se l'estrazione di entità è corretta
 * - Controllare le relazioni estratte
 * - Debuggare il knowledge graph
 */
router.get('/knowledge-graph/document/:documentId', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;

    // Get entità
    const entitiesQuery = `
      SELECT 
        e.id,
        e.name,
        e.type,
        e.importance,
        e.confidence,
        e.frequency,
        e.aliases,
        e.description,
        COUNT(DISTINCT m.id) as mention_count
      FROM smartdocs.kg_entities e
      LEFT JOIN smartdocs.kg_entity_mentions m ON e.id = m.entity_id
      WHERE e.document_id = $1
      GROUP BY e.id, e.name, e.type, e.importance, e.confidence, e.frequency, e.aliases, e.description
      ORDER BY e.importance DESC, e.frequency DESC
    `;

    const entitiesResult = await db.query(entitiesQuery, [documentId]);

    // Get relazioni
    const relationshipsQuery = `
      SELECT 
        r.id,
        r.relationship_type,
        r.strength,
        r.confidence,
        e1.name as entity1_name,
        e1.type as entity1_type,
        e2.name as entity2_name,
        e2.type as entity2_type,
        r.evidence,
        r.context
      FROM smartdocs.kg_relationships r
      JOIN smartdocs.kg_entities e1 ON r.entity1_id = e1.id
      JOIN smartdocs.kg_entities e2 ON r.entity2_id = e2.id
      WHERE r.document_id = $1
      ORDER BY r.strength DESC, r.confidence DESC
    `;

    const relationshipsResult = await db.query(relationshipsQuery, [documentId]);

    // Get statistiche
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT e.id) as total_entities,
        COUNT(DISTINCT CASE WHEN e.type = 'COMPONENT' THEN e.id END) as components,
        COUNT(DISTINCT CASE WHEN e.type = 'TASK' THEN e.id END) as tasks,
        COUNT(DISTINCT CASE WHEN e.type = 'PROCESS' THEN e.id END) as processes,
        COUNT(DISTINCT CASE WHEN e.type = 'ROLE' THEN e.id END) as roles,
        COUNT(DISTINCT CASE WHEN e.type = 'CONCEPT' THEN e.id END) as concepts,
        AVG(e.importance) as avg_importance,
        AVG(e.confidence) as avg_confidence
      FROM smartdocs.kg_entities e
      WHERE e.document_id = $1
    `;

    const statsResult = await db.query(statsQuery, [documentId]);

    res.json({
      success: true,
      data: {
        document_id: documentId,
        statistics: statsResult.rows[0] || {},
        entities: entitiesResult.rows,
        relationships: relationshipsResult.rows,
        summary: {
          total_entities: entitiesResult.rowCount,
          total_relationships: relationshipsResult.rowCount
        }
      }
    });

  } catch (error: any) {
    logger.error('[KnowledgeGraphAPI] Fetch KG failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/embeddings/container/:containerId
 * Mostra gli EMBEDDING di TUTTI i documenti in un container
 * 
 * Serve per:
 * - Verificare che i vettori siano stati generati per il container
 * - Testare ricerca semantica su larga scala
 * - Debuggare problemi di embedding
 */
router.get('/embeddings/container/:containerId', async (req: Request, res: Response) => {
  try {
    const { containerId } = req.params;
    const { limit = '100', offset = '0', include_vector = 'false' } = req.query;

    // Se non richiedi il vettore, lo escludiamo (è molto pesante)
    const selectVector = include_vector === 'true' 
      ? 'e.embedding::text as embedding_vector,' 
      : '';

    let query = `
      SELECT 
        e.id as embedding_id,
        e.chunk_index,
        e.chunk_text,
        e.token_count,
        ${selectVector}
        e.metadata,
        e.created_at,
        d.id as document_id,
        d.title as document_title,
        d.external_doc_type,
        d.external_doc_id
      FROM smartdocs.embeddings e
      JOIN smartdocs.documents d ON e.document_id = d.id
      WHERE e.container_id = $1
      ORDER BY d.created_at DESC, e.chunk_index ASC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [containerId, parseInt(limit as string), parseInt(offset as string)]);

    res.json({
      success: true,
      data: {
        container_id: containerId,
        total_embeddings: result.rowCount,
        embeddings: result.rows,
        note: include_vector === 'true' ? 'Vettori inclusi (pesante!)' : 'Vettori esclusi. Usa ?include_vector=true per includerli',
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      }
    });

  } catch (error: any) {
    logger.error('[EmbeddingsAPI] Fetch container embeddings failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/chunks/container/:containerId
 * Mostra TUTTI i chunk di TUTTI i documenti in un container
 * 
 * Serve per:
 * - Vedere globalmente cosa è stato processato in un container
 * - Analizzare la qualità del chunking su larga scala
 */
router.get('/chunks/container/:containerId', async (req: Request, res: Response) => {
  try {
    const { containerId } = req.params;
    const { limit = '100', offset = '0', external_doc_type } = req.query;

    let query = `
      SELECT 
        e.id as chunk_id,
        e.chunk_index,
        e.chunk_text,
        e.token_count,
        cm.importance_score,
        cm.topic_keywords,
        d.id as document_id,
        d.title as document_title,
        d.external_doc_type,
        d.external_doc_id,
        d.processing_status,
        d.created_at
      FROM smartdocs.embeddings e
      LEFT JOIN smartdocs.chunk_metadata cm 
        ON e.document_id = cm.document_id AND e.chunk_index = cm.chunk_index
      JOIN smartdocs.documents d ON e.document_id = d.id
      WHERE e.container_id = $1
    `;

    const params: any[] = [containerId];
    let paramIndex = 2;

    if (external_doc_type) {
      query += ` AND d.external_doc_type = $${paramIndex}`;
      params.push(external_doc_type);
      paramIndex++;
    }

    query += ` ORDER BY d.created_at DESC, e.chunk_index ASC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit as string));
    params.push(parseInt(offset as string));

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        container_id: containerId,
        total_chunks: result.rowCount,
        chunks: result.rows,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      }
    });

  } catch (error: any) {
    logger.error('[ChunksAPI] Fetch container chunks failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/search/semantic
 * RICERCA SEMANTICA nei chunk
 * 
 * Serve per:
 * - Testare se la ricerca semantica funziona
 * - Verificare che i vettori siano corretti
 * - Debuggare problemi di matching semantico
 * 
 * Query params:
 * - query: il testo da cercare (es: "caldaia rotta")
 * - container_id: filtra per container
 * - limit: quanti risultati
 */
router.get('/search/semantic', async (req: Request, res: Response) => {
  try {
    const { query, container_id, limit = '10' } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Parametro "query" obbligatorio'
      });
    }

    // ⚠️ NOTA: Per fare vera ricerca semantica, serve un embedding della query
    // Questo è un placeholder - in produzione useresti pgvector per cosine similarity
    let searchQuery = `
      SELECT 
        e.id as chunk_id,
        e.chunk_index,
        e.chunk_text,
        d.id as document_id,
        d.title as document_title,
        d.external_doc_type,
        cm.importance_score,
        ts_rank(to_tsvector('italian', e.chunk_text), plainto_tsquery('italian', $1)) as rank
      FROM smartdocs.embeddings e
      JOIN smartdocs.documents d ON e.document_id = d.id
      LEFT JOIN smartdocs.chunk_metadata cm ON e.document_id = cm.document_id AND e.chunk_index = cm.chunk_index
      WHERE to_tsvector('italian', e.chunk_text) @@ plainto_tsquery('italian', $1)
    `;

    const params: any[] = [query as string];
    let paramIndex = 2;

    if (container_id) {
      searchQuery += ` AND d.container_id = $${paramIndex}`;
      params.push(container_id);
      paramIndex++;
    }

    searchQuery += ` ORDER BY rank DESC`;
    searchQuery += ` LIMIT $${paramIndex}`;
    params.push(parseInt(limit as string));

    const result = await db.query(searchQuery, params);

    res.json({
      success: true,
      data: {
        query: query,
        total_results: result.rowCount,
        results: result.rows,
        note: 'Questa è ricerca full-text italiana. Per vera ricerca semantica, usa embeddings con pgvector.'
      }
    });

  } catch (error: any) {
    logger.error('[SearchAPI] Semantic search failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/system/stats
 * Statistiche GLOBALI del sistema
 * 
 * Serve per:
 * - Monitorare lo stato globale
 * - Capire quanti documenti sono stati processati
 * - Vedere la distribuzione dei dati
 */
router.get('/system/stats', async (req: Request, res: Response) => {
  try {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM smartdocs.containers) as total_containers,
        (SELECT COUNT(*) FROM smartdocs.documents) as total_documents,
        (SELECT COUNT(*) FROM smartdocs.documents WHERE processing_status = 'COMPLETED') as completed_documents,
        (SELECT COUNT(*) FROM smartdocs.documents WHERE processing_status = 'FAILED') as failed_documents,
        (SELECT COUNT(*) FROM smartdocs.embeddings) as total_chunks,
        (SELECT COUNT(*) FROM smartdocs.kg_entities) as total_entities,
        (SELECT COUNT(*) FROM smartdocs.kg_relationships) as total_relationships,
        (SELECT AVG(word_count) FROM smartdocs.chunk_metadata) as avg_chunk_size,
        (SELECT SUM(file_size) FROM smartdocs.documents) as total_storage_bytes
    `;

    const result = await db.query(statsQuery);

    res.json({
      success: true,
      data: {
        system_statistics: result.rows[0] || {}
      }
    });

  } catch (error: any) {
    logger.error('[SystemAPI] Stats failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
