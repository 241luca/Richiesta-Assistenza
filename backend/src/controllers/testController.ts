import { Request, Response } from 'express';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';
import testRunnerService from '../services/testRunnerService';

class TestController {
  // Esegui tutti i test
  async runAllTests(req: Request, res: Response) {
    try {
      console.log('🚀 Avvio test completi del sistema...');
      
      const report = await testRunnerService.runAllTests();
      
      const summary = {
        health: report.failed === 0 ? 'healthy' : 
                report.failed < 5 ? 'warning' : 'critical',
        score: Math.round((report.passed / report.totalTests) * 100),
        message: report.failed === 0 
          ? '✅ Sistema completamente funzionante!' 
          : report.failed < 5 
            ? '⚠️ Sistema funzionante con alcuni avvisi'
            : '❌ Sono presenti problemi critici da risolvere'
      };

      res.json(ResponseFormatter.success(
        { report, summary },
        'System tests completed successfully',
        {
          totalTests: report.totalTests,
          passed: report.passed,
          failed: report.failed
        }
      ));
    } catch (error: any) {
      logger.error('Error during system tests execution:', error instanceof Error ? error.message : String(error));
      res.status(500).json(ResponseFormatter.error(
        'Failed to execute system tests',
        'SYSTEM_TEST_ERROR',
        { 
          suggestion: 'Verifica che il backend sia avviato e il database sia accessibile'
        }
      ));
    }
  }

  // Esegui test per categoria specifica
  async runCategoryTests(req: Request, res: Response) {
    try {
      const { category } = req.params;
      
      console.log(`🎯 Esecuzione test categoria: ${category}`);
      
      const report = await testRunnerService.runCategoryTests(category);
      
      const summary = {
        health: report.failed === 0 ? 'healthy' : 
                report.failed < 3 ? 'warning' : 'critical',
        score: report.totalTests > 0 
          ? Math.round((report.passed / report.totalTests) * 100) 
          : 0
      };

      res.json(ResponseFormatter.success(
        { report, summary, category },
        `Tests for category '${category}' completed successfully`,
        {
          totalTests: report.totalTests,
          passed: report.passed,
          failed: report.failed
        }
      ));
    } catch (error: any) {
      logger.error(`Error testing category ${req.params.category}:`, error instanceof Error ? error.message : String(error));
      res.status(500).json(ResponseFormatter.error(
        `Failed to execute tests for category '${req.params.category}'`,
        'CATEGORY_TEST_ERROR',
        { category: req.params.category }
      ));
    }
  }

  // Ottieni lo stato del sistema basato sui test
  async getSystemHealth(req: Request, res: Response) {
    try {
      // Esegui test rapidi per determinare lo stato
      const quickTests = await testRunnerService.runCategoryTests('database');
      
      const health = {
        status: quickTests.failed === 0 ? 'operational' : 
                quickTests.failed < 3 ? 'degraded' : 'critical',
        database: quickTests.failed === 0,
        timestamp: new Date(),
        details: {
          passed: quickTests.passed,
          failed: quickTests.failed,
          warnings: quickTests.warnings
        }
      };

      res.json(ResponseFormatter.success(
        health,
        'System health check completed successfully',
        {
          testsExecuted: quickTests.totalTests,
          healthScore: quickTests.totalTests > 0 
            ? Math.round((quickTests.passed / quickTests.totalTests) * 100) 
            : 0
        }
      ));
    } catch (error: any) {
      logger.error('Error during system health check:', error instanceof Error ? error.message : String(error));
      res.status(500).json(ResponseFormatter.error(
        'System health check failed',
        'HEALTH_CHECK_ERROR',
        { timestamp: new Date() }
      ));
    }
  }
}

export default new TestController();
