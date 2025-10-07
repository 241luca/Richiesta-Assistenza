/**
 * Request System Health Check
 * Verifica il funzionamento del sistema di richieste di assistenza
 */

import { BaseHealthCheck } from '../core/base-health-check';
import { 
  HealthCheckResult, 
  CheckStatus, 
  CheckSeverity,
  CheckCategory 
} from '../core/health-check.types';
import { PrismaClient } from '@prisma/client';

export class RequestSystemHealthCheck extends BaseHealthCheck {
  private prisma: PrismaClient;
  
  constructor() {
    super('request', '📋 Request System');
    this.prisma = new PrismaClient();
  }
  
  async execute(): Promise<HealthCheckResult> {
    try {
      this.log('Starting Request System health check...', 'info');
      
      // 1. Check database connectivity
      await this.checkRequestDatabase();
      
      // 2. Check request workflow
      await this.checkRequestWorkflow();
      
      // 3. Check assignment system
      await this.checkAssignmentSystem();
      
      // 4. Check quote system
      await this.checkQuoteSystem();
      
      // 5. Check request completion rate
      await this.checkCompletionRate();
      
      // 6. Check response times
      await this.checkResponseTimes();
      
      // 7. Check category system
      await this.checkCategorySystem();
      
      // 8. Check geolocation
      await this.checkGeolocationSystem();
      
      // 9. Check pending requests
      await this.checkPendingRequests();
      
      // Calcola metriche finali
      await this.calculateMetrics();
      
      // Genera raccomandazioni
      this.generateRecommendations();
      
      this.log(`Request System check completed. Score: ${this.result.score}/100`, 
        this.result.score >= 80 ? 'success' : 'warning');
      
    } catch (error: any) {
      this.log(`Critical error during request check: ${error.message}`, 'error');
      this.result.errors.push(`System check failed: ${error.message}`);
      this.result.score = 0;
    } finally {
      await this.prisma.$disconnect();
    }
    
    return this.finalizeResult();
  }
  
  private async checkRequestDatabase(): Promise<void> {
    try {
      const requestCount = await this.prisma.assistanceRequest.count();
      const activeRequests = await this.prisma.assistanceRequest.count({
        where: {
          status: {
            in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS']
          }
        }
      });
      
      this.addCheck({
        name: 'request_database',
        description: 'Request database connectivity',
        status: CheckStatus.PASS,
        message: `Database connected. ${requestCount} total requests, ${activeRequests} active`,
        value: requestCount,
        severity: CheckSeverity.CRITICAL,
        category: CheckCategory.CONNECTIVITY
      });
      
      this.addMetric('total_requests', requestCount);
      this.addMetric('active_requests', activeRequests);
      
    } catch (error: any) {
      this.addCheck({
        name: 'request_database',
        description: 'Request database connectivity',
        status: CheckStatus.FAIL,
        message: `Database error: ${error.message}`,
        severity: CheckSeverity.CRITICAL,
        category: CheckCategory.CONNECTIVITY
      });
    }
  }
  
  private async checkRequestWorkflow(): Promise<void> {
    try {
      // Verifica distribuzione stati
      const statusDistribution = await this.prisma.assistanceRequest.groupBy({
        by: ['status'],
        _count: true
      });
      
      const statusMap: Record<string, number> = {};
      statusDistribution.forEach(item => {
        statusMap[item.status] = item._count;
      });
      
      // Check se ci sono richieste bloccate in stati intermedi
      const stuckInProgress = await this.prisma.assistanceRequest.count({
        where: {
          status: 'IN_PROGRESS',
          updatedAt: {
            lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Più di 7 giorni
          }
        }
      });
      
      const hasStuckRequests = stuckInProgress > 0;
      
      this.addCheck({
        name: 'workflow_health',
        description: 'Request workflow status distribution',
        status: hasStuckRequests ? CheckStatus.WARN : CheckStatus.PASS,
        message: hasStuckRequests ? 
          `${stuckInProgress} requests stuck in progress > 7 days` :
          'Workflow operating normally',
        value: statusMap,
        severity: CheckSeverity.HIGH,
        category: CheckCategory.DATA_INTEGRITY
      });
      
      this.addMetric('status_distribution', statusMap);
      this.addMetric('stuck_requests', stuckInProgress);
      
      if (hasStuckRequests) {
        this.addRecommendation('Review and update stuck requests in IN_PROGRESS status');
      }
      
    } catch (error: any) {
      this.addCheck({
        name: 'workflow_health',
        description: 'Request workflow check',
        status: CheckStatus.ERROR,
        message: `Could not check: ${error.message}`,
        severity: CheckSeverity.MEDIUM,
        category: CheckCategory.DATA_INTEGRITY
      });
    }
  }
  
  private async checkAssignmentSystem(): Promise<void> {
    try {
      // Check richieste non assegnate
      const unassignedOld = await this.prisma.assistanceRequest.count({
        where: {
          status: 'PENDING',
          professionalId: null,
          createdAt: {
            lte: new Date(Date.now() - 48 * 60 * 60 * 1000) // Più di 48h
          }
        }
      });
      
      // Check auto-assignment vs manual
      const autoAssigned = await this.prisma.assistanceRequest.count({
        where: {
          assignmentType: 'AUTOMATIC',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      });
      
      const manualAssigned = await this.prisma.assistanceRequest.count({
        where: {
          assignmentType: 'MANUAL',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      });
      
      const autoAssignmentRate = autoAssigned + manualAssigned > 0 ?
        (autoAssigned / (autoAssigned + manualAssigned)) * 100 : 0;
      
      this.addCheck({
        name: 'unassigned_requests',
        description: 'Old unassigned requests (>48h)',
        status: unassignedOld === 0 ? CheckStatus.PASS :
                unassignedOld < 5 ? CheckStatus.WARN : CheckStatus.FAIL,
        message: `${unassignedOld} requests unassigned for >48h`,
        value: unassignedOld,
        threshold: 0,
        severity: CheckSeverity.HIGH,
        category: CheckCategory.PERFORMANCE
      });
      
      this.addCheck({
        name: 'auto_assignment',
        description: 'Auto-assignment system usage',
        status: autoAssignmentRate > 50 ? CheckStatus.PASS :
                autoAssignmentRate > 20 ? CheckStatus.WARN : CheckStatus.FAIL,
        message: `${autoAssignmentRate.toFixed(1)}% auto-assignment rate`,
        value: autoAssignmentRate,
        expected: 50,
        severity: CheckSeverity.MEDIUM,
        category: CheckCategory.PERFORMANCE
      });
      
      this.addMetric('unassigned_old_requests', unassignedOld);
      this.addMetric('auto_assignment_rate', autoAssignmentRate);
      
      if (unassignedOld > 5) {
        this.addRecommendation('Many unassigned requests. Review professional availability and matching criteria.');
      }
      
      if (autoAssignmentRate < 20) {
        this.addRecommendation('Low auto-assignment usage. Optimize automatic assignment algorithm.');
      }
      
    } catch (error: any) {
      this.addCheck({
        name: 'assignment_system',
        description: 'Assignment system check',
        status: CheckStatus.ERROR,
        message: `Could not check: ${error.message}`,
        severity: CheckSeverity.HIGH,
        category: CheckCategory.PERFORMANCE
      });
    }
  }
  
  private async checkQuoteSystem(): Promise<void> {
    try {
      const totalQuotes = await this.prisma.quote.count();
      const acceptedQuotes = await this.prisma.quote.count({
        where: { status: 'ACCEPTED' }
      });
      const pendingQuotes = await this.prisma.quote.count({
        where: { 
          status: 'SENT',
          createdAt: {
            lte: new Date(Date.now() - 72 * 60 * 60 * 1000) // Più di 72h
          }
        }
      });
      
      const acceptanceRate = totalQuotes > 0 ?
        (acceptedQuotes / totalQuotes) * 100 : 0;
      
      this.addCheck({
        name: 'quote_acceptance',
        description: 'Quote acceptance rate',
        status: acceptanceRate > 30 ? CheckStatus.PASS :
                acceptanceRate > 15 ? CheckStatus.WARN : CheckStatus.FAIL,
        message: `${acceptanceRate.toFixed(1)}% quote acceptance rate`,
        value: acceptanceRate,
        expected: 30,
        severity: CheckSeverity.HIGH,
        category: CheckCategory.PERFORMANCE
      });
      
      this.addCheck({
        name: 'pending_quotes',
        description: 'Old pending quotes (>72h)',
        status: pendingQuotes < 10 ? CheckStatus.PASS :
                pendingQuotes < 30 ? CheckStatus.WARN : CheckStatus.FAIL,
        message: `${pendingQuotes} quotes pending for >72h`,
        value: pendingQuotes,
        threshold: 10,
        severity: CheckSeverity.MEDIUM,
        category: CheckCategory.DATA_INTEGRITY
      });
      
      this.addMetric('total_quotes', totalQuotes);
      this.addMetric('quote_acceptance_rate', acceptanceRate);
      this.addMetric('old_pending_quotes', pendingQuotes);
      
      if (acceptanceRate < 15) {
        this.addRecommendation('Very low quote acceptance. Review pricing strategy and quote quality.');
      }
      
    } catch (error: any) {
      this.addCheck({
        name: 'quote_system',
        description: 'Quote system check',
        status: CheckStatus.ERROR,
        message: `Could not check: ${error.message}`,
        severity: CheckSeverity.MEDIUM,
        category: CheckCategory.PERFORMANCE
      });
    }
  }
  
  private async checkCompletionRate(): Promise<void> {
    try {
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const totalStarted = await this.prisma.assistanceRequest.count({
        where: {
          createdAt: { gte: last30Days },
          status: { in: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] }
        }
      });
      
      const completed = await this.prisma.assistanceRequest.count({
        where: {
          createdAt: { gte: last30Days },
          status: 'COMPLETED'
        }
      });
      
      const cancelled = await this.prisma.assistanceRequest.count({
        where: {
          createdAt: { gte: last30Days },
          status: 'CANCELLED'
        }
      });
      
      const completionRate = totalStarted > 0 ?
        (completed / totalStarted) * 100 : 100;
      const cancellationRate = totalStarted > 0 ?
        (cancelled / totalStarted) * 100 : 0;
      
      this.addCheck({
        name: 'completion_rate',
        description: 'Request completion rate (30 days)',
        status: completionRate > 70 ? CheckStatus.PASS :
                completionRate > 50 ? CheckStatus.WARN : CheckStatus.FAIL,
        message: `${completionRate.toFixed(1)}% completion rate`,
        value: completionRate,
        expected: 70,
        severity: CheckSeverity.HIGH,
        category: CheckCategory.PERFORMANCE
      });
      
      this.addCheck({
        name: 'cancellation_rate',
        description: 'Request cancellation rate (30 days)',
        status: cancellationRate < 10 ? CheckStatus.PASS :
                cancellationRate < 20 ? CheckStatus.WARN : CheckStatus.FAIL,
        message: `${cancellationRate.toFixed(1)}% cancellation rate`,
        value: cancellationRate,
        threshold: 10,
        severity: CheckSeverity.MEDIUM,
        category: CheckCategory.PERFORMANCE
      });
      
      this.addMetric('completion_rate_30d', completionRate);
      this.addMetric('cancellation_rate_30d', cancellationRate);
      
      if (completionRate < 50) {
        this.addRecommendation('Low completion rate. Investigate causes and improve service delivery.');
      }
      
      if (cancellationRate > 20) {
        this.addRecommendation('High cancellation rate. Analyze reasons and improve user experience.');
      }
      
    } catch (error: any) {
      this.addCheck({
        name: 'completion_metrics',
        description: 'Completion metrics check',
        status: CheckStatus.ERROR,
        message: `Could not calculate: ${error.message}`,
        severity: CheckSeverity.MEDIUM,
        category: CheckCategory.PERFORMANCE
      });
    }
  }
  
  private async checkResponseTimes(): Promise<void> {
    try {
      // Calcola tempo medio dalla creazione all'assegnazione
      const recentRequests = await this.prisma.assistanceRequest.findMany({
        where: {
          assignedAt: { not: null },
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          createdAt: true,
          assignedAt: true
        }
      });
      
      if (recentRequests.length > 0) {
        const assignmentTimes = recentRequests.map(req => {
          if (req.assignedAt) {
            return req.assignedAt.getTime() - req.createdAt.getTime();
          }
          return 0;
        }).filter(time => time > 0);
        
        const avgAssignmentTime = assignmentTimes.length > 0 ?
          assignmentTimes.reduce((a, b) => a + b, 0) / assignmentTimes.length : 0;
        
        const avgHours = avgAssignmentTime / (1000 * 60 * 60);
        
        this.addCheck({
          name: 'assignment_speed',
          description: 'Average time to assignment',
          status: avgHours < 2 ? CheckStatus.PASS :
                  avgHours < 6 ? CheckStatus.WARN : CheckStatus.FAIL,
          message: `${avgHours.toFixed(1)} hours average to assignment`,
          value: avgHours,
          threshold: 2,
          severity: CheckSeverity.HIGH,
          category: CheckCategory.PERFORMANCE
        });
        
        this.addMetric('avg_assignment_hours', avgHours);
        
        if (avgHours > 6) {
          this.addRecommendation('Slow assignment times. Improve professional notification system.');
        }
      }
      
    } catch (error: any) {
      this.addCheck({
        name: 'response_times',
        description: 'Response time metrics',
        status: CheckStatus.ERROR,
        message: `Could not measure: ${error.message}`,
        severity: CheckSeverity.MEDIUM,
        category: CheckCategory.PERFORMANCE
      });
    }
  }
  
  private async checkCategorySystem(): Promise<void> {
    try {
      const totalCategories = await this.prisma.category.count();
      const totalSubcategories = await this.prisma.subcategory.count();
      
      // Check categorie senza professionisti
      const categoriesWithoutPros = await this.prisma.category.findMany({
        where: {
          subcategories: {
            none: {
              professionalUserSubcategories: {
                some: {}
              }
            }
          }
        }
      });
      
      this.addCheck({
        name: 'category_system',
        description: 'Category system configuration',
        status: totalCategories > 0 ? CheckStatus.PASS : CheckStatus.FAIL,
        message: `${totalCategories} categories, ${totalSubcategories} subcategories`,
        value: { categories: totalCategories, subcategories: totalSubcategories },
        severity: CheckSeverity.HIGH,
        category: CheckCategory.CONFIGURATION
      });
      
      this.addCheck({
        name: 'category_coverage',
        description: 'Categories with professionals',
        status: categoriesWithoutPros.length === 0 ? CheckStatus.PASS :
                categoriesWithoutPros.length < 3 ? CheckStatus.WARN : CheckStatus.FAIL,
        message: `${categoriesWithoutPros.length} categories without professionals`,
        value: categoriesWithoutPros.length,
        threshold: 0,
        severity: CheckSeverity.MEDIUM,
        category: CheckCategory.CONFIGURATION
      });
      
      this.addMetric('total_categories', totalCategories);
      this.addMetric('total_subcategories', totalSubcategories);
      this.addMetric('categories_without_pros', categoriesWithoutPros.length);
      
      if (categoriesWithoutPros.length > 0) {
        this.addRecommendation('Some categories lack professionals. Recruit professionals for full coverage.');
      }
      
    } catch (error: any) {
      this.addCheck({
        name: 'category_system',
        description: 'Category system check',
        status: CheckStatus.ERROR,
        message: `Could not check: ${error.message}`,
        severity: CheckSeverity.MEDIUM,
        category: CheckCategory.CONFIGURATION
      });
    }
  }
  
  private async checkGeolocationSystem(): Promise<void> {
    // Check configurazione Google Maps
    const hasGoogleMapsKey = process.env.GOOGLE_MAPS_API_KEY ? true : false;
    
    this.addCheck({
      name: 'google_maps_config',
      description: 'Google Maps API configuration',
      status: hasGoogleMapsKey ? CheckStatus.PASS : CheckStatus.WARN,
      message: hasGoogleMapsKey ? 
        'Google Maps API configured' : 
        'Google Maps API key missing',
      severity: CheckSeverity.MEDIUM,
      category: CheckCategory.CONFIGURATION
    });
    
    try {
      // Check richieste con coordinate
      const totalRequests = await this.prisma.assistanceRequest.count();
      const requestsWithLocation = await this.prisma.assistanceRequest.count({
        where: {
          AND: [
            { latitude: { not: null } },
            { longitude: { not: null } }
          ]
        }
      });
      
      const locationRate = totalRequests > 0 ?
        (requestsWithLocation / totalRequests) * 100 : 0;
      
      this.addCheck({
        name: 'location_data',
        description: 'Requests with geolocation',
        status: locationRate > 70 ? CheckStatus.PASS :
                locationRate > 40 ? CheckStatus.WARN : CheckStatus.FAIL,
        message: `${locationRate.toFixed(1)}% requests have location data`,
        value: locationRate,
        expected: 70,
        severity: CheckSeverity.MEDIUM,
        category: CheckCategory.DATA_INTEGRITY
      });
      
      this.addMetric('location_coverage_rate', locationRate);
      
      if (locationRate < 40) {
        this.addRecommendation('Low geolocation coverage. Improve address geocoding process.');
      }
      
    } catch (error: any) {
      this.addCheck({
        name: 'geolocation_system',
        description: 'Geolocation system check',
        status: CheckStatus.ERROR,
        message: `Could not check: ${error.message}`,
        severity: CheckSeverity.LOW,
        category: CheckCategory.CONFIGURATION
      });
    }
  }
  
  private async checkPendingRequests(): Promise<void> {
    try {
      // Check richieste pending per fascia temporale
      const pending24h = await this.prisma.assistanceRequest.count({
        where: {
          status: 'PENDING',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });
      
      const pending48h = await this.prisma.assistanceRequest.count({
        where: {
          status: 'PENDING',
          createdAt: {
            lte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            gte: new Date(Date.now() - 48 * 60 * 60 * 1000)
          }
        }
      });
      
      const pendingOlder = await this.prisma.assistanceRequest.count({
        where: {
          status: 'PENDING',
          createdAt: {
            lte: new Date(Date.now() - 48 * 60 * 60 * 1000)
          }
        }
      });
      
      this.addCheck({
        name: 'pending_backlog',
        description: 'Pending requests backlog',
        status: pendingOlder === 0 ? CheckStatus.PASS :
                pendingOlder < 5 ? CheckStatus.WARN : CheckStatus.FAIL,
        message: `${pending24h} new, ${pending48h} recent, ${pendingOlder} old pending requests`,
        value: { new: pending24h, recent: pending48h, old: pendingOlder },
        severity: CheckSeverity.HIGH,
        category: CheckCategory.PERFORMANCE
      });
      
      this.addMetric('pending_new', pending24h);
      this.addMetric('pending_recent', pending48h);
      this.addMetric('pending_old', pendingOlder);
      
      if (pendingOlder > 5) {
        this.addRecommendation('Clear old pending requests backlog');
      }
      
    } catch (error: any) {
      this.addCheck({
        name: 'pending_requests',
        description: 'Pending requests analysis',
        status: CheckStatus.ERROR,
        message: `Could not analyze: ${error.message}`,
        severity: CheckSeverity.MEDIUM,
        category: CheckCategory.PERFORMANCE
      });
    }
  }
  
  private async calculateMetrics(): Promise<void> {
    try {
      // Calcola metriche aggregate
      const activeUsers = await this.prisma.user.count({
        where: {
          lastLogin: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      });
      
      this.addMetric('active_users_30d', activeUsers);
      
      // Professional metrics
      const totalProfessionals = await this.prisma.user.count({
        where: { role: 'PROFESSIONAL' }
      });
      
      const activeProfessionals = await this.prisma.user.count({
        where: {
          role: 'PROFESSIONAL',
          professionalRequests: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          }
        }
      });
      
      this.addMetric('total_professionals', totalProfessionals);
      this.addMetric('active_professionals_30d', activeProfessionals);
      
      // Average requests per day
      const last7Days = await this.prisma.assistanceRequest.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      });
      
      this.addMetric('avg_requests_per_day', (last7Days / 7).toFixed(1));
      
    } catch (error: any) {
      this.log(`Error calculating metrics: ${error.message}`, 'warning');
    }
  }
  
  private generateRecommendations(): void {
    // Genera raccomandazioni basate sui risultati
    if (this.result.score < 80) {
      this.addRecommendation('Request system needs optimization. Review workflow and assignment process.');
    }
    
    if (this.result.metrics.pending_old > 10) {
      this.addRecommendation('High number of old pending requests. Implement auto-cancellation policy.');
    }
    
    if (this.result.metrics.auto_assignment_rate < 30) {
      this.addRecommendation('Improve automatic assignment algorithm to reduce manual work.');
    }
    
    if (this.result.metrics.completion_rate_30d < 60) {
      this.addRecommendation('Focus on improving service completion rates');
    }
    
    if (this.result.metrics.active_professionals_30d < 10) {
      this.addRecommendation('Low professional engagement. Implement retention strategies.');
    }
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  const checker = new RequestSystemHealthCheck();
  checker.execute().then(result => {
    console.log('\n📊 RISULTATO FINALE:');
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.status === 'critical' ? 1 : 0);
  }).catch(error => {
    console.error('❌ Errore fatale:', error);
    process.exit(1);
  });
}
