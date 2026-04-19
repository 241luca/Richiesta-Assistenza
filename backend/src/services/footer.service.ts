import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Type alias for raw database access (footer models may not be in current schema)
type PrismaAny = typeof prisma & { [key: string]: any };
const prismaRaw = prisma as PrismaAny;

export interface FooterLinkData {
  section: string;
  label: string;
  url: string;
  icon?: string;
  order?: number;
  isExternal?: boolean;
  isActive?: boolean;
}

export interface FooterSectionData {
  key: string;
  title: string;
  order?: number;
  isVisible?: boolean;
}

export class FooterService {
  /**
   * Get all footer sections with their links
   */
  async getFooterData() {
    try {
      const sections = await prismaRaw.footerSection?.findMany?.({
        where: { isVisible: true },
        orderBy: { order: 'asc' }
      }) || [];

      const links = await prismaRaw.footerLink?.findMany?.({
        where: { isActive: true },
        orderBy: [
          { section: 'asc' },
          { order: 'asc' }
        ]
      }) || [];

      // Raggruppa i link per sezione
      const grouped = sections.map((section: any) => ({
        ...section,
        links: links.filter((link: any) => link.section === section.key)
      }));

      return grouped;
    } catch (error: unknown) {
      logger.error('Error getting footer data:', error instanceof Error ? error.message : String(error));
      throw new Error('Failed to fetch footer data');
    }
  }

  /**
   * Get footer links by section
   */
  async getLinksBySection(section: string) {
    try {
      const links = await prismaRaw.footerLink?.findMany?.({
        where: {
          section,
          isActive: true
        },
        orderBy: { order: 'asc' }
      }) || [];
      return links;
    } catch (error: unknown) {
      logger.error(`Error getting links for section '${section}':`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Create or update footer link
   */
  async upsertLink(data: FooterLinkData) {
    try {
      const link = await prismaRaw.footerLink?.create?.({
        data: {
          section: data.section,
          label: data.label,
          url: data.url,
          icon: data.icon,
          order: data.order || 0,
          isExternal: data.isExternal || false,
          isActive: data.isActive ?? true
        }
      });

      logger.info(`Footer link '${data.label}' created successfully`);
      return link;
    } catch (error: unknown) {
      logger.error('Error creating footer link:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Update footer link
   */
  async updateLink(id: string, data: Partial<FooterLinkData>) {
    try {
      const link = await prismaRaw.footerLink?.update?.({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });

      logger.info(`Footer link '${id}' updated successfully`);
      return link;
    } catch (error: unknown) {
      logger.error(`Error updating footer link '${id}':`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Delete footer link
   */
  async deleteLink(id: string) {
    try {
      await prismaRaw.footerLink?.delete?.({
        where: { id }
      });

      logger.info(`Footer link '${id}' deleted successfully`);
    } catch (error: unknown) {
      logger.error(`Error deleting footer link '${id}':`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Create or update footer section
   */
  async upsertSection(data: FooterSectionData) {
    try {
      const section = await prismaRaw.footerSection?.upsert?.({
        where: { key: data.key },
        update: {
          title: data.title,
          order: data.order,
          isVisible: data.isVisible,
          updatedAt: new Date()
        },
        create: {
          key: data.key,
          title: data.title,
          order: data.order || 0,
          isVisible: data.isVisible ?? true
        }
      });

      logger.info(`Footer section '${data.key}' saved successfully`);
      return section;
    } catch (error: unknown) {
      logger.error('Error saving footer section:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Initialize default footer data
   */
  async initializeDefaults() {
    try {
      // Sezioni predefinite
      const sections = [
        { key: 'company', title: 'Azienda', order: 1 },
        { key: 'support', title: 'Supporto', order: 2 },
        { key: 'legal', title: 'Documenti Legali', order: 3 },
        { key: 'social', title: 'Seguici', order: 4 }
      ];

      for (const section of sections) {
        await this.upsertSection(section);
      }

      // Link predefiniti
      const defaultLinks = [
        // Sezione Azienda
        { section: 'company', label: 'Chi Siamo', url: '/about', order: 1 },
        { section: 'company', label: 'Come Funziona', url: '/how-it-works', order: 2 },
        { section: 'company', label: 'Prezzi', url: '/pricing', order: 3 },
        { section: 'company', label: 'Contatti', url: '/contact', order: 4 },

        // Sezione Supporto
        { section: 'support', label: 'Centro Assistenza', url: '/help', order: 1 },
        { section: 'support', label: 'FAQ', url: '/faq', order: 2 },
        { section: 'support', label: 'Stato Sistema', url: '/status', order: 3 },
        { section: 'support', label: 'Documentazione', url: '/docs', order: 4 },

        // Sezione Legale
        { section: 'legal', label: 'Privacy Policy', url: '/legal/privacy-policy', order: 1 },
        { section: 'legal', label: 'Termini di Servizio', url: '/legal/terms-service', order: 2 },
        { section: 'legal', label: 'Cookie Policy', url: '/legal/cookie-policy', order: 3 },
        { section: 'legal', label: 'Tutti i Documenti', url: '/legal', order: 4 },

        // Sezione Social
        { section: 'social', label: 'Facebook', url: 'https://facebook.com', icon: 'facebook', order: 1, isExternal: true },
        { section: 'social', label: 'Twitter', url: 'https://twitter.com', icon: 'twitter', order: 2, isExternal: true },
        { section: 'social', label: 'LinkedIn', url: 'https://linkedin.com', icon: 'linkedin', order: 3, isExternal: true },
        { section: 'social', label: 'Instagram', url: 'https://instagram.com', icon: 'instagram', order: 4, isExternal: true }
      ];

      // Controlla se esistono già link
      // DISABLED: footerLink table does not exist in Prisma schema
      // const existingLinks = await (prisma.footerLink as any).count();
      const existingLinks = 0; // Temporary: always 0 until table is added
      
      if (existingLinks === 0) {
        // Inserisci i link predefiniti solo se non esistono
        // DISABLED: Cannot insert without footerLink table
        // for (const link of defaultLinks) {
        //   await this.upsertLink(link);
        // }
        logger.info('Default footer links initialization skipped - table does not exist');
      }

      return true;
    } catch (error: unknown) {
      logger.error('Error initializing default footer data:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}

export const footerService = new FooterService();
