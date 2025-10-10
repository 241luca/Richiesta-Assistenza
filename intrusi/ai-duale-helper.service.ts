/**
 * AI Duale Helper Service
 * Funzioni di supporto per il sistema AI Duale
 * AGGIORNATO v5.1: Usa API keys dal database
 */

import { OpenAI } from 'openai';
import prisma from '../config/database';
import logger from '../utils/logger';
import { apiKeyService } from './apiKey.service';

/**
 * Genera risposta AI usando OpenAI
 */
export async function generateAIResponse({ message, kb, config, context }: {
  message: string;
  kb: any;
  config: any;
  context: {
    isGroup: boolean;
    senderName: string;
    messageType: string;
  };
}): Promise<string> {
  try {
    // Recupera API key dal database
    const apiKeyData = await apiKeyService.getApiKey('OPENAI', true);
    
    if (!apiKeyData || !apiKeyData.key) {
      throw new Error('OpenAI API key not found in database');
    }
    
    const openai = new OpenAI({ 
      apiKey: apiKeyData.key
    });
    
    // Costruisce il prompt di sistema con la KB
    const systemPrompt = `${config.systemPrompt || 'Sei un assistente AI professionale.'}\n\nKnowledge Base:\n${JSON.stringify(kb, null, 2)}`;
    
    // Aggiunge contesto al messaggio
    const userMessage = `[${context.senderName} - ${context.messageType}${context.isGroup ? ' (gruppo)' : ''}]\n${message}`;
    
    logger.info('Generando risposta AI con config:', {
      model: config.model || 'gpt-3.5-turbo',
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 300
    });
    
    const completion = await openai.chat.completions.create({
      model: config.model || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 300
    });
    
    const response = completion.choices[0]?.message?.content || 'Mi dispiace, non sono riuscito a generare una risposta.';
    
    logger.info('Risposta AI generata:', response.substring(0, 100) + '...');
    
    return response;
    
  } catch (error: any) {
    logger.error('Errore generazione risposta AI:', error);
    throw new Error(`Errore AI: ${error.message}`);
  }
}

/**
 * Determina la sottocategoria dal messaggio usando pattern matching o AI
 */
export async function determineSubcategoryFromMessage(message: string): Promise<string | null> {
  try {
    // Normalizza il messaggio per il matching
    const normalizedMessage = message.toLowerCase().trim();
    
    // Recupera tutte le sottocategorie con le loro parole chiave
    const subcategories = await prisma.subcategory.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        categoryId: true
      }
    });
    
    // Pattern matching basato su parole chiave comuni
    const keywordMap: { [key: string]: string[] } = {
      'idraulico': ['tubo', 'perdita', 'acqua', 'rubinetto', 'scarico', 'bagno', 'lavandino', 'wc', 'water'],
      'elettricista': ['luce', 'corrente', 'presa', 'interruttore', 'blackout', 'cortocircuito', 'impianto elettrico'],
      'condizionamento': ['aria condizionata', 'condizionatore', 'clima', 'freddo', 'caldo', 'climatizzatore', 'split'],
      'riscaldamento': ['caldaia', 'termosifone', 'radiatore', 'riscaldamento', 'boiler', 'stufa'],
      'falegname': ['porta', 'finestra', 'mobile', 'armadio', 'legno', 'serratura'],
      'muratore': ['muro', 'crepa', 'intonaco', 'piastrelle', 'pavimento', 'ristrutturazione'],
      'fabbro': ['serratura', 'chiave', 'cancello', 'porta blindata', 'lucchetto'],
      'vetro': ['vetro', 'finestra', 'specchio', 'vetrata', 'cristallo'],
      'giardiniere': ['giardino', 'prato', 'piante', 'albero', 'potatura', 'irrigazione'],
      'pulizie': ['pulizia', 'pulire', 'igienizzazione', 'sanificazione', 'sporco']
    };
    
    // Cerca corrispondenze con le sottocategorie
    for (const subcategory of subcategories) {
      const subcategoryName = subcategory.name.toLowerCase();
      
      // Controlla se il nome della sottocategoria è menzionato
      if (normalizedMessage.includes(subcategoryName)) {
        logger.info(`Sottocategoria identificata per nome: ${subcategory.name}`);
        return subcategory.id;
      }
      
      // Controlla le parole chiave associate
      for (const [category, keywords] of Object.entries(keywordMap)) {
        if (subcategoryName.includes(category)) {
          for (const keyword of keywords) {
            if (normalizedMessage.includes(keyword)) {
              logger.info(`Sottocategoria identificata per keyword "${keyword}": ${subcategory.name}`);
              return subcategory.id;
            }
          }
        }
      }
    }
    
    // Se non trova corrispondenze, usa una sottocategoria generica o null
    logger.info('Nessuna sottocategoria specifica identificata nel messaggio');
    
    // Cerca una sottocategoria "Generale" o "Altro"
    const genericSubcategory = subcategories.find(s => 
      s.name.toLowerCase().includes('generale') || 
      s.name.toLowerCase().includes('altro')
    );
    
    if (genericSubcategory) {
      return genericSubcategory.id;
    }
    
    // Se esiste almeno una sottocategoria, ritorna la prima
    if (subcategories.length > 0) {
      logger.info(`Usando sottocategoria di default: ${subcategories[0].name}`);
      return subcategories[0].id;
    }
    
    return null;
    
  } catch (error: any) {
    logger.error('Errore determinazione sottocategoria:', error);
    return null;
  }
}

/**
 * Recupera la configurazione AI del professionista
 */
export async function getProfessionalAIConfig(instanceId: string): Promise<any> {
  try {
    const config = await prisma.professionalWhatsApp.findFirst({
      where: {
        instanceId: instanceId,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        professionalId: true,
        aiEnabled: true,
        aiConfigProfessional: true,
        aiConfigClient: true
      }
    });
    
    return config;
  } catch (error: any) {
    logger.error('Errore recupero configurazione AI:', error);
    return null;
  }
}

/**
 * Valida se l'AI è abilitata e configurata correttamente
 */
export function isAIConfigValid(config: any): boolean {
  if (!config) return false;
  if (!config.aiEnabled) return false;
  if (!config.aiConfigProfessional && !config.aiConfigClient) return false;
  
  // Verifica che ci sia almeno una configurazione valida
  const hasValidProfConfig = config.aiConfigProfessional && 
    config.aiConfigProfessional.systemPrompt;
  
  const hasValidClientConfig = config.aiConfigClient && 
    config.aiConfigClient.systemPrompt;
  
  return hasValidProfConfig || hasValidClientConfig;
}

/**
 * Salva il risultato della detection per analytics
 */
export async function saveDetectionResult(data: {
  whatsappId: string;
  phoneNumber: string;
  message: string;
  response: string;
  detectedMode: string;
  confidence: number;
  detectionFactors: any;
}): Promise<void> {
  try {
    await prisma.professionalWhatsAppMessage.create({
      data: {
        whatsappId: data.whatsappId,
        phoneNumber: data.phoneNumber,
        message: data.message,
        response: data.response,
        detectedMode: data.detectedMode,
        confidence: data.confidence,
        detectionFactors: data.detectionFactors,
        timestamp: new Date()
      }
    });
    
    logger.info('Detection result salvato per analytics');
  } catch (error: any) {
    logger.error('Errore salvataggio detection result:', error);
    // Non rilanciare l'errore per non bloccare il flusso principale
  }
}

export default {
  generateAIResponse,
  determineSubcategoryFromMessage,
  getProfessionalAIConfig,
  isAIConfigValid,
  saveDetectionResult
};
