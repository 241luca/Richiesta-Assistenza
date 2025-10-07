import { PrismaClient } from '@prisma/client';
import { generateSlug } from '../utils/slug';
import { 
  formatSubcategory, 
  formatSubcategoryList,
  formatProfessionalSubcategory,
  formatProfessionalSubcategoryList,
  formatAiSettings 
} from '../utils/responseFormatter';

const prisma = new PrismaClient();

interface SubcategoryFilters {
  categoryId?: string;
  isActive?: boolean;
}

interface CreateSubcategoryData {
  name: string;
  slug?: string;
  description?: string;
  categoryId: string;
  requirements?: string;
  color?: string;
  textColor?: string;
  isActive?: boolean;
  displayOrder?: number;
  metadata?: any;
}

interface UpdateSubcategoryData {
  name?: string;
  slug?: string;
  description?: string;
  requirements?: string;
  color?: string;
  textColor?: string;
  isActive?: boolean;
  displayOrder?: number;
  metadata?: any;
}

interface AiSettingsData {
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  systemPrompt?: string;
  knowledgeBasePrompt?: string;
  responseStyle?: 'FORMAL' | 'INFORMAL' | 'TECHNICAL' | 'EDUCATIONAL';
  detailLevel?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  includeDiagrams?: boolean;
  includeReferences?: boolean;
  useKnowledgeBase?: boolean;
  knowledgeBaseIds?: any;
  isActive?: boolean;
  metadata?: any;
}

class SubcategoryService {
  async getSubcategories(
    filters: SubcategoryFilters = {},
    includeAiSettings = false
  ) {
    const where: any = {};

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const subcategories = await prisma.subcategory.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        aiSettings: includeAiSettings,
        _count: {
          select: {
            professionalUserSubcategories: {
              where: {
                isActive: true,
                user: {  // Maiuscolo!
                  role: 'PROFESSIONAL'
                }
              }
            },
            requests: true,
          },
        },
        // Aggiungiamo anche la lista dei professionisti attivi per debug
        professionalUserSubcategories: {
          where: {
            isActive: true,
            user: {  // Maiuscolo!
              role: 'PROFESSIONAL'
            }
          },
          select: {
            userId: true,
            isActive: true
          }
        },
      },
      orderBy: [
        { name: 'asc' },
      ],
    });

    // USA IL RESPONSE FORMATTER!
    return formatSubcategoryList(subcategories);
  }

  async getSubcategoryById(subcategoryId: string) {
    const subcategory = await prisma.subcategory.findUnique({
      where: {
        id: subcategoryId,
      },
      include: {
      category: true,
        aiSettings: true,
        _count: {
          select: {
            professionalUserSubcategories: true,
            requests: true,
          },
        },
      },
    });

    if (!subcategory) {
      return null;
    }

    // USA IL RESPONSE FORMATTER!
    return formatSubcategory(subcategory);
  }

  async createSubcategory(data: CreateSubcategoryData) {
    // Verify category exists
    const category = await prisma.category.findUnique({
      where: {
        id: data.categoryId,
      },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Generate slug if not provided
    const slug = data.slug || generateSlug(data.name);

    // Check if slug already exists for this category
    const existingSubcat = await prisma.subcategory.findFirst({
      where: {
        slug,
        categoryId: data.categoryId,
      },
    });

    if (existingSubcat) {
      throw new Error('A subcategory with this slug already exists in this category');
    }

    const newSubcategory = await prisma.subcategory.create({
      data: {
        ...data,
        slug,
      } as any, // TypeScript: id e updatedAt sono auto-generati
      include: {
      category: true,
      },
    });

    // USA IL RESPONSE FORMATTER!
    return formatSubcategory(newSubcategory);
  }

  async updateSubcategory(
    subcategoryId: string,
    data: UpdateSubcategoryData
  ) {
    // Verify subcategory exists
    const subcategory = await prisma.subcategory.findUnique({
      where: {
        id: subcategoryId,
      },
    });

    if (!subcategory) {
      return null;
    }

    // If updating slug, check uniqueness
    if (data.slug && data.slug !== subcategory.slug) {
      const existingSubcat = await prisma.subcategory.findFirst({
        where: {
          slug: data.slug,
          categoryId: subcategory.categoryId,
          id: { not: subcategoryId },
        },
      });

      if (existingSubcat) {
        throw new Error('A subcategory with this slug already exists in this category');
      }
    }

    const updatedSubcategory = await prisma.subcategory.update({
      where: { id: subcategoryId },
      data,
      include: {
      category: true,
        aiSettings: true,
      },
    });

    // USA IL RESPONSE FORMATTER!
    return formatSubcategory(updatedSubcategory);
  }

  async deleteSubcategory(subcategoryId: string) {
    // Verify subcategory exists
    const subcategory = await prisma.subcategory.findUnique({
      where: {
        id: subcategoryId,
      },
    });

    if (!subcategory) {
      return false;
    }

    // Check if subcategory has active requests
    const activeRequests = await prisma.assistanceRequest.count({
      where: {
        subcategoryId,
        status: {
          in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'],
        },
      },
    });

    if (activeRequests > 0) {
      throw new Error(`Cannot delete subcategory with ${activeRequests} active requests`);
    }

    await prisma.subcategory.delete({
      where: { id: subcategoryId },
    });

    return true;
  }

  async getSubcategoryProfessionals(subcategoryId: string) {
    // Verify subcategory exists
    const subcategory = await prisma.subcategory.findUnique({
      where: {
        id: subcategoryId,
      },
    });

    if (!subcategory) {
      throw new Error('Subcategory not found');
    }

    const professionals = await prisma.professionalUserSubcategory.findMany({
      where: {
        subcategoryId,
        isActive: true,
      },
      include: {
        user: {  // Maiuscolo!
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            email: true,
            phone: true,
            professionData: true,
            hourlyRate: true,
            avatar: true,
            city: true,
            province: true,
          },
        },
      },
      orderBy: [
        { experienceYears: 'desc' },
      ],
    });

    // Restituisci nel formato corretto per il frontend
    return {
      professionals: formatProfessionalSubcategoryList(professionals)
    };
  }

  async updateAiSettings(
    subcategoryId: string,
    data: AiSettingsData
  ) {
    // Use uuid v4 to generate ID
    const { v4: uuidv4 } = require('uuid');
    
    // Verify subcategory exists
    const subcategory = await prisma.subcategory.findUnique({
      where: {
        id: subcategoryId,
      },
    });

    if (!subcategory) {
      throw new Error('Subcategory not found');
    }

    // Check if AI settings already exist
    const existingSettings = await prisma.subcategoryAiSettings.findUnique({
      where: { subcategoryId },
    });

    let aiSettings;
    
    if (existingSettings) {
      // Update existing settings
      aiSettings = await prisma.subcategoryAiSettings.update({
        where: { subcategoryId },
        data,
      });
    } else {
      // Create new settings - NEED TO PROVIDE ID
      aiSettings = await prisma.subcategoryAiSettings.create({
        data: {
          id: uuidv4(), // Generate UUID for ID
          subcategoryId,
          ...data,
          systemPrompt: data.systemPrompt || `Sei un assistente esperto specializzato in ${subcategory.name}. Fornisci risposte professionali e dettagliate.`,
        } as any, // TypeScript: updatedAt è auto-generato
      });
    }

    // USA IL RESPONSE FORMATTER!
    return formatAiSettings(aiSettings);
  }

  async assignProfessionalToSubcategory(
    userId: string,
    subcategoryId: string,
    data: {
      experienceYears?: number;
      skillLevel?: string;
      certifications?: any;
      portfolio?: any;
    }
  ) {
    // Check if already assigned
    const existing = await prisma.professionalUserSubcategory.findUnique({
      where: {
        userId_subcategoryId: {
          userId,
          subcategoryId,
        },
      },
    });

    let assignment;
    
    if (existing) {
      // Update existing assignment
      assignment = await prisma.professionalUserSubcategory.update({
        where: {
          userId_subcategoryId: {
            userId,
            subcategoryId,
          },
        },
        data: {
          ...data,
          isActive: true,
        },
        include: {
          user: true,
          subcategory: {
            include: {
      category: true,
            },
          },
        },
      });
    } else {
      // Create new assignment
      assignment = await prisma.professionalUserSubcategory.create({
        data: {
          userId,
          subcategoryId,
          ...data,
          isActive: true,
        } as any, // TypeScript: id e updatedAt sono auto-generati
        include: {
          user: true,
          subcategory: {
            include: {
      category: true,
            },
          },
        },
      });
    }

    // USA IL RESPONSE FORMATTER!
    return formatProfessionalSubcategory(assignment);
  }

  async removeProfessionalFromSubcategory(userId: string, subcategoryId: string) {
    const updated = await prisma.professionalUserSubcategory.update({
      where: {
        userId_subcategoryId: {
          userId,
          subcategoryId,
        },
      },
      data: {
        isActive: false,
      },
      include: {
        user: true,
        subcategory: true,
      },
    });

    // USA IL RESPONSE FORMATTER!
    return formatProfessionalSubcategory(updated);
  }

  async getProfessionalSubcategories(userId: string) {
    const assignments = await prisma.professionalUserSubcategory.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
      subcategory: {
          include: {
      category: true,
          },
        },
      },
    });

    // USA IL RESPONSE FORMATTER!
    return formatProfessionalSubcategoryList(assignments);
  }
}

export const subcategoryService = new SubcategoryService();