/**
 * Category Service
 * Gestione categorie e sottocategorie del sistema
 * 
 * Responsabilità:
 * - CRUD completo categorie
 * - Gestione slug unici
 * - Validazione integrità referenziale
 * - Ordinamento e attivazione categorie
 * - Conteggio sottocategorie e richieste
 * 
 * @module services/category
 * @version 5.2.1
 * @updated 2025-10-01
 * @author Sistema Richiesta Assistenza
 */

import { prisma } from '../config/database';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import { generateSlug } from '../utils/slug';
import type { Category } from '@prisma/client';

/**
 * Interface per dati creazione categoria
 */
interface CreateCategoryData {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
  textColor?: string;
  isActive?: boolean;
  displayOrder?: number;
}

/**
 * Interface per dati aggiornamento categoria
 */
interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
  textColor?: string;
  isActive?: boolean;
  displayOrder?: number;
}

/**
 * Category Service Class
 * 
 * Gestisce tutte le operazioni CRUD sulle categorie
 */
export class CategoryService {
  
  /**
   * Recupera tutte le categorie con conteggi
   * 
   * @returns {Promise<Category[]>} Lista categorie ordinate
   * @throws {Error} Se query fallisce
   * 
   * @example
   * const categories = await categoryService.getAllCategories();
   */
  async getAllCategories(): Promise<any[]> {
    try {
      logger.info('[CategoryService] Fetching all categories');

      const categories = await prisma.category.findMany({
        include: {
          _count: {
            select: {
              Subcategory: true,
              AssistanceRequest: true,
            } as any,
          },
        },
        orderBy: [
          { displayOrder: 'asc' },
          { createdAt: 'desc' },
        ],
      });

      logger.info(`[CategoryService] Retrieved ${categories.length} categories`);
      
      // Ritorna dati puri (NO formatCategory!)
      return categories;

    } catch (error) {
      logger.error('[CategoryService] Error fetching categories:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Recupera categoria per ID
   * 
   * @param {string} id - ID categoria
   * @returns {Promise<Category|null>} Categoria o null se non esiste
   * @throws {Error} Se query fallisce
   * 
   * @example
   * const category = await categoryService.getCategoryById('cat-123');
   */
  async getCategoryById(id: string): Promise<any | null> {
    try {
      if (!id) {
        throw new Error('Category ID is required');
      }

      logger.info(`[CategoryService] Fetching category: ${id}`);

      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              Subcategory: true,
              AssistanceRequest: true,
            } as any,
          },
        },
      });

      if (!category) {
        logger.warn(`[CategoryService] Category not found: ${id}`);
        return null;
      }

      logger.info(`[CategoryService] Category retrieved successfully: ${id}`);
      
      // Ritorna dati puri (NO formatCategory!)
      return category;

    } catch (error) {
      logger.error(`[CategoryService] Error fetching category ${id}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Crea nuova categoria
   * 
   * @param {CreateCategoryData} data - Dati categoria
   * @returns {Promise<Category>} Categoria creata
   * @throws {Error} Se slug già esiste o validazione fallisce
   * 
   * @example
   * const category = await categoryService.createCategory({
   *   name: 'Idraulica',
   *   description: 'Servizi idraulici',
   *   icon: 'wrench'
   * });
   */
  async createCategory(data: CreateCategoryData): Promise<any> {
    try {
      // Validazione input
      if (!data.name) {
        throw new Error('Category name is required');
      }

      logger.info('[CategoryService] Creating category:', { name: data.name });

      // Genera slug se non fornito
      const slug = data.slug || generateSlug(data.name);

      // Check slug univocità
      const existing = await prisma.category.findFirst({
        where: { slug },
      });

      if (existing) {
        throw new Error(`Category with slug '${slug}' already exists`);
      }

      // Creazione categoria
      const newCategory = await prisma.category.create({
        data: {
          id: randomUUID(),
          name: data.name,
          slug,
          description: data.description,
          icon: data.icon,
          color: data.color || '#3B82F6', // Blue default
          textColor: data.textColor || '#FFFFFF', // White default
          isActive: data.isActive ?? true,
          displayOrder: data.displayOrder || 0,
          // Campo obbligatorio nello schema: updatedAt NON ha default
          updatedAt: new Date(),
        } as any, // TypeScript: id e updatedAt sono auto-generati
        include: {
          _count: {
            select: {
              Subcategory: true,
              AssistanceRequest: true,
            } as any,
          },
        },
      });

      logger.info(`[CategoryService] Category created successfully: ${newCategory.id}`);
      
      // Ritorna dati puri (NO formatCategory!)
      return newCategory;

    } catch (error) {
      logger.error('[CategoryService] Error creating category:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Aggiorna categoria esistente
   * 
   * @param {string} id - ID categoria
   * @param {UpdateCategoryData} data - Dati da aggiornare
   * @returns {Promise<Category|null>} Categoria aggiornata o null
   * @throws {Error} Se conflitto slug o validazione fallisce
   * 
   * @example
   * const updated = await categoryService.updateCategory('cat-123', {
   *   name: 'Idraulica Avanzata',
   *   isActive: false
   * });
   */
  async updateCategory(id: string, data: UpdateCategoryData): Promise<any | null> {
    try {
      if (!id) {
        throw new Error('Category ID is required');
      }

      logger.info(`[CategoryService] Updating category: ${id}`);

      // Check esistenza categoria
      const existing = await prisma.category.findUnique({
        where: { id },
      });

      if (!existing) {
        logger.warn(`[CategoryService] Category not found for update: ${id}`);
        return null;
      }

      // Se aggiorna slug, check conflitti
      if (data.slug && data.slug !== existing.slug) {
        const conflicting = await prisma.category.findFirst({
          where: {
            slug: data.slug,
            NOT: { id },
          },
        });

        if (conflicting) {
          throw new Error(`Category with slug '${data.slug}' already exists`);
        }
      }

      // Update categoria
      const updatedCategory = await prisma.category.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.slug !== undefined && { slug: data.slug }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.icon !== undefined && { icon: data.icon }),
          ...(data.color !== undefined && { color: data.color }),
          ...(data.textColor !== undefined && { textColor: data.textColor }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
        },
        include: {
          _count: {
            select: {
              Subcategory: true,
              AssistanceRequest: true,
            } as any,
          },
        },
      });

      logger.info(`[CategoryService] Category updated successfully: ${id}`);
      
      // Ritorna dati puri (NO formatCategory!)
      return updatedCategory;

    } catch (error) {
      logger.error(`[CategoryService] Error updating category ${id}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
        data,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Elimina categoria
   * 
   * Previene cancellazione se ci sono sottocategorie o richieste attive
   * 
   * @param {string} id - ID categoria
   * @returns {Promise<boolean>} True se eliminata, false se non trovata
   * @throws {Error} Se ha sottocategorie/richieste attive
   * 
   * @example
   * const deleted = await categoryService.deleteCategory('cat-123');
   */
  async deleteCategory(id: string): Promise<boolean> {
    try {
      if (!id) {
        throw new Error('Category ID is required');
      }

      logger.info(`[CategoryService] Deleting category: ${id}`);

      // Check esistenza e vincoli
      const category = await this.getCategoryById(id);
      
      if (!category) {
        logger.warn(`[CategoryService] Category not found for deletion: ${id}`);
        return false;
      }

      // Validazione integrità referenziale
      if (category._count && (category._count as any).Subcategory > 0) {
        throw new Error(`Cannot delete category with ${(category._count as any).Subcategory} subcategories`);
      }

      if (category._count && (category._count as any).AssistanceRequest > 0) {
        throw new Error(`Cannot delete category with ${(category._count as any).AssistanceRequest} active requests`);
      }

      // Eliminazione
      await prisma.category.delete({
        where: { id },
      });

      logger.info(`[CategoryService] Category deleted successfully: ${id}`);
      return true;

    } catch (error) {
      logger.error(`[CategoryService] Error deleting category ${id}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Recupera categoria per slug
   * 
   * @param {string} slug - Slug categoria
   * @returns {Promise<Category|null>} Categoria o null
   * @throws {Error} Se query fallisce
   * 
   * @example
   * const category = await categoryService.getCategoryBySlug('idraulica');
   */
  async getCategoryBySlug(slug: string): Promise<any | null> {
    try {
      if (!slug) {
        throw new Error('Category slug is required');
      }

      logger.info(`[CategoryService] Fetching category by slug: ${slug}`);

      const category = await prisma.category.findFirst({
        where: { slug },
        include: {
          _count: {
            select: {
              Subcategory: true,
              AssistanceRequest: true,
            } as any,
          },
        },
      });

      if (!category) {
        logger.warn(`[CategoryService] Category not found with slug: ${slug}`);
        return null;
      }

      logger.info(`[CategoryService] Category retrieved by slug: ${slug}`);
      return category;

    } catch (error) {
      logger.error(`[CategoryService] Error fetching category by slug ${slug}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        slug,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Recupera solo categorie attive
   * 
   * @returns {Promise<Category[]>} Lista categorie attive
   * @throws {Error} Se query fallisce
   * 
   * @example
   * const activeCategories = await categoryService.getActiveCategories();
   */
  async getActiveCategories(): Promise<any[]> {
    try {
      logger.info('[CategoryService] Fetching active categories');

      const categories = await prisma.category.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              Subcategory: true,
              AssistanceRequest: true,
            } as any,
          },
        },
        orderBy: [
          { displayOrder: 'asc' },
          { name: 'asc' },
        ],
      });

      logger.info(`[CategoryService] Retrieved ${categories.length} active categories`);
      return categories;

    } catch (error) {
      logger.error('[CategoryService] Error fetching active categories:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}

/**
 * Export Singleton Instance
 */
export const categoryService = new CategoryService();
