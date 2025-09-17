import { prisma } from '../config/database';
import { generateSlug } from '../utils/slug';
import { formatCategory, formatCategoryList } from '../utils/responseFormatter';

export class CategoryService {
  async getAllCategories() {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
        select: {
          subcategories: true,
            requests: true,
          },
        },
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // USA IL RESPONSE FORMATTER!
    return formatCategoryList(categories);
  }

  async getCategoryById(id: string) {
    const category = await prisma.category.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
        select: {
          subcategories: true,
            requests: true,
          },
        },
      },
    });

    if (!category) {
      return null;
    }

    // USA IL RESPONSE FORMATTER!
    return formatCategory(category);
  }

  async createCategory(data: any) {
    const slug = data.slug || generateSlug(data.name);

    // Check if slug already exists
    const existing = await prisma.category.findFirst({
      where: {
        slug,
      },
    });

    if (existing) {
      throw new Error('A category with this slug already exists');
    }

    const newCategory = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        icon: data.icon,
        color: data.color || '#3B82F6',
        textColor: data.textColor || '#FFFFFF',
        isActive: data.isActive ?? true,
        displayOrder: data.displayOrder || 0,
      },
      include: {
        _count: {
        select: {
          subcategories: true,
            requests: true,
          },
        },
      },
    });

    // USA IL RESPONSE FORMATTER!
    return formatCategory(newCategory);
  }

  async updateCategory(id: string, data: any) {
    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      return null;
    }

    // If updating slug, check for conflicts
    if (data.slug && data.slug !== existing.slug) {
      const conflicting = await prisma.category.findFirst({
        where: {
          slug: data.slug,
          NOT: {
            id,
          },
        },
      });

      if (conflicting) {
        throw new Error('A category with this slug already exists');
      }
    }

    const updatedCategory = await prisma.category.update({
      where: {
        id,
      },
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
          subcategories: true,
            requests: true,
          },
        },
      },
    });

    // USA IL RESPONSE FORMATTER!
    return formatCategory(updatedCategory);
  }

  async deleteCategory(id: string) {
    // Check if category exists and has no subcategories or requests
    const category = await this.getCategoryById(id);
    
    if (!category) {
      return false;
    }

    if (category._count && category._count.subcategories > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    if (category._count && category._count.assistanceRequests > 0) {
      throw new Error('Cannot delete category with active requests');
    }

    await prisma.category.delete({
      where: {
        id,
      },
    });

    return true;
  }
}

export const categoryService = new CategoryService();