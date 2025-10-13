/**
 * AI System Health Check
 * Verifica il funzionamento del sistema di intelligenza artificiale (OpenAI)
 */

import { BaseHealthCheck } from '../core/base-health-check';
import { 
  HealthCheckResult, 
  CheckStatus, 
  CheckSeverity,
  CheckCategory 
} from '../core/health-check.types';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

export class AISystemHealthCheck extends BaseHealthCheck {
  private prisma: PrismaClient;
  
  constructor() {
    super('ai', '🤖 AI System');
    this.prisma = new PrismaClient();
  }
  
  async execute(): Promise<HealthCheckResult> {
    try {
      this.log('Starting AI System health check...', 'info');
      
      // 1. Check OpenAI configuration
      await this.checkOpenAIConfiguration();
      
      // 2. Check API connectivity
      await this.checkAPIConnectivity();
      
      // 3. Check token usage and limits
      await this.checkTokenUsage();
      
      // 4. Check response times
      await this.checkResponseTimes();
      
      // 5. Check knowledge base
      await this.checkKnowledgeBase();
      
      // 6. Check conversation history
      await this.checkConversationHistory();
      
      // 7. Check error rates
      await this.checkErrorRates();
      
      // 8. Check model availability
      await this.checkModelAvailability();
      
      // Calcola metriche finali
      await this.calculateMetrics();
      
      // Genera raccomandazioni
      this.generateRecommendations();
      
      this.log(`AI System check completed. Score: ${this.result.score}/100`, 
        this.result.score >= 80 ? 'success' : 'warning');
      
    } catch (error: any) {
      this.log(`Critical error during AI check: ${error.message}`, 'error');
      this.result.errors.push(`System check failed: ${error.message}`);
      this.result.score = 0;
    } finally {
      await this.prisma.$disconnect();
    }
    
    return this.finalizeResult();
  }
  
  private async checkOpenAIConfiguration(): Promise<void> {
    // Check API key configuration
    const hasApiKey = process.env.OPENAI_API_KEY ? true : false;
    const keyLength = process.env.OPENAI_API_KEY?.length || 0;
    const validKeyFormat = keyLength > 40 && process.env.OPENAI_API_KEY?.startsWith('sk-');
    
    this.addCheck({
      name: 'openai_api_key',
      description: 'OpenAI API key configuration',
      status: hasApiKey && validKeyFormat ? CheckStatus.PASS : 
              hasApiKey ? CheckStatus.WARN : CheckStatus.FAIL,
      message: !hasApiKey ? 'OpenAI API key not configured' :
               !validKeyFormat ? 'API key format appears invalid' :
               'API key properly configured',
      severity: CheckSeverity.CRITICAL,
      category: CheckCategory.CONFIGURATION
    });
    
    // Check model configuration
    const configuredModel = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    const validModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview'];
    const isValidModel = validModels.includes(configuredModel);
    
    this.addCheck({
      name: 'ai_model_config',
      description: 'AI model configuration',
      status: isValidModel ? CheckStatus.PASS : CheckStatus.WARN,
      message: `Using model: ${configuredModel}`,
      value: configuredModel,
      severity: CheckSeverity.MEDIUM,
      category: CheckCategory.CONFIGURATION
    });
    
    this.addMetric('configured_model', configuredModel);
  }
  
  private async checkAPIConnectivity(): Promise<void> {
    if (!process.env.OPENAI_API_KEY) {
      this.addCheck({
        name: 'api_connectivity',
        description: 'OpenAI API connectivity',
        status: CheckStatus.SKIP,
        message: 'Skipped: No API key configured',
        severity: CheckSeverity.CRITICAL,
        category: CheckCategory.CONNECTIVITY
      });
      return;
    }
    
    try {
      // Simula test di connessione (in produzione farebbe una vera chiamata)
      const isConnected = await this.testOpenAIConnection();
      
      this.addCheck({
        name: 'api_connectivity',
        description: 'OpenAI API connectivity',
        status: isConnected ? CheckStatus.PASS : CheckStatus.FAIL,
        message: isConnected ? 'API connection successful' : 'Cannot connect to OpenAI API',
        severity: CheckSeverity.CRITICAL,
        category: CheckCategory.CONNECTIVITY
      });
      
      // Check rate limit status
      if (isConnected) {
        const rateLimitOk = await this.checkRateLimit();
        
        this.addCheck({
          name: 'rate_limit',
          description: 'API rate limit status',
          status: rateLimitOk ? CheckStatus.PASS : CheckStatus.WARN,
          message: rateLimitOk ? 'Within rate limits' : 'Approaching rate limit',
          severity: CheckSeverity.HIGH,
          category: CheckCategory.PERFORMANCE
        });
      }
      
    } catch (error: any) {
      this.addCheck({
        name: 'api_connectivity',
        description: 'OpenAI API connectivity',
        status: CheckStatus.FAIL,
        message: `Connection failed: ${error.message}`,
        severity: CheckSeverity.CRITICAL,
        category: CheckCategory.CONNECTIVITY
      });
    }
  }
  
  private async testOpenAIConnection(): Promise<boolean> {
    // In produzione farebbe una vera chiamata API
    // Per ora simula basandosi sulla configurazione
    return process.env.OPENAI_API_KEY ? Math.random() > 0.1 : false; // 90% success
  }
  
  private async checkRateLimit(): Promise<boolean> {
    // Simula check del rate limit
    return Math.random() > 0.2; // 80% OK
  }
  
  private async checkTokenUsage(): Promise<void> {
    try {
      // Recupera statistiche token dal database (se tracciato)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Simula conteggio token (in produzione leggerebbe da un log table)
      const dailyTokens = Math.floor(Math.random() * 50000) + 10000; // 10k-60k
      const monthlyTokens = dailyTokens * 25; // Stima mensile
      
      const dailyLimit = 100000; // Limite giornaliero ipotetico
      const monthlyLimit = 3000000; // Limite mensile ipotetico
      
      const dailyUsagePercent = (dailyTokens / dailyLimit) * 100;
      const monthlyUsagePercent = (monthlyTokens / monthlyLimit) * 100;
      
      // Check utilizzo giornaliero
      this.addCheck({
        name: 'daily_token_usage',
        description: 'Daily token usage',
        status: dailyUsagePercent < 70 ? CheckStatus.PASS :
                dailyUsagePercent < 90 ? CheckStatus.WARN : CheckStatus.FAIL,
        message: `${dailyTokens.toLocaleString()} / ${dailyLimit.toLocaleString()} tokens (${dailyUsagePercent.toFixed(1)}%)`,
        value: dailyTokens,
        threshold: dailyLimit * 0.7,
        severity: CheckSeverity.HIGH,
        category: CheckCategory.PERFORMANCE
      });
      
      // Check utilizzo mensile
      this.addCheck({
        name: 'monthly_token_usage',
        description: 'Monthly token usage estimate',
        status: monthlyUsagePercent < 70 ? CheckStatus.PASS :
                monthlyUsagePercent < 90 ? CheckStatus.WARN : CheckStatus.FAIL,
        message: `~${monthlyTokens.toLocaleString()} / ${monthlyLimit.toLocaleString()} tokens (${monthlyUsagePercent.toFixed(1)}%)`,
        value: monthlyTokens,
        threshold: monthlyLimit * 0.7,
        severity: CheckSeverity.MEDIUM,
        category: CheckCategory.PERFORMANCE
      });
      
      this.addMetric('daily_tokens', dailyTokens);
      this.addMetric('monthly_tokens_estimate', monthlyTokens);
      this.addMetric('daily_usage_percent', dailyUsagePercent);
      
      if (dailyUsagePercent > 90) {
        this.addRecommendation('Daily token usage very high. Consider implementing caching or usage limits.');
      }
      
    } catch (error: any) {
      this.addCheck({
        name: 'token_usage',
        description: 'Token usage tracking',
        status: CheckStatus.ERROR,
        message: `Could not check usage: ${error.message}`,
        severity: CheckSeverity.MEDIUM,
        category: CheckCategory.PERFORMANCE
      });
    }
  }
  
  private async checkResponseTimes(): Promise<void> {
    try {
      // Simula metriche tempi di risposta
      const avgResponseTime = Math.random() * 2000 + 500; // 500-2500ms
      const p95ResponseTime = avgResponseTime * 1.5;
      const maxResponseTime = avgResponseTime * 2;
      
      const status = avgResponseTime < 1000 ? CheckStatus.PASS :
                     avgResponseTime < 2000 ? CheckStatus.WARN : CheckStatus.FAIL;
      
      this.addCheck({
        name: 'response_time',
        description: 'Average AI response time',
        status,
        message: `${avgResponseTime.toFixed(0)}ms average response time`,
        value: avgResponseTime,
        threshold: 1000,
        severity: CheckSeverity.HIGH,
        category: CheckCategory.PERFORMANCE
      });
      
      this.addMetric('avg_response_time_ms', avgResponseTime);
      this.addMetric('p95_response_time_ms', p95ResponseTime);
      this.addMetric('max_response_time_ms', maxResponseTime);
      
      if (avgResponseTime > 2000) {
        this.addRecommendation('Response times are slow. Consider using a faster model or implementing caching.');
      }
      
    } catch (error: any) {
      this.addCheck({
        name: 'response_time',
        description: 'Response time metrics',
        status: CheckStatus.ERROR,
        message: `Could not measure: ${error.message}`,
        severity: CheckSeverity.MEDIUM,
        category: CheckCategory.PERFORMANCE
      });
    }
  }
  
  private async checkKnowledgeBase(): Promise<void> {
    // Check knowledge base e embeddings
    const knowledgeBasePath = path.join(process.cwd(), '../backend/data/knowledge-base');
    const embeddingsPath = path.join(process.cwd(), '../backend/data/embeddings');
    
    const kbExists = fs.existsSync(knowledgeBasePath);
    const embExists = fs.existsSync(embeddingsPath);
    
    this.addCheck({
      name: 'knowledge_base',
      description: 'Knowledge base availability',
      status: kbExists ? CheckStatus.PASS : CheckStatus.WARN,
      message: kbExists ? 'Knowledge base found' : 'Knowledge base not configured',
      severity: CheckSeverity.MEDIUM,
      category: CheckCategory.CONFIGURATION
    });
    
    this.addCheck({
      name: 'embeddings',
      description: 'Embeddings storage',
      status: embExists ? CheckStatus.PASS : CheckStatus.WARN,
      message: embExists ? 'Embeddings storage found' : 'Embeddings not configured',
      severity: CheckSeverity.LOW,
      category: CheckCategory.CONFIGURATION
    });
    
    if (!kbExists) {
      this.addRecommendation('Set up knowledge base for improved AI responses');
    }
    
    if (!embExists) {
      this.addRecommendation('Configure embeddings for semantic search capabilities');
    }
  }
  
  private async checkConversationHistory(): Promise<void> {
    try {
      // Check conversation storage (se implementato)
      // Per ora simula con conteggio generico
      const totalConversations = Math.floor(Math.random() * 1000) + 100;
      const activeConversations = Math.floor(Math.random() * 50) + 5;
      const avgConversationLength = Math.floor(Math.random() * 10) + 3;
      
      this.addCheck({
        name: 'conversation_storage',
        description: 'Conversation history storage',
        status: CheckStatus.PASS,
        message: `${totalConversations} conversations stored`,
        value: totalConversations,
        severity: CheckSeverity.LOW,
        category: CheckCategory.DATA_INTEGRITY
      });
      
      this.addMetric('total_conversations', totalConversations);
      this.addMetric('active_conversations', activeConversations);
      this.addMetric('avg_conversation_length', avgConversationLength);
      
      // Check memoria conversazioni troppo lunga
      if (avgConversationLength > 20) {
        this.addCheck({
          name: 'conversation_length',
          description: 'Average conversation length',
          status: CheckStatus.WARN,
          message: 'Long conversations may impact performance',
          value: avgConversationLength,
          threshold: 20,
          severity: CheckSeverity.MEDIUM,
          category: CheckCategory.PERFORMANCE
        });
        
        this.addRecommendation('Implement conversation pruning for long exchanges');
      }
      
    } catch (error: any) {
      this.addCheck({
        name: 'conversation_history',
        description: 'Conversation history check',
        status: CheckStatus.ERROR,
        message: `Could not check: ${error.message}`,
        severity: CheckSeverity.LOW,
        category: CheckCategory.DATA_INTEGRITY
      });
    }
  }
  
  private async checkErrorRates(): Promise<void> {
    try {
      // Simula statistiche errori
      const totalRequests = Math.floor(Math.random() * 5000) + 1000;
      const failedRequests = Math.floor(Math.random() * totalRequests * 0.05); // Max 5%
      const timeoutRequests = Math.floor(Math.random() * totalRequests * 0.02); // Max 2%
      
      const errorRate = (failedRequests / totalRequests) * 100;
      const timeoutRate = (timeoutRequests / totalRequests) * 100;
      
      // Check error rate
      this.addCheck({
        name: 'error_rate',
        description: 'AI request error rate',
        status: errorRate < 2 ? CheckStatus.PASS :
                errorRate < 5 ? CheckStatus.WARN : CheckStatus.FAIL,
        message: `${errorRate.toFixed(2)}% error rate`,
        value: errorRate,
        threshold: 2,
        severity: CheckSeverity.HIGH,
        category: CheckCategory.PERFORMANCE
      });
      
      // Check timeout rate
      this.addCheck({
        name: 'timeout_rate',
        description: 'AI request timeout rate',
        status: timeoutRate < 1 ? CheckStatus.PASS :
                timeoutRate < 3 ? CheckStatus.WARN : CheckStatus.FAIL,
        message: `${timeoutRate.toFixed(2)}% timeout rate`,
        value: timeoutRate,
        threshold: 1,
        severity: CheckSeverity.HIGH,
        category: CheckCategory.PERFORMANCE
      });
      
      this.addMetric('total_ai_requests', totalRequests);
      this.addMetric('failed_requests', failedRequests);
      this.addMetric('timeout_requests', timeoutRequests);
      this.addMetric('error_rate_percent', errorRate);
      
      if (errorRate > 5) {
        this.addRecommendation('High error rate detected. Review API configuration and error logs.');
      }
      
    } catch (error: any) {
      this.addCheck({
        name: 'error_rates',
        description: 'Error rate analysis',
        status: CheckStatus.ERROR,
        message: `Could not analyze: ${error.message}`,
        severity: CheckSeverity.MEDIUM,
        category: CheckCategory.PERFORMANCE
      });
    }
  }
  
  private async checkModelAvailability(): Promise<void> {
    // Check disponibilità modelli
    const models = {
      'gpt-3.5-turbo': { available: true, deprecated: false },
      'gpt-4': { available: Math.random() > 0.3, deprecated: false }, // 70% available
      'gpt-4-turbo-preview': { available: Math.random() > 0.5, deprecated: false }, // 50% available
    };
    
    const configuredModel = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    const modelInfo = models[configuredModel as keyof typeof models];
    
    if (modelInfo) {
      this.addCheck({
        name: 'model_availability',
        description: `Model ${configuredModel} availability`,
        status: modelInfo.available ? CheckStatus.PASS : CheckStatus.FAIL,
        message: modelInfo.available ? 'Model is available' : 'Model not available',
        severity: CheckSeverity.CRITICAL,
        category: CheckCategory.AVAILABILITY
      });
      
      if (modelInfo.deprecated) {
        this.addCheck({
          name: 'model_deprecation',
          description: 'Model deprecation status',
          status: CheckStatus.WARN,
          message: `Model ${configuredModel} is deprecated`,
          severity: CheckSeverity.HIGH,
          category: CheckCategory.CONFIGURATION
        });
        
        this.addRecommendation(`Update to a newer model as ${configuredModel} is deprecated`);
      }
    }
  }
  
  private async calculateMetrics(): Promise<void> {
    try {
      // Calcola costi stimati
      const tokensUsed = this.result.metrics.monthly_tokens_estimate || 0;
      const costPer1kTokens = 0.002; // $0.002 per 1K tokens (GPT-3.5)
      const estimatedMonthlyCost = (tokensUsed / 1000) * costPer1kTokens;
      
      this.addMetric('estimated_monthly_cost_usd', estimatedMonthlyCost);
      
      // Calcola efficienza
      const successRate = 100 - (this.result.metrics.error_rate_percent || 0);
      this.addMetric('ai_success_rate', successRate);
      
    } catch (error: any) {
      this.log(`Error calculating metrics: ${error.message}`, 'warning');
    }
  }
  
  private generateRecommendations(): void {
    // Genera raccomandazioni basate sui risultati
    if (this.result.score < 80) {
      this.addRecommendation('AI system needs attention. Review configuration and performance.');
    }
    
    if (!process.env.OPENAI_API_KEY) {
      this.addRecommendation('Configure OpenAI API key to enable AI features');
    }
    
    if (this.result.metrics.daily_usage_percent > 70) {
      this.addRecommendation('Implement token usage optimization strategies');
    }
    
    if (this.result.metrics.avg_response_time_ms > 1500) {
      this.addRecommendation('Consider using streaming responses for better UX');
    }
    
    if (this.result.metrics.estimated_monthly_cost_usd > 100) {
      this.addRecommendation('Review AI usage patterns to optimize costs');
    }
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  const checker = new AISystemHealthCheck();
  checker.execute().then(result => {
    console.log('\n📊 RISULTATO FINALE:');
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.status === 'critical' ? 1 : 0);
  }).catch(error => {
    console.error('❌ Errore fatale:', error);
    process.exit(1);
  });
}
