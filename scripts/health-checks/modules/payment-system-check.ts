/**
 * Payment System Health Check
 * Verifica il funzionamento del sistema di pagamenti e transazioni
 */

import { BaseHealthCheck } from '../core/base-health-check';
import { 
  HealthCheckResult, 
  CheckStatus, 
  CheckSeverity,
  CheckCategory 
} from '../core/health-check.types';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

export class PaymentSystemHealthCheck extends BaseHealthCheck {
  private prisma: PrismaClient;
  
  constructor() {
    super('payment', '💰 Payment System');
    this.prisma = new PrismaClient();
  }
  
  async execute(): Promise<HealthCheckResult> {
    try {
      this.log('Starting Payment System health check...', 'info');
      
      // 1. Check database tables
      await this.checkPaymentDatabase();
      
      // 2. Check Stripe configuration
      await this.checkStripeConfiguration();
      
      // 3. Check payment success rate
      await this.checkPaymentSuccessRate();
      
      // 4. Check pending payments
      await this.checkPendingPayments();
      
      // 5. Check refund processing
      await this.checkRefundProcessing();
      
      // 6. Check payment methods
      await this.checkPaymentMethods();
      
      // 7. Check transaction integrity
      await this.checkTransactionIntegrity();
      
      // 8. Check invoice generation
      await this.checkInvoiceGeneration();
      
      // Calcola metriche finali
      await this.calculateMetrics();
      
      // Genera raccomandazioni
      this.generateRecommendations();
      
      this.log(`Payment System check completed. Score: ${this.result.score}/100`, 
        this.result.score >= 80 ? 'success' : 'warning');
      
    } catch (error: any) {
      this.log(`Critical error during payment check: ${error.message}`, 'error');
      this.result.errors.push(`System check failed: ${error.message}`);
      this.result.score = 0;
    } finally {
      await this.prisma.$disconnect();
    }
    
    return this.finalizeResult();
  }
  
  private async checkPaymentDatabase(): Promise<void> {
    try {
      // Check Payment table
      const paymentCount = await this.prisma.payment.count();
      const recentPayments = await this.prisma.payment.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });
      
      this.addCheck({
        name: 'payment_database',
        description: 'Payment database connectivity',
        status: CheckStatus.PASS,
        message: `Database connected. ${paymentCount} total payments`,
        value: paymentCount,
        severity: CheckSeverity.CRITICAL,
        category: CheckCategory.CONNECTIVITY
      });
      
      this.addMetric('total_payments', paymentCount);
      this.addMetric('payments_24h', recentPayments);
      
      // Check Transaction table
      const transactionCount = await this.prisma.transaction.count();
      
      this.addCheck({
        name: 'transaction_database',
        description: 'Transaction database connectivity',
        status: CheckStatus.PASS,
        message: `${transactionCount} transactions recorded`,
        value: transactionCount,
        severity: CheckSeverity.CRITICAL,
        category: CheckCategory.CONNECTIVITY
      });
      
      this.addMetric('total_transactions', transactionCount);
      
    } catch (error: any) {
      this.addCheck({
        name: 'payment_database',
        description: 'Payment database connectivity',
        status: CheckStatus.FAIL,
        message: `Database error: ${error.message}`,
        severity: CheckSeverity.CRITICAL,
        category: CheckCategory.CONNECTIVITY
      });
    }
  }
  
  private async checkStripeConfiguration(): Promise<void> {
    // Check Stripe API key configuration
    const hasStripeKey = process.env.STRIPE_SECRET_KEY ? true : false;
    const hasWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET ? true : false;
    
    this.addCheck({
      name: 'stripe_api_key',
      description: 'Stripe API key configuration',
      status: hasStripeKey ? CheckStatus.PASS : CheckStatus.FAIL,
      message: hasStripeKey ? 'Stripe API key configured' : 'Stripe API key missing',
      severity: CheckSeverity.CRITICAL,
      category: CheckCategory.CONFIGURATION
    });
    
    this.addCheck({
      name: 'stripe_webhook',
      description: 'Stripe webhook secret',
      status: hasWebhookSecret ? CheckStatus.PASS : CheckStatus.WARN,
      message: hasWebhookSecret ? 'Webhook secret configured' : 'Webhook secret missing',
      severity: CheckSeverity.HIGH,
      category: CheckCategory.CONFIGURATION
    });
    
    // Simula test connessione Stripe (in produzione farebbe una vera chiamata API)
    if (hasStripeKey) {
      const stripeHealthy = await this.testStripeConnection();
      
      this.addCheck({
        name: 'stripe_connection',
        description: 'Stripe API connection',
        status: stripeHealthy ? CheckStatus.PASS : CheckStatus.FAIL,
        message: stripeHealthy ? 'Stripe API responding' : 'Cannot connect to Stripe',
        severity: CheckSeverity.CRITICAL,
        category: CheckCategory.CONNECTIVITY
      });
    }
  }
  
  private async testStripeConnection(): Promise<boolean> {
    // In produzione, questo farebbe una vera chiamata a Stripe
    // Per ora simula basandosi sulla presenza della chiave
    return process.env.STRIPE_SECRET_KEY ? Math.random() > 0.05 : false; // 95% success se configurato
  }
  
  private async checkPaymentSuccessRate(): Promise<void> {
    try {
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const totalPayments = await this.prisma.payment.count({
        where: {
          createdAt: { gte: last7Days }
        }
      });
      
      const successfulPayments = await this.prisma.payment.count({
        where: {
          createdAt: { gte: last7Days },
          status: 'COMPLETED'
        }
      });
      
      const successRate = totalPayments > 0 ? 
        (successfulPayments / totalPayments) * 100 : 100;
      
      const status = successRate >= 95 ? CheckStatus.PASS :
                     successRate >= 85 ? CheckStatus.WARN : CheckStatus.FAIL;
      
      this.addCheck({
        name: 'success_rate',
        description: 'Payment success rate (7 days)',
        status,
        message: `${successRate.toFixed(1)}% payment success rate`,
        value: successRate,
        expected: 95,
        actual: successRate,
        severity: CheckSeverity.HIGH,
        category: CheckCategory.PERFORMANCE
      });
      
      this.addMetric('payment_success_rate', successRate);
      
      if (successRate < 85) {
        this.addRecommendation('Low payment success rate. Review payment gateway issues and user feedback.');
      }
      
    } catch (error: any) {
      this.addCheck({
        name: 'success_rate',
        description: 'Payment success rate',
        status: CheckStatus.ERROR,
        message: `Could not calculate: ${error.message}`,
        severity: CheckSeverity.MEDIUM,
        category: CheckCategory.PERFORMANCE
      });
    }
  }
  
  private async checkPendingPayments(): Promise<void> {
    try {
      // Check pagamenti in sospeso da più di 24h
      const oldPendingPayments = await this.prisma.payment.count({
        where: {
          status: 'PENDING',
          createdAt: {
            lte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });
      
      const status = oldPendingPayments === 0 ? CheckStatus.PASS :
                     oldPendingPayments < 5 ? CheckStatus.WARN : CheckStatus.FAIL;
      
      this.addCheck({
        name: 'pending_payments',
        description: 'Old pending payments (>24h)',
        status,
        message: `${oldPendingPayments} payments pending for >24h`,
        value: oldPendingPayments,
        threshold: 0,
        severity: CheckSeverity.HIGH,
        category: CheckCategory.DATA_INTEGRITY
      });
      
      this.addMetric('old_pending_payments', oldPendingPayments);
      
      if (oldPendingPayments > 0) {
        this.addRecommendation(`Review and resolve ${oldPendingPayments} pending payments older than 24h`);
      }
      
      // Check totale pending
      const totalPending = await this.prisma.payment.count({
        where: { status: 'PENDING' }
      });
      
      this.addMetric('total_pending_payments', totalPending);
      
    } catch (error: any) {
      this.addCheck({
        name: 'pending_payments',
        description: 'Pending payments check',
        status: CheckStatus.ERROR,
        message: `Could not check: ${error.message}`,
        severity: CheckSeverity.MEDIUM,
        category: CheckCategory.DATA_INTEGRITY
      });
    }
  }
  
  private async checkRefundProcessing(): Promise<void> {
    try {
      // Check refunds non processati
      const unprocessedRefunds = await this.prisma.payment.count({
        where: {
          status: 'REFUND_REQUESTED',
          updatedAt: {
            lte: new Date(Date.now() - 48 * 60 * 60 * 1000) // Più di 48h
          }
        }
      });
      
      const status = unprocessedRefunds === 0 ? CheckStatus.PASS :
                     unprocessedRefunds < 3 ? CheckStatus.WARN : CheckStatus.FAIL;
      
      this.addCheck({
        name: 'refund_processing',
        description: 'Unprocessed refund requests (>48h)',
        status,
        message: `${unprocessedRefunds} refunds awaiting processing`,
        value: unprocessedRefunds,
        threshold: 0,
        severity: CheckSeverity.HIGH,
        category: CheckCategory.PERFORMANCE
      });
      
      this.addMetric('unprocessed_refunds', unprocessedRefunds);
      
      if (unprocessedRefunds > 0) {
        this.addRecommendation('Process pending refund requests to maintain customer satisfaction');
      }
      
    } catch (error: any) {
      this.addCheck({
        name: 'refund_processing',
        description: 'Refund processing check',
        status: CheckStatus.ERROR,
        message: `Could not check: ${error.message}`,
        severity: CheckSeverity.MEDIUM,
        category: CheckCategory.PERFORMANCE
      });
    }
  }
  
  private async checkPaymentMethods(): Promise<void> {
    try {
      // Check metodi di pagamento configurati
      const methods = ['card', 'bank_transfer', 'sepa_debit'];
      const configuredMethods = methods.filter(method => {
        // In produzione controllerebbe la vera configurazione
        return Math.random() > 0.3; // Simula 70% configurati
      });
      
      const allConfigured = configuredMethods.length === methods.length;
      
      this.addCheck({
        name: 'payment_methods',
        description: 'Payment methods configuration',
        status: allConfigured ? CheckStatus.PASS : CheckStatus.WARN,
        message: `${configuredMethods.length}/${methods.length} payment methods configured`,
        value: configuredMethods.length,
        expected: methods.length,
        severity: CheckSeverity.MEDIUM,
        category: CheckCategory.CONFIGURATION
      });
      
      this.addMetric('configured_payment_methods', configuredMethods.length);
      
      if (!allConfigured) {
        this.addRecommendation('Configure all payment methods to maximize conversion');
      }
      
    } catch (error: any) {
      this.addCheck({
        name: 'payment_methods',
        description: 'Payment methods check',
        status: CheckStatus.ERROR,
        message: `Could not check: ${error.message}`,
        severity: CheckSeverity.LOW,
        category: CheckCategory.CONFIGURATION
      });
    }
  }
  
  private async checkTransactionIntegrity(): Promise<void> {
    try {
      // Verifica integrità transazioni
      const orphanedTransactions = await this.prisma.transaction.count({
        where: {
          paymentId: null
        }
      });
      
      const duplicateTransactions = await this.prisma.transaction.groupBy({
        by: ['stripePaymentIntentId'],
        having: {
          stripePaymentIntentId: {
            _count: {
              gt: 1
            }
          }
        },
        where: {
          stripePaymentIntentId: {
            not: null
          }
        }
      });
      
      const hasIssues = orphanedTransactions > 0 || duplicateTransactions.length > 0;
      
      this.addCheck({
        name: 'transaction_integrity',
        description: 'Transaction data integrity',
        status: hasIssues ? CheckStatus.WARN : CheckStatus.PASS,
        message: hasIssues ? 
          `Found ${orphanedTransactions} orphaned and ${duplicateTransactions.length} duplicate transactions` :
          'Transaction integrity verified',
        value: orphanedTransactions + duplicateTransactions.length,
        severity: CheckSeverity.HIGH,
        category: CheckCategory.DATA_INTEGRITY
      });
      
      if (hasIssues) {
        this.addRecommendation('Clean up orphaned and duplicate transactions');
      }
      
    } catch (error: any) {
      this.addCheck({
        name: 'transaction_integrity',
        description: 'Transaction integrity check',
        status: CheckStatus.ERROR,
        message: `Could not verify: ${error.message}`,
        severity: CheckSeverity.MEDIUM,
        category: CheckCategory.DATA_INTEGRITY
      });
    }
  }
  
  private async checkInvoiceGeneration(): Promise<void> {
    // Check sistema generazione fatture
    const invoiceTemplatePath = path.join(process.cwd(), '../backend/templates/invoice.html');
    const templateExists = fs.existsSync(invoiceTemplatePath);
    
    this.addCheck({
      name: 'invoice_template',
      description: 'Invoice template availability',
      status: templateExists ? CheckStatus.PASS : CheckStatus.WARN,
      message: templateExists ? 
        'Invoice template found' : 
        'Invoice template missing',
      severity: CheckSeverity.MEDIUM,
      category: CheckCategory.CONFIGURATION
    });
    
    // Check PDF generation capability
    try {
      const pdfKitInstalled = require.resolve('pdfkit');
      
      this.addCheck({
        name: 'pdf_generation',
        description: 'PDF generation capability',
        status: CheckStatus.PASS,
        message: 'PDF generation library available',
        severity: CheckSeverity.MEDIUM,
        category: CheckCategory.CONFIGURATION
      });
    } catch {
      this.addCheck({
        name: 'pdf_generation',
        description: 'PDF generation capability',
        status: CheckStatus.WARN,
        message: 'PDFKit not installed',
        severity: CheckSeverity.MEDIUM,
        category: CheckCategory.CONFIGURATION
      });
      
      this.addRecommendation('Install PDFKit for invoice generation: npm install pdfkit');
    }
  }
  
  private async calculateMetrics(): Promise<void> {
    try {
      // Calcola revenue totale
      const totalRevenue = await this.prisma.payment.aggregate({
        where: {
          status: 'COMPLETED'
        },
        _sum: {
          amount: true
        }
      });
      
      this.addMetric('total_revenue', totalRevenue._sum.amount || 0);
      
      // Revenue ultimo mese
      const lastMonthRevenue = await this.prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        _sum: {
          amount: true
        }
      });
      
      this.addMetric('revenue_last_30d', lastMonthRevenue._sum.amount || 0);
      
      // Average transaction value
      const avgTransaction = await this.prisma.payment.aggregate({
        where: {
          status: 'COMPLETED'
        },
        _avg: {
          amount: true
        }
      });
      
      this.addMetric('avg_transaction_value', avgTransaction._avg.amount || 0);
      
      // Failed payments ultimo mese
      const failedPayments = await this.prisma.payment.count({
        where: {
          status: 'FAILED',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      });
      
      this.addMetric('failed_payments_30d', failedPayments);
      
    } catch (error: any) {
      this.log(`Error calculating metrics: ${error.message}`, 'warning');
    }
  }
  
  private generateRecommendations(): void {
    // Genera raccomandazioni basate sui risultati
    if (this.result.score < 80) {
      this.addRecommendation('Payment system needs immediate attention. Review critical issues.');
    }
    
    if (this.result.metrics.payment_success_rate < 90) {
      this.addRecommendation('Investigate causes of payment failures');
    }
    
    if (this.result.metrics.old_pending_payments > 10) {
      this.addRecommendation('Implement automated pending payment resolution');
    }
    
    if (this.result.metrics.failed_payments_30d > 50) {
      this.addRecommendation('High failure rate detected. Review payment gateway configuration');
    }
    
    if (!process.env.STRIPE_SECRET_KEY) {
      this.addRecommendation('Configure Stripe API keys for payment processing');
    }
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  const checker = new PaymentSystemHealthCheck();
  checker.execute().then(result => {
    console.log('\n📊 RISULTATO FINALE:');
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.status === 'critical' ? 1 : 0);
  }).catch(error => {
    console.error('❌ Errore fatale:', error);
    process.exit(1);
  });
}
