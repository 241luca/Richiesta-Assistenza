/**
 * knowledge-graph.ts
 * 
 * API routes for Knowledge Graph queries and analytics
 * Enterprise-grade endpoints for graph traversal and insights
 * 
 * @author SmartDocs AI
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { DatabaseClient } from '../../database/client';
import { KnowledgeGraphService } from '../../services/KnowledgeGraphService';
import { logger } from '../../utils/logger';

const router = Router();
const db = DatabaseClient.getInstance();
const kgService = new KnowledgeGraphService();

/**
 * GET /api/knowledge-graph/entities
 * Get all entities for a document
 */
router.get('/entities', async (req: Request, res: Response) => {
  try {
    const { document_id, type, min_importance, limit = '50' } = req.query;

    let query = 'SELECT * FROM smartdocs.kg_entities WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (document_id) {
      query += ` AND document_id = $${paramIndex}`;
      params.push(document_id);
      paramIndex++;
    }

    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (min_importance) {
      query += ` AND importance >= $${paramIndex}`;
      params.push(parseFloat(min_importance as string));
      paramIndex++;
    }

    query += ` ORDER BY importance DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit as string));

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error: any) {
    logger.error('[KG API] Get entities failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/knowledge-graph/entity/:id
 * Get entity by ID with relationships
 */
router.get('/entity/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get entity
    const entityResult = await db.query(
      'SELECT * FROM smartdocs.kg_entities WHERE id = $1',
      [id]
    );

    if (entityResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Entity not found'
      });
    }

    const entity = entityResult.rows[0];

    // Get relationships
    const relsResult = await db.query(`
      SELECT r.*, 
        e1.name as entity1_name,
        e2.name as entity2_name
      FROM smartdocs.kg_relationships r
      JOIN smartdocs.kg_entities e1 ON r.entity1_id = e1.id
      JOIN smartdocs.kg_entities e2 ON r.entity2_id = e2.id
      WHERE r.entity1_id = $1 OR r.entity2_id = $1
      ORDER BY r.strength DESC
    `, [id]);

    res.json({
      success: true,
      data: {
        entity,
        relationships: relsResult.rows
      }
    });

  } catch (error: any) {
    logger.error('[KG API] Get entity failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/knowledge-graph/related/:name
 * Find entities related to a named entity
 */
router.get('/related/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { document_id, max_depth = '2' } = req.query;

    const relatedEntities = await kgService.findRelatedEntities(
      name,
      document_id as string | undefined,
      parseInt(max_depth as string)
    );

    res.json({
      success: true,
      data: relatedEntities,
      total: relatedEntities.length
    });

  } catch (error: any) {
    logger.error('[KG API] Find related failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/knowledge-graph/relationships
 * Get relationships with filters
 */
router.get('/relationships', async (req: Request, res: Response) => {
  try {
    const { document_id, type, min_strength, limit = '100' } = req.query;

    let query = `
      SELECT r.*, 
        e1.name as entity1_name, e1.type as entity1_type,
        e2.name as entity2_name, e2.type as entity2_type
      FROM smartdocs.kg_relationships r
      JOIN smartdocs.kg_entities e1 ON r.entity1_id = e1.id
      JOIN smartdocs.kg_entities e2 ON r.entity2_id = e2.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (document_id) {
      query += ` AND r.document_id = $${paramIndex}`;
      params.push(document_id);
      paramIndex++;
    }

    if (type) {
      query += ` AND r.relationship_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (min_strength) {
      query += ` AND r.strength >= $${paramIndex}`;
      params.push(parseFloat(min_strength as string));
      paramIndex++;
    }

    query += ` ORDER BY r.strength DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit as string));

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error: any) {
    logger.error('[KG API] Get relationships failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/knowledge-graph/statistics/:document_id
 * Get graph statistics for a document
 */
router.get('/statistics/:document_id', async (req: Request, res: Response) => {
  try {
    const { document_id } = req.params;

    const stats = await kgService.getGraphStatistics(document_id);

    res.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    logger.error('[KG API] Get statistics failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/knowledge-graph/graph/:document_id
 * Get full graph data for visualization (nodes + edges)
 */
router.get('/graph/:document_id', async (req: Request, res: Response) => {
  try {
    const { document_id } = req.params;
    const { min_importance = '0.5', max_nodes = '100' } = req.query;

    // Get entities (nodes)
    const nodesResult = await db.query(`
      SELECT 
        id,
        name,
        type,
        importance,
        confidence,
        frequency,
        aliases
      FROM smartdocs.kg_entities
      WHERE document_id = $1
        AND importance >= $2
      ORDER BY importance DESC
      LIMIT $3
    `, [document_id, parseFloat(min_importance as string), parseInt(max_nodes as string)]);

    const nodes = nodesResult.rows;
    const nodeIds = nodes.map(n => n.id);

    // Get relationships (edges) between these nodes
    const edgesResult = await db.query(`
      SELECT 
        id,
        entity1_id,
        entity2_id,
        relationship_type,
        strength,
        confidence
      FROM smartdocs.kg_relationships
      WHERE document_id = $1
        AND entity1_id = ANY($2::uuid[])
        AND entity2_id = ANY($2::uuid[])
      ORDER BY strength DESC
    `, [document_id, nodeIds]);

    res.json({
      success: true,
      data: {
        nodes,
        edges: edgesResult.rows,
        metadata: {
          documentId: document_id,
          totalNodes: nodes.length,
          totalEdges: edgesResult.rows.length,
          minImportance: parseFloat(min_importance as string)
        }
      }
    });

  } catch (error: any) {
    logger.error('[KG API] Get graph failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/knowledge-graph/search
 * Search entities by name
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, document_id, limit = '20' } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }

    let query = `
      SELECT *
      FROM smartdocs.kg_entities
      WHERE name ILIKE $1
    `;
    const params: any[] = [`%${q}%`];
    let paramIndex = 2;

    if (document_id) {
      query += ` AND document_id = $${paramIndex}`;
      params.push(document_id);
      paramIndex++;
    }

    query += ` ORDER BY importance DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit as string));

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error: any) {
    logger.error('[KG API] Search failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
