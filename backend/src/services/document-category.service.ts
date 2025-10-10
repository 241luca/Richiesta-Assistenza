import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export class DocumentCategoryService {
  /**
   * Ottieni tutte le categorie
   */
  async getAllCategories(filters?: any) {
    try {
      const where: any = {};
      
      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive === 'true' || filters.isActive === true;
      }
      
      if (filters?.parentId !== undefined) {
        where.parentId = filters.parentId;
      }

      const categories = await prisma.documentCategory.findMany({
        where,
        include: {
          parent: true,
          other_DocumentCategory: {
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' }
        ]
      });

      return categories;
    } catch (error) {
      logger.error('Error fetching document categories:', error);
      throw error;
    }
  }

  /**
   * Ottieni statistiche sulle categorie
   */
  async getStatistics() {
    try {
      const [total, active, withChildren] = await Promise.all([
      prisma.documentCategory.count(),
      prisma.documentCategory.count({ where: { isActive: true } }),
      prisma.documentCategory.count({
      where: {
      other_DocumentCategory: { some: {} }
      }
      })
      ]);

      return {
        total,
        active,
        inactive: total - active,
        withChildren,
        leafCategories: total - withChildren
      };
    } catch (error) {
      logger.error('Error fetching category statistics:', error);
      throw error;
    }
  }

  /**
   * Ottieni una categoria per ID
   */
  async getCategoryById(id: string) {
    try {
      const category = await prisma.documentCategory.findUnique({
        where: { id },
        include: {
          parent: true,
          other_DocumentCategory: {
            orderBy: { sortOrder: 'asc' }
          }
        }
      });

      if (!category) {
        throw new Error('Category not found');
      }

      return category;
    } catch (error) {
      logger.error('Error fetching category:', error);
      throw error;
    }
  }

  /**
   * Ottieni una categoria per codice
   */
  async getCategoryByCode(code: string) {
    try {
      const category = await prisma.documentCategory.findUnique({
        where: { code },
        include: {
          parent: true,
          other_DocumentCategory: true
        }
      });

      return category;
    } catch (error) {
      logger.error('Error fetching category by code:', error);
      throw error;
    }
  }

  /**
   * Crea una nuova categoria
   */
  async createCategory(data: any, userId: string) {
    try {
      // Verifica se il codice esiste già
      if (data.code) {
        const existing = await this.getCategoryByCode(data.code);
        if (existing) {
          throw new Error('Category with this code already exists');
        }
      }

      // Se ha un parent, verifica che esista
      if (data.parentId) {
        const parent = await this.getCategoryById(data.parentId);
        if (!parent) {
          throw new Error('Parent category not found');
        }
      }

      const categoryData: any = {
        code: data.code,
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        parentId: data.parentId,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive ?? true
      };

      const newCategory = await prisma.documentCategory.create({
        data: categoryData,
        include: {
          parent: true,
          other_DocumentCategory: true
        }
      });

      // Log audit
      await this.logAudit('CREATE', newCategory.id, null, newCategory, userId);

      return newCategory;
    } catch (error: any) {
      logger.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Aggiorna una categoria
   */
  async updateCategory(id: string, data: any, userId: string) {
    try {
      const existingCategory = await this.getCategoryById(id);

      // Se sta cambiando il codice, verifica che non esista già
      if (data.code && data.code !== existingCategory.code) {
        const duplicate = await this.getCategoryByCode(data.code);
        if (duplicate) {
          throw new Error('Category with this code already exists');
        }
      }

      // Se sta cambiando il parent
      if (data.parentId !== undefined && data.parentId !== existingCategory.parentId) {
        // Non permettere di impostare se stesso come parent
        if (data.parentId === id) {
          throw new Error('Category cannot be its own parent');
        }

        // Verifica che il nuovo parent esista
        if (data.parentId) {
          const parent = await this.getCategoryById(data.parentId);
          if (!parent) {
            throw new Error('Parent category not found');
          }

          // Verifica che non sia un loop (il parent non deve essere un figlio)
          if (await this.isDescendant(id, data.parentId)) {
            throw new Error('Cannot create circular reference');
          }
        }
      }

      const updateData: any = {};
      if (data.code !== undefined) updateData.code = data.code;
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.icon !== undefined) updateData.icon = data.icon;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.parentId !== undefined) updateData.parentId = data.parentId;
      if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const updatedCategory = await prisma.documentCategory.update({
        where: { id },
        data: updateData,
        include: {
          parent: true,
          other_DocumentCategory: true
        }
      });

      // Log audit
      await this.logAudit('UPDATE', id, existingCategory, updatedCategory, userId);

      return updatedCategory;
    } catch (error: any) {
      logger.error('Error updating category:', error);
      throw error;
    }
  }

  /**
   * Elimina una categoria
   */
  async deleteCategory(id: string, userId: string) {
    try {
      const category = await this.getCategoryById(id);

      // Verifica se ha figli
      const childrenCount = await prisma.documentCategory.count({
        where: { parentId: id }
      });

      if (childrenCount > 0) {
        throw new Error(`Cannot delete category: has ${childrenCount} subcategories`);
      }

      // Verifica se ci sono tipi documento associati
      const typesCount = await prisma.documentTypeConfig.count({
        where: { category: category.code }
      });

      if (typesCount > 0) {
        throw new Error(`Cannot delete category: ${typesCount} document types are using it`);
      }

      await prisma.documentCategory.delete({
        where: { id }
      });

      // Log audit
      await this.logAudit('DELETE', id, category, null, userId);

      return { success: true, message: 'Category deleted successfully' };
    } catch (error: any) {
      logger.error('Error deleting category:', error);
      throw error;
    }
  }

  /**
   * Verifica se una categoria è discendente di un'altra
   */
  private async isDescendant(parentId: string, childId: string): Promise<boolean> {
    const category = await prisma.documentCategory.findUnique({
      where: { id: childId },
      include: { 
        other_DocumentCategory: true 
      }
    });

    if (!category || !category.other_DocumentCategory) return false;

    for (const child of category.other_DocumentCategory) {
      if (child.id === parentId) return true;
      if (await this.isDescendant(parentId, child.id)) return true;
    }

    return false;
  }

  /**
   * Ottieni l'albero completo delle categorie
   */
  async getCategoryTree() {
    try {
      const allCategories = await prisma.documentCategory.findMany({
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' }
        ]
      });

      // Costruisci l'albero
      const tree: any[] = [];
      const map = new Map<string, any>();

      // Prima passa: crea la mappa
      allCategories.forEach(cat => {
        map.set(cat.id, { ...cat, children: [] });
      });

      // Seconda passa: costruisci l'albero
      allCategories.forEach(cat => {
        const node = map.get(cat.id);
        if (cat.parentId) {
          const parent = map.get(cat.parentId);
          if (parent) {
            parent.other_DocumentCategory.push(node);
          }
        } else {
          tree.push(node);
        }
      });

      return tree;
    } catch (error) {
      logger.error('Error building category tree:', error);
      throw error;
    }
  }

  /**
   * Log delle modifiche per audit
   */
  private async logAudit(
    action: string,
    entityId: string,
    oldValues: any,
    newValues: any,
    userId: string
  ) {
    try {
      await prisma.documentConfigAudit.create({
        data: {
          entityType: 'DocumentCategory',
          entityId,
          action,
          oldValues: oldValues ? oldValues : undefined,
          newValues: newValues ? newValues : undefined,
          userId
        }
      });
    } catch (error) {
      logger.error('Error logging audit:', error);
      // Non lanciare errore per non bloccare l'operazione principale
    }
  }
}

export const documentCategoryService = new DocumentCategoryService();
