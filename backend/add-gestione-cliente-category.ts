/**
 * Script per aggiungere categoria "Gestione Cliente" e sottocategorie generiche
 * per configurazioni AI trasversali
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function addGestioneClienteCategory() {
  console.log('🚀 AGGIUNTA CATEGORIA "GESTIONE CLIENTE" E SOTTOCATEGORIE AI\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Crea la categoria principale
    console.log('\n1. Creazione categoria "Gestione Cliente"...');
    
    const category = await prisma.category.create({
      data: {
        name: 'Gestione Cliente',
        description: 'Configurazioni AI per interazioni standard con clienti',
        icon: 'user-group',
        color: '#8B5CF6', // Viola per differenziarla
        isActive: true,
        order: 999 // La mettiamo in fondo
      }
    });
    
    console.log(`   ✅ Categoria creata con ID: ${category.id}`);
    
    // 2. Crea le sottocategorie generiche
    console.log('\n2. Creazione sottocategorie generiche...');
    
    const subcategories = [
      {
        name: 'Informazioni Commerciali',
        description: 'Prezzi, disponibilità, servizi offerti',
        icon: 'currency-euro',
        aiPromptTemplate: 'Rispondi come professionista fornendo informazioni commerciali chiare e trasparenti.'
      },
      {
        name: 'Richiesta Preventivi',
        description: 'Gestione richieste di preventivo',
        icon: 'document-text',
        aiPromptTemplate: 'Raccogli le informazioni necessarie per elaborare un preventivo accurato.'
      },
      {
        name: 'Emergenze H24',
        description: 'Gestione chiamate urgenti',
        icon: 'exclamation-triangle',
        aiPromptTemplate: 'Gestisci la richiesta di emergenza con calma e professionalità, fornendo tempistiche chiare.'
      },
      {
        name: 'Gestione Appuntamenti',
        description: 'Scheduling e conferme appuntamenti',
        icon: 'calendar',
        aiPromptTemplate: 'Coordina gli appuntamenti verificando disponibilità e confermando orari.'
      },
      {
        name: 'Assistenza Post-Intervento',
        description: 'Follow-up e supporto dopo il servizio',
        icon: 'chat-bubble-left-right',
        aiPromptTemplate: 'Fornisci supporto post-intervento assicurandoti che il cliente sia soddisfatto.'
      },
      {
        name: 'Informazioni Generali',
        description: 'FAQ e informazioni aziendali',
        icon: 'information-circle',
        aiPromptTemplate: 'Fornisci informazioni chiare e complete sui servizi e modalità di lavoro.'
      },
      {
        name: 'Gestione Reclami',
        description: 'Gestione professionale dei reclami',
        icon: 'exclamation-circle',
        aiPromptTemplate: 'Gestisci il reclamo con empatia e professionalità, cercando una soluzione.'
      },
      {
        name: 'Raccolta Feedback',
        description: 'Recensioni e miglioramento servizio',
        icon: 'star',
        aiPromptTemplate: 'Richiedi feedback in modo cortese per migliorare il servizio.'
      }
    ];
    
    for (const subcat of subcategories) {
      const created = await prisma.subcategory.create({
        data: {
          categoryId: category.id,
          name: subcat.name,
          description: subcat.description,
          icon: subcat.icon,
          isGeneric: true, // Flag per indicare che sono generiche
          isActive: true,
          // Template AI generico
          metadata: {
            aiPromptTemplate: subcat.aiPromptTemplate,
            requiredInfo: [], // Nessuna info specifica richiesta
            isAIConfigurable: true
          }
        }
      });
      
      console.log(`   ✅ ${created.name} - ID: ${created.id}`);
    }
    
    // 3. Ora per ogni professionista esistente, crea le configurazioni base
    console.log('\n3. Creazione configurazioni AI per professionisti esistenti...');
    
    const professionals = await prisma.user.findMany({
      where: { role: 'PROFESSIONAL' }
    });
    
    console.log(`   Trovati ${professionals.length} professionisti`);
    
    const subcategoriesCreated = await prisma.subcategory.findMany({
      where: { categoryId: category.id }
    });
    
    let configCount = 0;
    
    for (const prof of professionals) {
      for (const subcat of subcategoriesCreated) {
        // Crea ProfessionalSubcategory con configurazione AI base
        await prisma.professionalSubcategory.create({
          data: {
            professionalId: prof.id,
            subcategoryId: subcat.id,
            isActive: true,
            
            // Configurazione AI personalizzabile
            aiPrompt: `Sei ${prof.fullName}, professionista del settore. ${subcat.metadata.aiPromptTemplate}`,
            
            clientSystemPrompt: `Stai parlando con un cliente che richiede ${subcat.name.toLowerCase()}. Sii professionale e cortese.`,
            
            knowledgeBase: {
              documents: [],
              customResponses: {}
            },
            
            // Impostazioni AI di default
            modelName: 'gpt-3.5-turbo',
            temperature: 0.7,
            maxTokens: 1000,
            responseStyle: 'professional',
            detailLevel: 'intermediate'
          }
        });
        
        configCount++;
      }
    }
    
    console.log(`   ✅ Create ${configCount} configurazioni AI\n`);
    
    // 4. Report finale
    console.log('=' .repeat(60));
    console.log('✅ COMPLETATO CON SUCCESSO!\n');
    console.log(`📊 RIEPILOGO:`);
    console.log(`- 1 categoria "Gestione Cliente" creata`);
    console.log(`- ${subcategories.length} sottocategorie generiche create`);
    console.log(`- ${configCount} configurazioni AI create per i professionisti\n`);
    
    console.log('📝 PROSSIMI PASSI:');
    console.log('1. I professionisti possono personalizzare le loro AI');
    console.log('2. Configurare il sistema WhatsApp per usare queste AI');
    console.log('3. Test con messaggi reali\n');
    
  } catch (error: any) {
    console.error('\n❌ ERRORE:', error.message);
    
    // Rollback se necessario
    if (error.code === 'P2002') {
      console.log('\n⚠️ La categoria o alcune sottocategorie esistono già');
      console.log('Verifica manualmente nel database');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
addGestioneClienteCategory();
