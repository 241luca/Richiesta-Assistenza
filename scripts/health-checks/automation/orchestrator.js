"use strict";
/**
 * Health Check Master Orchestrator
 * Coordina tutti i componenti del sistema Health Check della Fase 4
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orchestrator = exports.HealthCheckOrchestrator = void 0;
var cron = __importStar(require("node-cron"));
var scheduler_1 = require("./scheduler");
var report_generator_1 = require("./report-generator");
var auto_remediation_1 = require("./auto-remediation");
var performance_monitor_1 = require("./performance-monitor");
var logger_1 = require("../../../backend/src/utils/logger");
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
var HealthCheckOrchestrator = /** @class */ (function () {
    function HealthCheckOrchestrator() {
        this.isRunning = false;
        this.weeklyReportTask = null;
    }
    /**
     * Inizializza e avvia tutto il sistema
     */
    HealthCheckOrchestrator.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isRunning) {
                            logger_1.logger.warn('⚠️ Health Check Orchestrator is already running');
                            return [2 /*return*/];
                        }
                        logger_1.logger.info('🎯 Starting Health Check Orchestrator...');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        // 1. Avvia lo scheduler principale
                        return [4 /*yield*/, scheduler_1.scheduler.start()];
                    case 2:
                        // 1. Avvia lo scheduler principale
                        _a.sent();
                        logger_1.logger.info('✅ Scheduler started');
                        // 2. Configura il report settimanale (ogni lunedì alle 9:00)
                        this.weeklyReportTask = cron.schedule('0 9 * * 1', function () { return __awaiter(_this, void 0, void 0, function () {
                            var error_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        logger_1.logger.info('📊 Generating weekly report...');
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 3, , 4]);
                                        return [4 /*yield*/, report_generator_1.reportGenerator.generateWeeklyReport()];
                                    case 2:
                                        _a.sent();
                                        return [3 /*break*/, 4];
                                    case 3:
                                        error_2 = _a.sent();
                                        logger_1.logger.error('Failed to generate weekly report:', error_2);
                                        return [3 /*break*/, 4];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); });
                        logger_1.logger.info('✅ Weekly report scheduler configured');
                        // 3. Configura il monitoring delle performance
                        return [4 /*yield*/, performance_monitor_1.performanceMonitor.start()];
                    case 3:
                        // 3. Configura il monitoring delle performance
                        _a.sent();
                        logger_1.logger.info('✅ Performance monitor started');
                        // 4. Verifica auto-remediation
                        logger_1.logger.info('✅ Auto-remediation system ready');
                        this.isRunning = true;
                        logger_1.logger.info('🚀 Health Check Orchestrator fully operational');
                        // Esegui un check iniziale
                        return [4 /*yield*/, this.runInitialCheck()];
                    case 4:
                        // Esegui un check iniziale
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        logger_1.logger.error('❌ Failed to start orchestrator:', error_1);
                        throw error_1;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Ferma tutto il sistema
     */
    HealthCheckOrchestrator.prototype.stop = function () {
        if (!this.isRunning) {
            logger_1.logger.warn('⚠️ Orchestrator is not running');
            return;
        }
        logger_1.logger.info('⏹️ Stopping Health Check Orchestrator...');
        // Ferma scheduler
        scheduler_1.scheduler.stop();
        // Ferma report scheduler
        if (this.weeklyReportTask) {
            this.weeklyReportTask.stop();
        }
        // Ferma performance monitor
        performance_monitor_1.performanceMonitor.stop();
        this.isRunning = false;
        logger_1.logger.info('✅ Orchestrator stopped');
    };
    /**
     * Esegue un check iniziale al startup
     */
    HealthCheckOrchestrator.prototype.runInitialCheck = function () {
        return __awaiter(this, void 0, void 0, function () {
            var results, _i, results_1, result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_1.logger.info('🔍 Running initial system check...');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, scheduler_1.scheduler.runManualCheck()];
                    case 2:
                        results = _a.sent();
                        logger_1.logger.info('✅ Initial check completed');
                        if (!Array.isArray(results)) return [3 /*break*/, 6];
                        _i = 0, results_1 = results;
                        _a.label = 3;
                    case 3:
                        if (!(_i < results_1.length)) return [3 /*break*/, 6];
                        result = results_1[_i];
                        if (!(result && result.status === 'critical')) return [3 /*break*/, 5];
                        logger_1.logger.warn("\u26A0\uFE0F Critical issue detected in ".concat(result.module));
                        return [4 /*yield*/, auto_remediation_1.autoRemediation.evaluateAndRemediate(result)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_3 = _a.sent();
                        logger_1.logger.error('Initial check failed:', error_3);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Esegue un health check manuale con remediation
     */
    HealthCheckOrchestrator.prototype.runManualCheckWithRemediation = function (module) {
        return __awaiter(this, void 0, void 0, function () {
            var results, resultsArray, _i, resultsArray_1, result, remediationResult, newResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_1.logger.info("\uD83D\uDD0D Running manual check ".concat(module ? "for ".concat(module) : 'for all modules'));
                        return [4 /*yield*/, scheduler_1.scheduler.runManualCheck(module)];
                    case 1:
                        results = _a.sent();
                        if (!results) return [3 /*break*/, 6];
                        resultsArray = Array.isArray(results) ? results : [results];
                        _i = 0, resultsArray_1 = resultsArray;
                        _a.label = 2;
                    case 2:
                        if (!(_i < resultsArray_1.length)) return [3 /*break*/, 6];
                        result = resultsArray_1[_i];
                        if (!(result && (result.status === 'critical' || result.status === 'warning'))) return [3 /*break*/, 5];
                        return [4 /*yield*/, auto_remediation_1.autoRemediation.evaluateAndRemediate(result)];
                    case 3:
                        remediationResult = _a.sent();
                        if (!remediationResult) return [3 /*break*/, 5];
                        return [4 /*yield*/, scheduler_1.scheduler.runManualCheck(result.module)];
                    case 4:
                        newResult = _a.sent();
                        return [2 /*return*/, {
                                original: result,
                                remediation: remediationResult,
                                afterRemediation: newResult
                            }];
                    case 5:
                        _i++;
                        return [3 /*break*/, 2];
                    case 6: return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Genera un report on-demand
     */
    HealthCheckOrchestrator.prototype.generateReport = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!startDate || !endDate) {
                            // Default: ultima settimana
                            endDate = new Date();
                            startDate = new Date();
                            startDate.setDate(startDate.getDate() - 7);
                        }
                        return [4 /*yield*/, report_generator_1.reportGenerator.generateCustomReport(startDate, endDate)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Ottiene lo stato corrente del sistema
     */
    HealthCheckOrchestrator.prototype.getSystemStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, oneDayAgo, latestResults, stats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = new Date();
                        oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                        return [4 /*yield*/, prisma.healthCheckResult.findMany({
                                where: {
                                    timestamp: { gte: oneDayAgo }
                                },
                                orderBy: { timestamp: 'desc' },
                                distinct: ['module']
                            })];
                    case 1:
                        latestResults = _a.sent();
                        stats = {
                            totalModules: latestResults.length,
                            healthyModules: latestResults.filter(function (r) { return r.status === 'healthy'; }).length,
                            warningModules: latestResults.filter(function (r) { return r.status === 'warning'; }).length,
                            criticalModules: latestResults.filter(function (r) { return r.status === 'critical'; }).length,
                            overallScore: Math.round(latestResults.reduce(function (sum, r) { return sum + r.score; }, 0) / latestResults.length),
                            modules: latestResults.map(function (r) { return ({
                                name: r.module,
                                status: r.status,
                                score: r.score,
                                lastCheck: r.timestamp
                            }); })
                        };
                        return [2 /*return*/, {
                                orchestratorRunning: this.isRunning,
                                schedulerConfig: scheduler_1.scheduler.getConfig(),
                                remediationRules: auto_remediation_1.autoRemediation.getRules().filter(function (r) { return r.enabled; }).length,
                                systemStats: stats,
                                nextWeeklyReport: this.weeklyReportTask ? 'Monday 9:00 AM' : 'Not scheduled'
                            }];
                }
            });
        });
    };
    /**
     * Aggiorna configurazione runtime
     */
    HealthCheckOrchestrator.prototype.updateConfiguration = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, rule;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!config.scheduler) return [3 /*break*/, 2];
                        return [4 /*yield*/, scheduler_1.scheduler.updateConfig(config.scheduler)];
                    case 1:
                        _b.sent();
                        logger_1.logger.info('✅ Scheduler configuration updated');
                        _b.label = 2;
                    case 2:
                        if (!config.remediation) return [3 /*break*/, 7];
                        _i = 0, _a = config.remediation;
                        _b.label = 3;
                    case 3:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        rule = _a[_i];
                        return [4 /*yield*/, auto_remediation_1.autoRemediation.addOrUpdateRule(rule)];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        logger_1.logger.info('✅ Remediation rules updated');
                        _b.label = 7;
                    case 7:
                        if (!config.performance) return [3 /*break*/, 9];
                        return [4 /*yield*/, performance_monitor_1.performanceMonitor.updateConfig(config.performance)];
                    case 8:
                        _b.sent();
                        logger_1.logger.info('✅ Performance monitor configuration updated');
                        _b.label = 9;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Ottiene metriche di performance
     */
    HealthCheckOrchestrator.prototype.getPerformanceMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, performance_monitor_1.performanceMonitor.getMetrics()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Esporta dati per analisi
     */
    HealthCheckOrchestrator.prototype.exportData = function (format, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            var data, filepath, filepath, csv;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.healthCheckResult.findMany({
                            where: {
                                timestamp: {
                                    gte: startDate,
                                    lte: endDate
                                }
                            },
                            orderBy: { timestamp: 'asc' }
                        })];
                    case 1:
                        data = _a.sent();
                        if (format === 'json') {
                            filepath = "/tmp/health-export-".concat(Date.now(), ".json");
                            require('fs').writeFileSync(filepath, JSON.stringify(data, null, 2));
                            return [2 /*return*/, filepath];
                        }
                        else {
                            filepath = "/tmp/health-export-".concat(Date.now(), ".csv");
                            csv = this.convertToCSV(data);
                            require('fs').writeFileSync(filepath, csv);
                            return [2 /*return*/, filepath];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Converte dati in CSV
     */
    HealthCheckOrchestrator.prototype.convertToCSV = function (data) {
        if (data.length === 0)
            return '';
        var headers = Object.keys(data[0]).join(',');
        var rows = data.map(function (row) {
            return Object.values(row).map(function (v) {
                return typeof v === 'object' ? JSON.stringify(v) : v;
            }).join(',');
        });
        return __spreadArray([headers], rows, true).join('\n');
    };
    return HealthCheckOrchestrator;
}());
exports.HealthCheckOrchestrator = HealthCheckOrchestrator;
// Singleton instance
exports.orchestrator = new HealthCheckOrchestrator();
// CLI interface per testing
if (require.main === module) {
    var command = process.argv[2];
    switch (command) {
        case 'start':
            exports.orchestrator.start().then(function () {
                logger_1.logger.info('Orchestrator started via CLI');
            });
            break;
        case 'stop':
            exports.orchestrator.stop();
            logger_1.logger.info('Orchestrator stopped via CLI');
            break;
        case 'check':
            exports.orchestrator.runManualCheckWithRemediation(process.argv[3]).then(function (result) {
                console.log(JSON.stringify(result, null, 2));
                process.exit(0);
            });
            break;
        case 'report':
            exports.orchestrator.generateReport().then(function (filepath) {
                logger_1.logger.info("Report generated: ".concat(filepath));
                process.exit(0);
            });
            break;
        case 'status':
            exports.orchestrator.getSystemStatus().then(function (status) {
                console.log(JSON.stringify(status, null, 2));
                process.exit(0);
            });
            break;
        default:
            console.log("\n        Usage: ts-node orchestrator.ts [command]\n        \n        Commands:\n          start   - Start the orchestrator\n          stop    - Stop the orchestrator\n          check   - Run manual health check\n          report  - Generate report\n          status  - Get system status\n      ");
            process.exit(1);
    }
}
