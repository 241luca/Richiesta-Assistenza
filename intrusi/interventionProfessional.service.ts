import { AppError } from '../utils/errors';

class InterventionProfessionalService {
  // ========== TEMPLATE PERSONALIZZATI ==========
  
  async getProfessionalTemplates(professionalId: string) {
    try {
      // Mock data template personalizzati
      const templates = [
        {
          id: '1',
          professionalId,
          baseTemplateId: '1',
          name: 'Il mio template idraulica',
          description: 'Template personalizzato per interventi idraulici',
          isDefault: true,
          customSettings: {
            showClientSignature: true,
            includePhotos: true,
            autoCalculateTotals: true
          },
          customFields: [
            {
              code: 'custom_warranty',
              label: 'Garanzia',
              type: 'text',
              defaultValue: '12 mesi'
            }
          ],
          customLayout: null,
          isActive: true,
          usageCount: 15,
          lastUsedAt: new Date('2024-12-20'),
          createdAt: new Date('2024-06-01')
        }
      ];
      
      return templates.filter(t => t.professionalId === professionalId);
    } catch (error) {
      console.error('Errore recupero template professionista:', error);
      throw error;
    }
  }
  
  async createProfessionalTemplate(professionalId: string, data: any) {
    try {
      const template = {
        id: Date.now().toString(),
        professionalId,
        ...data,
        usageCount: 0,
        isActive: true,
        createdAt: new Date()
      };
      
      console.log('Template personalizzato creato:', template);
      return template;
    } catch (error) {
      console.error('Errore creazione template personalizzato:', error);
      throw error;
    }
  }
  
  // ========== FRASI RICORRENTI ==========
  
  async getProfessionalPhrases(professionalId: string, category?: string, search?: string) {
    try {
      // Mock data frasi ricorrenti
      const phrases = [
        {
          id: '1',
          professionalId,
          Category: 'problema',
          code: 'PERD_RUB',
          title: 'Perdita rubinetto',
          content: 'Riscontrata perdita dal corpo del rubinetto dovuta a usura delle guarnizioni interne.',
          tags: ['idraulica', 'rubinetto', 'perdita'],
          usageCount: 23,
          lastUsedAt: new Date('2024-12-28'),
          isActive: true,
          isFavorite: true,
          createdAt: new Date('2024-01-01')
        },
        {
          id: '2',
          professionalId,
          Category: 'soluzione',
          code: 'SOST_GUARN',
          title: 'Sostituzione guarnizioni',
          content: 'Effettuata sostituzione completa delle guarnizioni con materiali certificati di prima qualità.',
          tags: ['idraulica', 'riparazione', 'guarnizioni'],
          usageCount: 18,
          lastUsedAt: new Date('2024-12-27'),
          isActive: true,
          isFavorite: true,
          createdAt: new Date('2024-01-01')
        },
        {
          id: '3',
          professionalId,
          Category: 'raccomandazione',
          code: 'MANUT_PREV',
          title: 'Manutenzione preventiva',
          content: 'Si raccomanda di effettuare controlli periodici ogni 6 mesi per prevenire future problematiche.',
          tags: ['manutenzione', 'prevenzione'],
          usageCount: 45,
          lastUsedAt: new Date('2024-12-29'),
          isActive: true,
          isFavorite: false,
          createdAt: new Date('2024-01-01')
        },
        {
          id: '4',
          professionalId,
          Category: 'note',
          code: 'GARANZIA',
          title: 'Garanzia intervento',
          content: 'L\'intervento è coperto da garanzia di 12 mesi su parti e manodopera.',
          tags: ['garanzia', 'termini'],
          usageCount: 67,
          lastUsedAt: new Date('2024-12-30'),
          isActive: true,
          isFavorite: true,
          createdAt: new Date('2024-01-01')
        }
      ];
      
      let result = phrases.filter(p => p.professionalId === professionalId);
      
      if (category && category !== 'all' && category !== 'favorites') {
        result = result.filter(p => p.category === category);
      }
      
      if (category === 'favorites') {
        result = result.filter(p => p.isFavorite);
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        result = result.filter(p => 
          p.title.toLowerCase().includes(searchLower) ||
          p.content.toLowerCase().includes(searchLower) ||
          p.tags.some(t => t.toLowerCase().includes(searchLower))
        );
      }
      
      return result;
    } catch (error) {
      console.error('Errore recupero frasi professionista:', error);
      throw error;
    }
  }
  
  async createProfessionalPhrase(professionalId: string, data: any) {
    try {
      if (!data.title || !data.content || !data.category) {
        throw new AppError('Dati frase incompleti', 400);
      }
      
      const phrase = {
        id: Date.now().toString(),
        professionalId,
        ...data,
        code: data.code || data.title.substring(0, 10).toUpperCase().replace(/\s/g, '_'),
        tags: data.tags || [],
        usageCount: 0,
        isActive: true,
        isFavorite: false,
        createdAt: new Date()
      };
      
      console.log('Frase ricorrente creata:', phrase);
      return phrase;
    } catch (error) {
      console.error('Errore creazione frase ricorrente:', error);
      throw error;
    }
  }
  
  async updateProfessionalPhrase(professionalId: string, phraseId: string, data: any) {
    try {
      // Simulazione aggiornamento
      const updatedPhrase = {
        id: phraseId,
        professionalId,
        ...data,
        updatedAt: new Date()
      };
      
      console.log('Frase aggiornata:', updatedPhrase);
      return updatedPhrase;
    } catch (error) {
      console.error('Errore aggiornamento frase:', error);
      throw error;
    }
  }
  
  async deleteProfessionalPhrase(professionalId: string, phraseId: string) {
    try {
      console.log('Frase eliminata:', { professionalId, phraseId });
      return true;
    } catch (error) {
      console.error('Errore eliminazione frase:', error);
      throw error;
    }
  }
  
  async togglePhraseFavorite(professionalId: string, phraseId: string, isFavorite: boolean) {
    try {
      const phrase = {
        id: phraseId,
        professionalId,
        isFavorite,
        updatedAt: new Date()
      };
      
      console.log('Preferito aggiornato:', phrase);
      return phrase;
    } catch (error) {
      console.error('Errore toggle preferito:', error);
      throw error;
    }
  }
  
  // ========== MATERIALI PERSONALIZZATI ==========
  
  async getProfessionalMaterials(professionalId: string, category?: string, search?: string) {
    try {
      // Mock data materiali personalizzati
      const materials = [
        {
          id: '1',
          professionalId,
          code: 'TUB001',
          name: 'Tubo PVC 32mm',
          description: 'Tubo in PVC rigido per scarichi',
          Category: 'Tubazioni',
          unit: 'm',
          price: 4.50,
          isActive: true,
          usageCount: 34,
          lastUsedAt: new Date('2024-12-28'),
          createdAt: new Date('2024-01-01')
        },
        {
          id: '2',
          professionalId,
          code: 'GUARN001',
          name: 'Guarnizione universale',
          description: 'Guarnizione in gomma universale per rubinetteria',
          Category: 'Guarnizioni',
          unit: 'pz',
          price: 0.50,
          isActive: true,
          usageCount: 89,
          lastUsedAt: new Date('2024-12-30'),
          createdAt: new Date('2024-01-01')
        },
        {
          id: '3',
          professionalId,
          code: 'RACC001',
          name: 'Raccordo a T 32mm',
          description: 'Raccordo a T in PVC per tubazioni 32mm',
          Category: 'Raccordi',
          unit: 'pz',
          price: 2.80,
          isActive: true,
          usageCount: 23,
          lastUsedAt: new Date('2024-12-27'),
          createdAt: new Date('2024-01-01')
        },
        {
          id: '4',
          professionalId,
          code: 'COLLA001',
          name: 'Colla PVC',
          description: 'Colla specifica per tubazioni PVC',
          Category: 'Consumabili',
          unit: 'pz',
          price: 8.50,
          isActive: false,
          usageCount: 12,
          lastUsedAt: new Date('2024-12-15'),
          createdAt: new Date('2024-01-01')
        }
      ];
      
      let result = materials.filter(m => m.professionalId === professionalId);
      
      if (category && category !== 'all') {
        result = result.filter(m => m.category === category);
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        result = result.filter(m => 
          m.name.toLowerCase().includes(searchLower) ||
          m.description?.toLowerCase().includes(searchLower) ||
          m.code.toLowerCase().includes(searchLower)
        );
      }
      
      return result;
    } catch (error) {
      console.error('Errore recupero materiali professionista:', error);
      throw error;
    }
  }
  
  async getMaterialCategories(professionalId: string) {
    try {
      // Mock categorie materiali
      return ['Tubazioni', 'Guarnizioni', 'Raccordi', 'Consumabili', 'Elettrico', 'Sanitari'];
    } catch (error) {
      console.error('Errore recupero categorie materiali:', error);
      throw error;
    }
  }
  
  async createProfessionalMaterial(professionalId: string, data: any) {
    try {
      if (!data.code || !data.name || !data.category || !data.unit || data.price === undefined) {
        throw new AppError('Dati materiale incompleti', 400);
      }
      
      const material = {
        id: Date.now().toString(),
        professionalId,
        ...data,
        usageCount: 0,
        isActive: true,
        createdAt: new Date()
      };
      
      console.log('Materiale personalizzato creato:', material);
      return material;
    } catch (error) {
      console.error('Errore creazione materiale personalizzato:', error);
      throw error;
    }
  }
  
  async updateProfessionalMaterial(professionalId: string, materialId: string, data: any) {
    try {
      const updatedMaterial = {
        id: materialId,
        professionalId,
        ...data,
        updatedAt: new Date()
      };
      
      console.log('Materiale aggiornato:', updatedMaterial);
      return updatedMaterial;
    } catch (error) {
      console.error('Errore aggiornamento materiale:', error);
      throw error;
    }
  }
  
  async toggleMaterialActive(professionalId: string, materialId: string, isActive: boolean) {
    try {
      const material = {
        id: materialId,
        professionalId,
        isActive,
        updatedAt: new Date()
      };
      
      console.log('Stato materiale aggiornato:', material);
      return material;
    } catch (error) {
      console.error('Errore toggle stato materiale:', error);
      throw error;
    }
  }
  
  async deleteProfessionalMaterial(professionalId: string, materialId: string) {
    try {
      console.log('Materiale eliminato:', { professionalId, materialId });
      return true;
    } catch (error) {
      console.error('Errore eliminazione materiale:', error);
      throw error;
    }
  }
  
  // ========== IMPOSTAZIONI ==========
  
  async getProfessionalSettings(professionalId: string) {
    try {
      // Mock data impostazioni
      const settings = {
        id: '1',
        professionalId,
        
        // Preferenze generali
        defaultTemplateId: null,
        defaultLanguage: 'it',
        autoStartTimer: true,
        autoGpsLocation: false,
        autoWeather: false,
        
        // Dati aziendali
        businessName: '',
        vatNumber: '',
        fiscalCode: '',
        reaNumber: '',
        businessAddress: '',
        businessPhone: '',
        businessEmail: '',
        businessWebsite: '',
        
        // Firma
        signatureImage: null,
        signatureName: '',
        signatureTitle: '',
        
        // Notifiche
        notifyNewReport: true,
        notifyClientSignature: true,
        notifyReportExpiring: false,
        
        // PDF
        pdfShowLogo: true,
        pdfShowFooter: true,
        pdfShowPageNumbers: true,
        pdfFooterText: '',
        
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-12-01')
      };
      
      return settings;
    } catch (error) {
      console.error('Errore recupero impostazioni professionista:', error);
      throw error;
    }
  }
  
  async updateProfessionalSettings(professionalId: string, data: any) {
    try {
      const settings = {
        professionalId,
        ...data,
        updatedAt: new Date()
      };
      
      console.log('Impostazioni aggiornate:', settings);
      return settings;
    } catch (error) {
      console.error('Errore aggiornamento impostazioni:', error);
      throw error;
    }
  }
  
  // ========== CARTELLE ==========
  
  async getProfessionalFolders(professionalId: string) {
    try {
      // Mock data cartelle
      const folders = [
        {
          id: '1',
          professionalId,
          name: 'Clienti Importanti',
          description: 'Rapporti per clienti prioritari',
          color: '#3B82F6',
          reportCount: 15,
          isDefault: false,
          createdAt: new Date('2024-06-01')
        },
        {
          id: '2',
          professionalId,
          name: 'In Garanzia',
          description: 'Interventi ancora in garanzia',
          color: '#10B981',
          reportCount: 8,
          isDefault: false,
          createdAt: new Date('2024-06-01')
        }
      ];
      
      return folders.filter(f => f.professionalId === professionalId);
    } catch (error) {
      console.error('Errore recupero cartelle professionista:', error);
      throw error;
    }
  }
  
  async createProfessionalFolder(professionalId: string, data: any) {
    try {
      if (!data.name) {
        throw new AppError('Nome cartella obbligatorio', 400);
      }
      
      const folder = {
        id: Date.now().toString(),
        professionalId,
        ...data,
        reportCount: 0,
        isDefault: false,
        createdAt: new Date()
      };
      
      console.log('Cartella creata:', folder);
      return folder;
    } catch (error) {
      console.error('Errore creazione cartella:', error);
      throw error;
    }
  }
  
  // ========== STATISTICHE ==========
  
  async getProfessionalStatistics(professionalId: string, range: string = 'month') {
    try {
      // Mock data statistiche
      const stats = {
        // Rapporti
        totalReports: range === 'month' ? 24 : 3,
        completedReports: range === 'month' ? 20 : 2,
        draftReports: range === 'month' ? 4 : 1,
        
        // Ore lavorate
        totalHours: range === 'month' ? 156 : 12,
        avgHoursPerReport: range === 'month' ? 6.5 : 4,
        
        // Materiali
        materialsTotal: range === 'month' ? 1250.50 : 145.80,
        uniqueMaterials: range === 'month' ? 32 : 8,
        
        // Firme
        signedReports: range === 'month' ? 18 : 2,
        signatureRate: range === 'month' ? 75 : 67
      };
      
      return stats;
    } catch (error) {
      console.error('Errore calcolo statistiche professionista:', error);
      throw error;
    }
  }
  
  async getRecentReports(professionalId: string, limit: number = 10) {
    try {
      // Mock data rapporti recenti
      const reports = [
        {
          id: '1',
          reportNumber: 'RAP-2024-001',
          professionalId,
          Client: {
            id: '1',
            fullName: 'Mario Rossi'
          },
          status: 'completed',
          createdAt: new Date('2024-12-30')
        },
        {
          id: '2',
          reportNumber: 'RAP-2024-002',
          professionalId,
          Client: {
            id: '2',
            fullName: 'Luigi Bianchi'
          },
          status: 'draft',
          createdAt: new Date('2024-12-29')
        },
        {
          id: '3',
          reportNumber: 'RAP-2024-003',
          professionalId,
          Client: {
            id: '3',
            fullName: 'Giuseppe Verdi'
          },
          status: 'completed',
          createdAt: new Date('2024-12-28')
        }
      ];
      
      return reports.slice(0, limit);
    } catch (error) {
      console.error('Errore recupero rapporti recenti:', error);
      throw error;
    }
  }
}

export default new InterventionProfessionalService();
