import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

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
      const sections = await prisma.footerSection.findMany({
        where: { isVisible: true },
        orderBy: { order: 'asc' }
      });

      const links = await prisma.footerLink.findMany({
        where: { isActive: true },
        orderBy: [
          { section: 'asc' },
          { order: 'asc' }
        ]
      });

      // Raggruppa i link per sezione
      const grouped = sections.map(section => ({
        ...section,
        links: links.filter(link => link.section === section.key)
      }));

      return grouped;
    } catch (error) {
      logger.error('Error getting footer data:', error);
      throw new Error('Failed to fetch footer data');
    }
  }

  /**
   * Get footer links by section
   */
  async getLinksBySection(section: string) {
    try {
      const links = await prisma.footerLink.findMany({
        where: {
          section,
          isActive: true
        },
        orderBy: { order: 'asc' }
      });
      return links;
    } catch (error) {
      logger.error(`Error getting links for section '${section}':`, error);
      throw error;
    }
  }

  /**
   * Create or update footer link
   */
  async upsertLink(data: FooterLinkData) {
    try {
      const link = await prisma.footerLink.create({
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
    } catch (error) {
      logger.error('Error creating footer link:', error);
      throw error;
    }
  }

  /**
   * Update footer link
   */
  async updateLink(id: string, data: Partial<FooterLinkData>) {
    try {
      const link = await prisma.footerLink.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });

      logger.info(`Footer link '${id}' updated successfully`);
      return link;
    } catch (error) {
      logger.error(`Error updating footer link '${id}':`, error);
      throw error;
    }
  }

  /**
   * Delete footer link
   */
  async deleteLink(id: string) {
    try {
      await prisma.footerLink.delete({
        where: { id }
      });

      logger.info(`Footer link '${id}' deleted successfully`);
    } catch (error) {
      logger.error(`Error deleting footer link '${id}':`, error);
      throw error;
    }
  }

  /**
   * Create or update footer section
   */
  async upsertSection(data: FooterSectionData) {
    try {
      const section = await prisma.footerSection.upsert({
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
    } catch (error) {
      logger.error('Error saving footer section:', error);
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
      const existingLinks = await prisma.footerLink.count();
      
      if (existingLinks === 0) {
        // Inserisci i link predefiniti solo se non esistono
        for (const link of defaultLinks) {
          await this.upsertLink(link);
        }
        logger.info('Default footer links initialized');
      }

      return true;
    } catch (error) {
      logger.error('Error initializing default footer data:', error);
      throw error;
    }
  }
}

export const footerService = new FooterService();
