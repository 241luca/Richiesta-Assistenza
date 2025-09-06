import { AppError } from '../utils/errors';

class InterventionMaterialService {
  // ========== MATERIALI DI SISTEMA ==========
  
  async getMaterials(filters?: any) {
    try {
      // Mock data materiali
      const materials = [
        {
          id: '1',
          code: 'TUB001',
          name: 'Tubo rame 15mm',
          description: 'Tubo in rame diametro 15mm',
          Category: 'Idraulica',
          unit: 'm',
          defaultPrice: 8.50,
          vatRate: 22,
          barcode: '8001234567890',
          manufacturer: 'CopperTube SRL',
          manufacturerCode: 'CT-15',
          stockMin: 10,
          stockMax: 100,
          notes: 'Utilizzare per impianti acqua potabile',
          isActive: true,
          isService: false,
          usageCount: 45,
          createdAt: new Date('2024-01-01')
        },
        {
          id: '2',
          code: 'RUB002',
          name: 'Rubinetto miscelatore cucina',
          description: 'Miscelatore monocomando per cucina',
          Category: 'Idraulica',
          unit: 'pz',
          defaultPrice: 85.00,
          vatRate: 22,
          barcode: '8009876543210',
          manufacturer: 'MixTap Italia',
          manufacturerCode: 'MX-KIT-01',
          stockMin: 2,
          stockMax: 20,
          notes: 'Garanzia 5 anni',
          isActive: true,
          isService: false,
          usageCount: 23,
          createdAt: new Date('2024-01-01')
        },
        {
          id: '3',
          code: 'INT003',
          name: 'Interruttore bipolare 16A',
          description: 'Interruttore bipolare 16A da incasso',
          Category: 'Elettrico',
          unit: 'pz',
          defaultPrice: 12.00,
          vatRate: 22,
          barcode: '8005555666777',
          manufacturer: 'ElectroSwitch',
          manufacturerCode: 'ES-BP16',
          stockMin: 5,
          stockMax: 50,
          notes: 'Certificato CE',
          isActive: true,
          isService: false,
          usageCount: 67,
          createdAt: new Date('2024-01-01')
        },
        {
          id: '4',
          code: 'CAV004',
          name: 'Cavo elettrico 2.5mm²',
          description: 'Cavo unipolare 2.5mm² blu',
          Category: 'Elettrico',
          unit: 'm',
          defaultPrice: 1.20,
          vatRate: 22,
          barcode: '8003333444555',
          manufacturer: 'CableTech',
          manufacturerCode: 'CT-25-BLU',
          stockMin: 100,
          stockMax: 1000,
          notes: 'Norma CEI',
          isActive: true,
          isService: false,
          usageCount: 234,
          createdAt: new Date('2024-01-01')
        },
        {
          id: '5',
          code: 'MAN001',
          name: 'Manodopera specializzata',
          description: 'Ore di manodopera tecnico specializzato',
          Category: 'Servizi',
          unit: 'ore',
          defaultPrice: 35.00,
          vatRate: 22,
          barcode: null,
          manufacturer: null,
          manufacturerCode: null,
          stockMin: null,
          stockMax: null,
          notes: 'Tariffa oraria standard',
          isActive: true,
          isService: true,
          usageCount: 567,
          createdAt: new Date('2024-01-01')
        }
      ];
      
      // Applica filtri
      let filtered = materials;
      
      if (filters?.category) {
        filtered = filtered.filter(m => m.category === filters.category);
      }
      
      if (filters?.isActive !== undefined) {
        filtered = filtered.filter(m => m.isActive === filters.isActive);
      }
      
      if (filters?.isService !== undefined) {
        filtered = filtered.filter(m => m.isService === filters.isService);
      }
      
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(m => 
          m.name.toLowerCase().includes(searchLower) ||
          m.code.toLowerCase().includes(searchLower) ||
          m.description?.toLowerCase().includes(searchLower)
        );
      }
      
      return filtered;
    } catch (error) {
      console.error('Errore recupero materiali:', error);
      throw error;
    }
  }
  
  async getMaterialById(id: string) {
    try {
      const materials = await this.getMaterials();
      const material = materials.find(m => m.id === id);
      
      if (!material) {
        throw new AppError('Materiale non trovato', 404);
      }
      
      return material;
    } catch (error) {
      console.error('Errore recupero materiale:', error);
      throw error;
    }
  }
  
  async getMaterialByCode(code: string) {
    try {
      const materials = await this.getMaterials();
      const material = materials.find(m => m.code === code);
      
      if (!material) {
        throw new AppError('Materiale non trovato', 404);
      }
      
      return material;
    } catch (error) {
      console.error('Errore recupero materiale per codice:', error);
      throw error;
    }
  }
  
  async createMaterial(data: any) {
    try {
      // Verifica unicità codice
      const existing = await this.getMaterials();
      if (existing.find(m => m.code === data.code)) {
        throw new AppError('Codice materiale già esistente', 400);
      }
      
      const material = {
        id: Date.now().toString(),
        ...data,
        usageCount: 0,
        createdAt: new Date()
      };
      
      console.log('Materiale creato:', material);
      return material;
    } catch (error) {
      console.error('Errore creazione materiale:', error);
      throw error;
    }
  }
  
  async updateMaterial(id: string, data: any) {
    try {
      const material = await this.getMaterialById(id);
      
      const updated = {
        ...material,
        ...data,
        updatedAt: new Date()
      };
      
      console.log('Materiale aggiornato:', updated);
      return updated;
    } catch (error) {
      console.error('Errore aggiornamento materiale:', error);
      throw error;
    }
  }
  
  async deleteMaterial(id: string) {
    try {
      const material = await this.getMaterialById(id);
      
      // Verifica se è in uso
      if (material.usageCount > 0) {
        throw new AppError('Materiale utilizzato, impossibile eliminare', 400);
      }
      
      console.log('Materiale eliminato:', id);
      return { success: true };
    } catch (error) {
      console.error('Errore eliminazione materiale:', error);
      throw error;
    }
  }
  
  // ========== CATEGORIE MATERIALI ==========
  
  async getMaterialCategories() {
    try {
      const categories = [
        { id: '1', name: 'Idraulica', description: 'Materiali idraulici', color: '#3B82F6' },
        { id: '2', name: 'Elettrico', description: 'Materiali elettrici', color: '#EF4444' },
        { id: '3', name: 'Muratura', description: 'Materiali edili', color: '#10B981' },
        { id: '4', name: 'Servizi', description: 'Servizi e manodopera', color: '#8B5CF6' },
        { id: '5', name: 'Consumabili', description: 'Materiali di consumo', color: '#F59E0B' }
      ];
      
      return categories;
    } catch (error) {
      console.error('Errore recupero categorie:', error);
      throw error;
    }
  }
  
  // ========== RICERCA AVANZATA ==========
  
  async searchMaterials(query: string) {
    try {
      const materials = await this.getMaterials();
      const queryLower = query.toLowerCase();
      
      return materials.filter(m => 
        m.name.toLowerCase().includes(queryLower) ||
        m.code.toLowerCase().includes(queryLower) ||
        m.barcode?.includes(query) ||
        m.manufacturerCode?.toLowerCase().includes(queryLower)
      );
    } catch (error) {
      console.error('Errore ricerca materiali:', error);
      throw error;
    }
  }
  
  async getMostUsedMaterials(limit: number = 10) {
    try {
      const materials = await this.getMaterials();
      
      // Ordina per usage count e prendi i primi N
      return materials
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, limit);
    } catch (error) {
      console.error('Errore recupero materiali più usati:', error);
      throw error;
    }
  }
  
  // ========== IMPORT/EXPORT ==========
  
  async importMaterials(data: any[]) {
    try {
      const imported = [];
      const errors = [];
      
      for (const item of data) {
        try {
          const material = await this.createMaterial(item);
          imported.push(material);
        } catch (error: any) {
          errors.push({
            row: data.indexOf(item) + 1,
            error: error.message,
            data: item
          });
        }
      }
      
      return {
        success: imported.length,
        failed: errors.length,
        imported,
        errors
      };
    } catch (error) {
      console.error('Errore import materiali:', error);
      throw error;
    }
  }
  
  async exportMaterials(filters?: any) {
    try {
      const materials = await this.getMaterials(filters);
      
      // In produzione qui genererebbe un file Excel/CSV
      console.log('Export materiali:', materials.length);
      
      return {
        data: materials,
        format: 'json',
        filename: `materiali_${Date.now()}.json`
      };
    } catch (error) {
      console.error('Errore export materiali:', error);
      throw error;
    }
  }
}

export default new InterventionMaterialService();
