import { PrismaClient } from '@prisma/client';
import { ResponseFormatter } from '../utils/responseFormatter';

const prisma = new PrismaClient();

class ProfessionalPhrasesService {
  // Ottieni tutte le frasi del professionista
  async getAllByProfessional(professionalId: string) {
    try {
      const phrases = await prisma.professionalReportPhrase.findMany({
        where: {
          professionalId,
          isActive: true
        },
        orderBy: [
          { isFavorite: 'desc' },
          { usageCount: 'desc' },
          { createdAt: 'desc' }
        ]
      });
      
      return phrases;
    } catch (error) {
      console.error('Error fetching professional phrases:', error);
      throw error;
    }
  }

  // Ottieni singola frase
  async getById(id: number, professionalId: string) {
    try {
      const phrase = await prisma.professionalReportPhrase.findFirst({
        where: {
          id,
          professionalId
        }
      });
      
      if (!phrase) {
        throw new Error('Frase non trovata');
      }
      
      return phrase;
    } catch (error) {
      console.error('Error fetching phrase:', error);
      throw error;
    }
  }

  // Crea nuova frase
  async create(data: {
    professionalId: string;
    Category: 'problem' | 'solution' | 'recommendation' | 'note';
    code: string;
    title: string;
    content: string;
    isFavorite?: boolean;
  }) {
    try {
      // Genera codice automatico se non fornito
      if (!data.code) {
        const count = await prisma.professionalReportPhrase.count({
          where: { professionalId: data.professionalId }
        });
        data.code = `${data.category.toUpperCase()}_${count + 1}`;
      }

      const phrase = await prisma.professionalReportPhrase.create({
        data
      });
      
      return phrase;
    } catch (error) {
      console.error('Error creating phrase:', error);
      throw error;
    }
  }

  // Aggiorna frase
  async update(id: number, professionalId: string, data: any) {
    try {
      // Verifica che la frase appartenga al professionista
      const existing = await this.getById(id, professionalId);
      
      const phrase = await prisma.professionalReportPhrase.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });
      
      return phrase;
    } catch (error) {
      console.error('Error updating phrase:', error);
      throw error;
    }
  }

  // Elimina frase (soft delete)
  async delete(id: number, professionalId: string) {
    try {
      // Verifica che la frase appartenga al professionista
      await this.getById(id, professionalId);
      
      const phrase = await prisma.professionalReportPhrase.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });
      
      return phrase;
    } catch (error) {
      console.error('Error deleting phrase:', error);
      throw error;
    }
  }

  // Toggle preferito
  async toggleFavorite(id: number, professionalId: string) {
    try {
      const phrase = await this.getById(id, professionalId);
      
      const updated = await prisma.professionalReportPhrase.update({
        where: { id },
        data: {
          isFavorite: !phrase.isFavorite,
          updatedAt: new Date()
        }
      });
      
      return updated;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  // Incrementa contatore utilizzo
  async incrementUsage(id: number) {
    try {
      const phrase = await prisma.professionalReportPhrase.update({
        where: { id },
        data: {
          usageCount: {
            increment: 1
          }
        }
      });
      
      return phrase;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      throw error;
    }
  }

  // Cerca frasi
  async search(professionalId: string, query: string) {
    try {
      const phrases = await prisma.professionalReportPhrase.findMany({
        where: {
          professionalId,
          isActive: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
            { code: { contains: query, mode: 'insensitive' } }
          ]
        },
        orderBy: [
          { isFavorite: 'desc' },
          { usageCount: 'desc' }
        ]
      });
      
      return phrases;
    } catch (error) {
      console.error('Error searching phrases:', error);
      throw error;
    }
  }

  // Ottieni frasi per categoria
  async getByCategory(professionalId: string, Category: string) {
    try {
      const phrases = await prisma.professionalReportPhrase.findMany({
        where: {
          professionalId,
          Category: category as any,
          isActive: true
        },
        orderBy: [
          { isFavorite: 'desc' },
          { usageCount: 'desc' }
        ]
      });
      
      return phrases;
    } catch (error) {
      console.error('Error fetching phrases by Category:', error);
      throw error;
    }
  }

  // Importa frasi da CSV
  async importFromCSV(professionalId: string, phrases: any[]) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        const created = [];
        
        for (const phraseData of phrases) {
          const phrase = await tx.professionalPhrase.create({
            data: {
              professionalId,
              Category: phraseData.category || 'note',
              code: phraseData.code || `IMP_${Date.now()}`,
              title: phraseData.title,
              content: phraseData.content,
              isFavorite: false,
              isActive: true
            }
          });
          created.push(phrase);
        }
        
        return created;
      });
      
      return results;
    } catch (error) {
      console.error('Error importing phrases:', error);
      throw error;
    }
  }

  // Esporta frasi in formato JSON
  async export(professionalId: string) {
    try {
      const phrases = await prisma.professionalReportPhrase.findMany({
        where: {
          professionalId,
          isActive: true
        },
        select: {
          category: true,
          code: true,
          title: true,
          content: true,
          isFavorite: true
        },
        orderBy: [
          { Category: 'asc' },
          { code: 'asc' }
        ]
      });
      
      return phrases;
    } catch (error) {
      console.error('Error exporting phrases:', error);
      throw error;
    }
  }
}

export default new ProfessionalPhrasesService();
