import { Router, Request, Response } from 'express';
import { DatabaseClient } from '../database/client';
import { OpenAIService } from '../services/OpenAIService';
import { DocumentClassifierService } from '../services/DocumentClassifierService';
import { HybridExtractionService } from '../services/HybridExtractionService';
import { LLMEntityExtractionService } from '../services/LLMEntityExtractionService';
import { KnowledgeGraphService } from '../services/KnowledgeGraphService';
import logger from '../utils/logger';

const router = Router();
const db = DatabaseClient.getInstance();

/**
 * GET /api/patterns
 * Get all learned patterns with statistics
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { containerId, showInactive } = req.query;

    let query = `
      SELECT 
        id,
        document_type,
        pattern_name,
        description,
        confidence_threshold,
        min_similarity_score,
        structure_pattern,
        entity_patterns,
        relationship_rules,
        example_keywords,
        created_at,
        updated_at,
        last_used_at,
        usage_count,
        success_count,
        failure_count,
        accuracy_score,
        is_active,
        is_verified,
        verification_threshold,
        tags,
        container_ids
      FROM smartdocs.document_patterns
    `;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Show inactive patterns if requested
    if (showInactive !== 'true') {
      conditions.push('is_active = true');
    }

    if (containerId) {
      conditions.push(`($${paramIndex} = ANY(container_ids) OR container_ids IS NULL OR array_length(container_ids, 1) IS NULL)`);
      params.push(containerId);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY accuracy_score DESC, usage_count DESC`;

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        patterns: result.rows,
        total: result.rows.length
      }
    });
  } catch (error: any) {
    logger.error('[PatternsAPI] Error fetching patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patterns',
      message: error.message
    });
  }
});

/**
 * GET /api/patterns/:id
 * Get single pattern with full details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT * FROM smartdocs.document_patterns WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pattern not found'
      });
    }

    res.json({
      success: true,
      data: {
        pattern: result.rows[0]
      }
    });
  } catch (error: any) {
    logger.error('[PatternsAPI] Error fetching pattern:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pattern',
      message: error.message
    });
  }
});

/**
 * GET /api/patterns/:id/usage-log
 * Get usage history for a pattern
 */
router.get('/:id/usage-log', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    const result = await db.query(
      `SELECT 
        id,
        document_id,
        container_id,
        used_at,
        success,
        embedding_similarity,
        keyword_match_score,
        entities_extracted,
        relationships_extracted,
        extraction_time_ms,
        error_message,
        fallback_to_ai
      FROM smartdocs.pattern_usage_log
      WHERE pattern_id = $1
      ORDER BY used_at DESC
      LIMIT $2`,
      [id, limit]
    );

    res.json({
      success: true,
      data: {
        usage_log: result.rows,
        total: result.rows.length
      }
    });
  } catch (error: any) {
    logger.error('[PatternsAPI] Error fetching usage log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage log',
      message: error.message
    });
  }
});

/**
 * GET /api/patterns/stats/hybrid-extraction
 * Get hybrid extraction statistics
 */
router.get('/stats/hybrid-extraction', async (req: Request, res: Response) => {
  try {
    const { containerId } = req.query;

    const openai = new OpenAIService();
    const llmExtractor = new LLMEntityExtractionService();
    const kgService = new KnowledgeGraphService();
    const hybridExtractor = new HybridExtractionService(
      db,
      openai,
      llmExtractor,
      kgService
    );

    const stats = await hybridExtractor.getStatistics(
      containerId as string | undefined
    );

    // Calculate percentages
    const total = (stats.pattern_successes || 0) + (stats.pattern_failures || 0) + (stats.ai_fallbacks || 0);
    const patternSuccessRate = total > 0 ? (stats.pattern_successes / total) * 100 : 0;
    const aiFallbackRate = total > 0 ? (stats.ai_fallbacks / total) * 100 : 0;

    res.json({
      success: true,
      data: {
        statistics: {
          pattern_successes: stats.pattern_successes || 0,
          pattern_failures: stats.pattern_failures || 0,
          ai_fallbacks: stats.ai_fallbacks || 0,
          avg_pattern_time_ms: Math.round(stats.avg_pattern_time_ms || 0),
          pattern_success_rate: Math.round(patternSuccessRate * 10) / 10,
          ai_fallback_rate: Math.round(aiFallbackRate * 10) / 10,
          total_extractions: total,
          estimated_cost_savings: (stats.ai_fallbacks || 0) * 0.02 // $0.02 per AI extraction avoided
        }
      }
    });
  } catch (error: any) {
    logger.error('[PatternsAPI] Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

/**
 * PATCH /api/patterns/:id
 * Update pattern (activate/deactivate, change thresholds, etc.)
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      is_active,
      confidence_threshold,
      min_similarity_score,
      description,
      tags
    } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (typeof is_active === 'boolean') {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }

    if (typeof confidence_threshold === 'number') {
      updates.push(`confidence_threshold = $${paramIndex++}`);
      values.push(confidence_threshold);
    }

    if (typeof min_similarity_score === 'number') {
      updates.push(`min_similarity_score = $${paramIndex++}`);
      values.push(min_similarity_score);
    }

    if (description) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }

    if (Array.isArray(tags)) {
      updates.push(`tags = $${paramIndex++}`);
      values.push(tags);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    values.push(id);

    const query = `
      UPDATE smartdocs.document_patterns
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pattern not found'
      });
    }

    res.json({
      success: true,
      data: {
        pattern: result.rows[0]
      }
    });
  } catch (error: any) {
    logger.error('[PatternsAPI] Error updating pattern:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update pattern',
      message: error.message
    });
  }
});

/**
 * DELETE /api/patterns/:id
 * Soft delete pattern (set is_active = false)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { hard } = req.query; // ?hard=true for permanent delete

    if (hard === 'true') {
      // Hard delete - remove pattern and logs
      await db.query('DELETE FROM smartdocs.pattern_usage_log WHERE pattern_id = $1', [id]);
      const result = await db.query(
        'DELETE FROM smartdocs.document_patterns WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Pattern not found'
        });
      }

      res.json({
        success: true,
        message: 'Pattern permanently deleted'
      });
    } else {
      // Soft delete
      const result = await db.query(
        `UPDATE smartdocs.document_patterns
         SET is_active = false
         WHERE id = $1
         RETURNING id`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Pattern not found'
        });
      }

      res.json({
        success: true,
        message: 'Pattern deactivated successfully'
      });
    }
  } catch (error: any) {
    logger.error('[PatternsAPI] Error deleting pattern:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete pattern',
      message: error.message
    });
  }
});

export default router;
