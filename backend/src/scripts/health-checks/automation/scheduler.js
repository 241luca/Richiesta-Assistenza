"use strict";
/**
 * Health Check Scheduler
 * Sistema di schedulazione configurabile per l'esecuzione automatica dei controlli
 * Integrato con il sistema di notifiche esistente
 */
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
exports.scheduler = exports.HealthCheckScheduler = void 0;
var cron = __importStar(require("node-cron"));
var child_process_1 = require("child_process");
var util_1 = require("util");
var fs = __importStar(require("fs/promises"));
var path = __importStar(require("path"));
var client_1 = require("@prisma/client");
var notification_service_1 = require("../../../backend/src/services/notification.service");
var logger_1 = require("../../../backend/src/utils/logger");
var execAsync = (0, util_1.promisify)(child_process_1.exec);
var prisma = new client_1.PrismaClient();
var notificationService = new notification_service_1.NotificationService();
var HealthCheckScheduler = /** @class */ (function () {
    function HealthCheckScheduler() {
        this.tasks = new Map();
        this.configPath = path.join(__dirname, '../config/schedule.config.json');
        this.loadConfiguration();
    }
    /**
     * Carica la configurazione dal file JSON
     */
    HealthCheckScheduler.prototype.loadConfiguration = function () {
        return __awaiter(this, void 0, void 0, function () {
            var configFile, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 4]);
                        return [4 /*yield*/, fs.readFile(this.configPath, 'utf-8')];
                    case 1:
                        configFile = _a.sent();
                        this.config = JSON.parse(configFile);
                        logger_1.logger.info('✅ Health check schedule configuration loaded');
                        return [3 /*break*/, 4];
                    case 2:
                        error_1 = _a.sent();
                        logger_1.logger.warn('⚠️ No configuration file found, using defaults');
                        this.config = this.getDefaultConfig();
                        return [4 /*yield*/, this.saveConfiguration()];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Salva la configurazione corrente
     */
    HealthCheckScheduler.prototype.saveConfiguration = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8')];
                    case 1:
                        _a.sent();
                        logger_1.logger.info('✅ Configuration saved');
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        logger_1.logger.error('❌ Error saving configuration:', error_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Configurazione di default
     */
    HealthCheckScheduler.prototype.getDefaultConfig = function () {
        return {
            enabled: true,
            interval: '*/30 * * * *', // Ogni 30 minuti
            modules: {
                'auth-system': '*/15 * * * *', // Ogni 15 minuti
                'database-health': '*/5 * * * *', // Ogni 5 minuti
                'notification-system': '*/30 * * * *', // Ogni 30 minuti
                'backup-system': '0 */6 * * *', // Ogni 6 ore
                'chat-system': '*/20 * * * *', // Ogni 20 minuti
                'payment-system': '0 * * * *', // Ogni ora
                'ai-system': '*/30 * * * *', // Ogni 30 minuti
                'request-system': '*/15 * * * *' // Ogni 15 minuti
            },
            alerts: {
                enabled: true,
                channels: ['email', 'websocket'],
                thresholds: {
                    critical: 60,
                    warning: 80
                }
            },
            retention: {
                days: 30,
                compress: true
            }
        };
    };
    /**
     * Avvia lo scheduler
     */
    HealthCheckScheduler.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var mainTask, _loop_1, this_1, _i, _a, _b, module_1, cronExpression, cleanupTask;
            var _this = this;
            return __generator(this, function (_c) {
                if (!this.config.enabled) {
                    logger_1.logger.info('⏸️ Health check scheduler is disabled');
                    return [2 /*return*/];
                }
                logger_1.logger.info('🚀 Starting health check scheduler...');
                // Schedule principale per tutti i moduli
                if (this.config.interval) {
                    mainTask = cron.schedule(this.config.interval, function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.runAllChecks()];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    this.tasks.set('main', mainTask);
                }
                _loop_1 = function (module_1, cronExpression) {
                    if (cronExpression) {
                        var task = cron.schedule(cronExpression, function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.runModuleCheck(module_1)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        this_1.tasks.set(module_1, task);
                        logger_1.logger.info("\uD83D\uDCC5 Scheduled ".concat(module_1, ": ").concat(cronExpression));
                    }
                };
                this_1 = this;
                // Schedule specifici per modulo
                for (_i = 0, _a = Object.entries(this.config.modules); _i < _a.length; _i++) {
                    _b = _a[_i], module_1 = _b[0], cronExpression = _b[1];
                    _loop_1(module_1, cronExpression);
                }
                cleanupTask = cron.schedule('0 2 * * *', function () { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.cleanupOldResults()];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                this.tasks.set('cleanup', cleanupTask);
                logger_1.logger.info('✅ Scheduler started with ' + this.tasks.size + ' tasks');
                return [2 /*return*/];
            });
        });
    };
    /**
     * Ferma lo scheduler
     */
    HealthCheckScheduler.prototype.stop = function () {
        logger_1.logger.info('⏹️ Stopping health check scheduler...');
        for (var _i = 0, _a = this.tasks; _i < _a.length; _i++) {
            var _b = _a[_i], name_1 = _b[0], task = _b[1];
            task.stop();
            logger_1.logger.info("\u23F9\uFE0F Stopped task: ".concat(name_1));
        }
        this.tasks.clear();
    };
    /**
     * Esegue il controllo di un singolo modulo
     */
    HealthCheckScheduler.prototype.runModuleCheck = function (moduleName) {
        return __awaiter(this, void 0, void 0, function () {
            var scriptPath, startTime, _a, stdout, stderr, result, error_3, errorResult;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 7]);
                        logger_1.logger.info("\uD83D\uDD0D Running health check for: ".concat(moduleName));
                        scriptPath = path.join(__dirname, '../modules', "".concat(moduleName, "-check.ts"));
                        startTime = Date.now();
                        return [4 /*yield*/, execAsync("npx ts-node ".concat(scriptPath))];
                    case 1:
                        _a = _b.sent(), stdout = _a.stdout, stderr = _a.stderr;
                        if (stderr) {
                            logger_1.logger.error("Error in ".concat(moduleName, ":"), stderr);
                        }
                        result = JSON.parse(stdout);
                        result.executionTime = Date.now() - startTime;
                        // Salva il risultato nel database
                        return [4 /*yield*/, this.saveResult(result)];
                    case 2:
                        // Salva il risultato nel database
                        _b.sent();
                        // Controlla se servono alert
                        return [4 /*yield*/, this.checkAlerts(result)];
                    case 3:
                        // Controlla se servono alert
                        _b.sent();
                        logger_1.logger.info("\u2705 ".concat(moduleName, " check completed - Score: ").concat(result.score, "/100"));
                        return [2 /*return*/, result];
                    case 4:
                        error_3 = _b.sent();
                        logger_1.logger.error("\u274C Error running ".concat(moduleName, " check:"), error_3);
                        errorResult = {
                            module: moduleName,
                            timestamp: new Date(),
                            status: 'unknown',
                            score: 0,
                            checks: [],
                            warnings: [],
                            errors: ["Failed to execute health check: ".concat(error_3.message)],
                            executionTime: 0
                        };
                        return [4 /*yield*/, this.saveResult(errorResult)];
                    case 5:
                        _b.sent();
                        return [4 /*yield*/, this.checkAlerts(errorResult)];
                    case 6:
                        _b.sent();
                        return [2 /*return*/, errorResult];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Esegue tutti i controlli
     */
    HealthCheckScheduler.prototype.runAllChecks = function () {
        return __awaiter(this, void 0, void 0, function () {
            var modules, results, validResults, totalScore, averageScore;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_1.logger.info('🔄 Running all health checks...');
                        modules = Object.keys(this.config.modules);
                        return [4 /*yield*/, Promise.all(modules.map(function (module) { return _this.runModuleCheck(module); }))];
                    case 1:
                        results = _a.sent();
                        validResults = results.filter(function (r) { return r !== null; });
                        totalScore = validResults.reduce(function (sum, r) { return sum + r.score; }, 0);
                        averageScore = Math.round(totalScore / validResults.length);
                        logger_1.logger.info("\uD83D\uDCCA Overall health score: ".concat(averageScore, "/100"));
                        if (!(averageScore < this.config.alerts.thresholds.critical)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.sendNotification('critical', '🚨 Sistema in stato critico', "Health score globale: ".concat(averageScore, "/100. Intervento immediato richiesto."), { score: averageScore, modules: validResults })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Salva il risultato nel database
     */
    HealthCheckScheduler.prototype.saveResult = function (result) {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, prisma.healthCheckResult.create({
                                data: {
                                    module: result.module,
                                    status: result.status,
                                    score: result.score,
                                    checks: result.checks,
                                    warnings: result.warnings,
                                    errors: result.errors,
                                    metrics: result,
                                    executionTime: result.executionTime,
                                    timestamp: result.timestamp
                                }
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _a.sent();
                        logger_1.logger.error('Error saving health check result:', error_4);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Controlla se servono alert basati sui risultati
     */
    HealthCheckScheduler.prototype.checkAlerts = function (result) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, critical, warning;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.config.alerts.enabled)
                            return [2 /*return*/];
                        _a = this.config.alerts.thresholds, critical = _a.critical, warning = _a.warning;
                        if (!(result.score < critical)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.sendNotification('critical', "\uD83D\uDEA8 ".concat(result.module, " - CRITICO"), "Score: ".concat(result.score, "/100. Errori: ").concat(result.errors.join(', ')), result)];
                    case 1:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 2:
                        if (!(result.score < warning)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.sendNotification('warning', "\u26A0\uFE0F ".concat(result.module, " - ATTENZIONE"), "Score: ".concat(result.score, "/100. Avvisi: ").concat(result.warnings.join(', ')), result)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Invia notifica usando il sistema esistente
     */
    HealthCheckScheduler.prototype.sendNotification = function (severity, title, message, data) {
        return __awaiter(this, void 0, void 0, function () {
            var priorityMap, admins, _i, admins_1, admin, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        priorityMap = {
                            'critical': 'urgent',
                            'warning': 'high',
                            'info': 'normal'
                        };
                        return [4 /*yield*/, prisma.user.findMany({
                                where: {
                                    role: { in: ['ADMIN', 'SUPER_ADMIN'] },
                                    isActive: true
                                },
                                select: { id: true }
                            })];
                    case 1:
                        admins = _a.sent();
                        _i = 0, admins_1 = admins;
                        _a.label = 2;
                    case 2:
                        if (!(_i < admins_1.length)) return [3 /*break*/, 5];
                        admin = admins_1[_i];
                        return [4 /*yield*/, notificationService.sendToUser({
                                userId: admin.id,
                                type: 'health_check_alert',
                                title: title,
                                message: message,
                                data: data,
                                priority: priorityMap[severity],
                                channels: this.config.alerts.channels
                            })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        logger_1.logger.info("\uD83D\uDCE7 Alert sent: ".concat(title));
                        return [3 /*break*/, 7];
                    case 6:
                        error_5 = _a.sent();
                        logger_1.logger.error('Error sending alert:', error_5);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Pulisce i risultati vecchi dal database
     */
    HealthCheckScheduler.prototype.cleanupOldResults = function () {
        return __awaiter(this, void 0, void 0, function () {
            var cutoffDate, deleted, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        cutoffDate = new Date();
                        cutoffDate.setDate(cutoffDate.getDate() - this.config.retention.days);
                        return [4 /*yield*/, prisma.healthCheckResult.deleteMany({
                                where: {
                                    timestamp: { lt: cutoffDate }
                                }
                            })];
                    case 1:
                        deleted = _a.sent();
                        logger_1.logger.info("\uD83E\uDDF9 Cleaned up ".concat(deleted.count, " old health check results"));
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _a.sent();
                        logger_1.logger.error('Error cleaning up old results:', error_6);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Aggiorna la configurazione runtime
     */
    HealthCheckScheduler.prototype.updateConfig = function (newConfig) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.config = __assign(__assign({}, this.config), newConfig);
                        return [4 /*yield*/, this.saveConfiguration()];
                    case 1:
                        _a.sent();
                        // Riavvia lo scheduler con la nuova configurazione
                        this.stop();
                        return [4 /*yield*/, this.start()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Ottiene la configurazione corrente
     */
    HealthCheckScheduler.prototype.getConfig = function () {
        return this.config;
    };
    /**
     * Esegue un check manuale immediato
     */
    HealthCheckScheduler.prototype.runManualCheck = function (module) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!module) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.runModuleCheck(module)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, this.runAllChecks()];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return HealthCheckScheduler;
}());
exports.HealthCheckScheduler = HealthCheckScheduler;
// Export singleton instance
exports.scheduler = new HealthCheckScheduler();
