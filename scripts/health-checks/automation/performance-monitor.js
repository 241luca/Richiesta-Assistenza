"use strict";
/**
 * Performance Monitor
 * Monitora le performance del sistema e delle API
 */
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceMonitor = exports.PerformanceMonitor = void 0;
var client_1 = require("@prisma/client");
var os = __importStar(require("os"));
var logger_1 = require("../../../backend/src/utils/logger");
var prisma = new client_1.PrismaClient();
var PerformanceMonitor = /** @class */ (function () {
    function PerformanceMonitor() {
        this.interval = null;
        this.metricsHistory = [];
        this.config = {
            intervalSeconds: 60,
            historyLimit: 1440, // 24 ore di dati
            alertThresholds: {
                cpuUsage: 80,
                memoryUsage: 85,
                responseTime: 1000,
                errorRate: 5
            }
        };
    }
    /**
     * Avvia il monitoring
     */
    PerformanceMonitor.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.interval) {
                            logger_1.logger.warn('Performance monitor already running');
                            return [2 /*return*/];
                        }
                        logger_1.logger.info('📊 Starting performance monitor...');
                        // Raccogli metriche iniziali
                        return [4 /*yield*/, this.collectMetrics()];
                    case 1:
                        // Raccogli metriche iniziali
                        _a.sent();
                        // Schedula la raccolta periodica
                        this.interval = setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.collectMetrics()];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, this.config.intervalSeconds * 1000);
                        logger_1.logger.info('✅ Performance monitor started');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Ferma il monitoring
     */
    PerformanceMonitor.prototype.stop = function () {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            logger_1.logger.info('⏹️ Performance monitor stopped');
        }
    };
    /**
     * Raccoglie le metriche correnti
     */
    PerformanceMonitor.prototype.collectMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var metrics, error_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 7, , 8]);
                        _a = {
                            timestamp: new Date()
                        };
                        return [4 /*yield*/, this.getCPUMetrics()];
                    case 1:
                        _a.cpu = _b.sent(),
                            _a.memory = this.getMemoryMetrics();
                        return [4 /*yield*/, this.getDatabaseMetrics()];
                    case 2:
                        _a.database = _b.sent();
                        return [4 /*yield*/, this.getAPIMetrics()];
                    case 3:
                        _a.api = _b.sent();
                        return [4 /*yield*/, this.getHealthCheckMetrics()];
                    case 4:
                        metrics = (_a.healthChecks = _b.sent(),
                            _a);
                        // Aggiungi alla history
                        this.metricsHistory.push(metrics);
                        // Mantieni solo il limite configurato
                        if (this.metricsHistory.length > this.config.historyLimit) {
                            this.metricsHistory.shift();
                        }
                        // Controlla alert
                        return [4 /*yield*/, this.checkAlerts(metrics)];
                    case 5:
                        // Controlla alert
                        _b.sent();
                        // Salva nel database
                        return [4 /*yield*/, this.saveMetrics(metrics)];
                    case 6:
                        // Salva nel database
                        _b.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        error_1 = _b.sent();
                        logger_1.logger.error('Error collecting metrics:', error_1);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Ottiene metriche CPU
     */
    PerformanceMonitor.prototype.getCPUMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var cpus, load, totalIdle, totalTick, usage;
            return __generator(this, function (_a) {
                cpus = os.cpus();
                load = os.loadavg();
                totalIdle = 0;
                totalTick = 0;
                cpus.forEach(function (cpu) {
                    for (var type in cpu.times) {
                        totalTick += cpu.times[type];
                    }
                    totalIdle += cpu.times.idle;
                });
                usage = 100 - ~~(100 * totalIdle / totalTick);
                return [2 /*return*/, {
                        usage: usage,
                        load: load
                    }];
            });
        });
    };
    /**
     * Ottiene metriche memoria
     */
    PerformanceMonitor.prototype.getMemoryMetrics = function () {
        var total = os.totalmem();
        var free = os.freemem();
        var used = total - free;
        var percentage = Math.round((used / total) * 100);
        return {
            total: total,
            used: used,
            free: free,
            percentage: percentage
        };
    };
    /**
     * Ottiene metriche database
     */
    PerformanceMonitor.prototype.getDatabaseMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var connectionResult, recentChecks, avgQueryTime, slowQueries, error_2;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, prisma.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n        SELECT count(*) as active_connections \n        FROM pg_stat_activity \n        WHERE state = 'active'\n      "], ["\n        SELECT count(*) as active_connections \n        FROM pg_stat_activity \n        WHERE state = 'active'\n      "])))];
                    case 1:
                        connectionResult = _b.sent();
                        return [4 /*yield*/, prisma.healthCheckResult.findMany({
                                take: 100,
                                orderBy: { timestamp: 'desc' },
                                select: { executionTime: true }
                            })];
                    case 2:
                        recentChecks = _b.sent();
                        avgQueryTime = recentChecks.length > 0
                            ? Math.round(recentChecks.reduce(function (sum, r) { return sum + r.executionTime; }, 0) / recentChecks.length)
                            : 0;
                        slowQueries = recentChecks.filter(function (r) { return r.executionTime > 1000; }).length;
                        return [2 /*return*/, {
                                activeConnections: ((_a = connectionResult[0]) === null || _a === void 0 ? void 0 : _a.active_connections) || 0,
                                queryTime: avgQueryTime,
                                slowQueries: slowQueries
                            }];
                    case 3:
                        error_2 = _b.sent();
                        logger_1.logger.error('Error getting database metrics:', error_2);
                        return [2 /*return*/, {
                                activeConnections: 0,
                                queryTime: 0,
                                slowQueries: 0
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Ottiene metriche API
     */
    PerformanceMonitor.prototype.getAPIMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var oneMinuteAgo, recentResults, failedResults, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        oneMinuteAgo = new Date(Date.now() - 60000);
                        return [4 /*yield*/, prisma.healthCheckResult.count({
                                where: {
                                    timestamp: { gte: oneMinuteAgo }
                                }
                            })];
                    case 1:
                        recentResults = _a.sent();
                        return [4 /*yield*/, prisma.healthCheckResult.count({
                                where: {
                                    timestamp: { gte: oneMinuteAgo },
                                    status: 'critical'
                                }
                            })];
                    case 2:
                        failedResults = _a.sent();
                        return [2 /*return*/, {
                                responseTime: 150, // Placeholder
                                requestsPerMinute: recentResults,
                                errorRate: recentResults > 0 ? (failedResults / recentResults) * 100 : 0
                            }];
                    case 3:
                        error_3 = _a.sent();
                        logger_1.logger.error('Error getting API metrics:', error_3);
                        return [2 /*return*/, {
                                responseTime: 0,
                                requestsPerMinute: 0,
                                errorRate: 0
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Ottiene metriche health checks
     */
    PerformanceMonitor.prototype.getHealthCheckMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var oneHourAgo, recentChecks, avgExecutionTime, failedChecks, failureRate, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        oneHourAgo = new Date(Date.now() - 3600000);
                        return [4 /*yield*/, prisma.healthCheckResult.findMany({
                                where: {
                                    timestamp: { gte: oneHourAgo }
                                },
                                select: {
                                    executionTime: true,
                                    status: true
                                }
                            })];
                    case 1:
                        recentChecks = _a.sent();
                        avgExecutionTime = recentChecks.length > 0
                            ? Math.round(recentChecks.reduce(function (sum, r) { return sum + r.executionTime; }, 0) / recentChecks.length)
                            : 0;
                        failedChecks = recentChecks.filter(function (r) { return r.status === 'critical'; }).length;
                        failureRate = recentChecks.length > 0
                            ? (failedChecks / recentChecks.length) * 100
                            : 0;
                        return [2 /*return*/, {
                                averageExecutionTime: avgExecutionTime,
                                checksPerHour: recentChecks.length,
                                failureRate: Math.round(failureRate)
                            }];
                    case 2:
                        error_4 = _a.sent();
                        logger_1.logger.error('Error getting health check metrics:', error_4);
                        return [2 /*return*/, {
                                averageExecutionTime: 0,
                                checksPerHour: 0,
                                failureRate: 0
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Controlla se servono alert
     */
    PerformanceMonitor.prototype.checkAlerts = function (metrics) {
        return __awaiter(this, void 0, void 0, function () {
            var alerts;
            return __generator(this, function (_a) {
                alerts = [];
                if (metrics.cpu.usage > this.config.alertThresholds.cpuUsage) {
                    alerts.push("CPU usage high: ".concat(metrics.cpu.usage, "%"));
                }
                if (metrics.memory.percentage > this.config.alertThresholds.memoryUsage) {
                    alerts.push("Memory usage high: ".concat(metrics.memory.percentage, "%"));
                }
                if (metrics.api.responseTime > this.config.alertThresholds.responseTime) {
                    alerts.push("API response time slow: ".concat(metrics.api.responseTime, "ms"));
                }
                if (metrics.api.errorRate > this.config.alertThresholds.errorRate) {
                    alerts.push("API error rate high: ".concat(metrics.api.errorRate, "%"));
                }
                if (alerts.length > 0) {
                    logger_1.logger.warn('⚠️ Performance alerts:', alerts);
                    // Qui potresti inviare notifiche usando il NotificationService
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Salva metriche nel database
     */
    PerformanceMonitor.prototype.saveMetrics = function (metrics) {
        return __awaiter(this, void 0, void 0, function () {
            var error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, prisma.performanceMetrics.create({
                                data: {
                                    timestamp: metrics.timestamp,
                                    cpuUsage: metrics.cpu.usage,
                                    memoryUsage: metrics.memory.percentage,
                                    databaseConnections: metrics.database.activeConnections,
                                    apiResponseTime: metrics.api.responseTime,
                                    requestsPerMinute: metrics.api.requestsPerMinute,
                                    errorRate: metrics.api.errorRate,
                                    metrics: metrics
                                }
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _a.sent();
                        // Tabella potrebbe non esistere ancora
                        logger_1.logger.debug('Could not save performance metrics:', error_5.message);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Ottiene le metriche correnti
     */
    PerformanceMonitor.prototype.getMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.metricsHistory.length === 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.collectMetrics()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, this.metricsHistory[this.metricsHistory.length - 1] || null];
                }
            });
        });
    };
    /**
     * Ottiene la history delle metriche
     */
    PerformanceMonitor.prototype.getMetricsHistory = function () {
        return this.metricsHistory;
    };
    /**
     * Aggiorna configurazione
     */
    PerformanceMonitor.prototype.updateConfig = function (newConfig) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.config = __assign(__assign({}, this.config), newConfig);
                        // Riavvia con nuova configurazione
                        this.stop();
                        return [4 /*yield*/, this.start()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Ottiene statistiche aggregate
     */
    PerformanceMonitor.prototype.getAggregateStats = function (minutes) {
        if (minutes === void 0) { minutes = 60; }
        var cutoff = new Date(Date.now() - minutes * 60000);
        var relevantMetrics = this.metricsHistory.filter(function (m) { return m.timestamp >= cutoff; });
        if (relevantMetrics.length === 0) {
            return null;
        }
        return {
            period: "Last ".concat(minutes, " minutes"),
            samples: relevantMetrics.length,
            cpu: {
                avg: Math.round(relevantMetrics.reduce(function (sum, m) { return sum + m.cpu.usage; }, 0) / relevantMetrics.length),
                max: Math.max.apply(Math, relevantMetrics.map(function (m) { return m.cpu.usage; })),
                min: Math.min.apply(Math, relevantMetrics.map(function (m) { return m.cpu.usage; }))
            },
            memory: {
                avg: Math.round(relevantMetrics.reduce(function (sum, m) { return sum + m.memory.percentage; }, 0) / relevantMetrics.length),
                max: Math.max.apply(Math, relevantMetrics.map(function (m) { return m.memory.percentage; })),
                min: Math.min.apply(Math, relevantMetrics.map(function (m) { return m.memory.percentage; }))
            },
            api: {
                avgResponseTime: Math.round(relevantMetrics.reduce(function (sum, m) { return sum + m.api.responseTime; }, 0) / relevantMetrics.length),
                totalRequests: relevantMetrics.reduce(function (sum, m) { return sum + m.api.requestsPerMinute; }, 0),
                avgErrorRate: Math.round(relevantMetrics.reduce(function (sum, m) { return sum + m.api.errorRate; }, 0) / relevantMetrics.length)
            }
        };
    };
    return PerformanceMonitor;
}());
exports.PerformanceMonitor = PerformanceMonitor;
// Export singleton
exports.performanceMonitor = new PerformanceMonitor();
var templateObject_1;
