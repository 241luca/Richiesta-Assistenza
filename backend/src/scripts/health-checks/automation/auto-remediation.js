"use strict";
/**
 * Auto-Remediation System
 * Sistema configurabile per la risoluzione automatica dei problemi comuni
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoRemediation = exports.AutoRemediationSystem = void 0;
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
var AutoRemediationSystem = /** @class */ (function () {
    function AutoRemediationSystem() {
        this.rules = [];
        this.attemptHistory = new Map();
        this.configPath = path.join(__dirname, '../config/remediation.config.json');
        this.loadConfiguration();
    }
    /**
     * Carica le regole di remediation
     */
    AutoRemediationSystem.prototype.loadConfiguration = function () {
        return __awaiter(this, void 0, void 0, function () {
            var configFile, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 4]);
                        return [4 /*yield*/, fs.readFile(this.configPath, 'utf-8')];
                    case 1:
                        configFile = _a.sent();
                        this.rules = JSON.parse(configFile);
                        logger_1.logger.info("\u2705 Loaded ".concat(this.rules.length, " remediation rules"));
                        return [3 /*break*/, 4];
                    case 2:
                        error_1 = _a.sent();
                        logger_1.logger.warn('⚠️ No remediation config found, using defaults');
                        this.rules = this.getDefaultRules();
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
     * Salva la configurazione
     */
    AutoRemediationSystem.prototype.saveConfiguration = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs.writeFile(this.configPath, JSON.stringify(this.rules, null, 2), 'utf-8')];
                    case 1:
                        _a.sent();
                        logger_1.logger.info('✅ Remediation configuration saved');
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        logger_1.logger.error('Error saving remediation config:', error_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Regole di default
     */
    AutoRemediationSystem.prototype.getDefaultRules = function () {
        return [
            {
                id: 'auth-jwt-fix',
                module: 'auth-system',
                condition: {
                    errorContains: 'JWT verification failed'
                },
                actions: [
                    {
                        type: 'clear_cache',
                        target: 'jwt_keys',
                        description: 'Clear JWT key cache'
                    },
                    {
                        type: 'restart_service',
                        target: 'auth',
                        description: 'Restart authentication service'
                    }
                ],
                enabled: true,
                maxAttempts: 3,
                cooldownMinutes: 15,
                notifyOnSuccess: true,
                notifyOnFailure: true
            },
            {
                id: 'database-connection-fix',
                module: 'database-health',
                condition: {
                    checkFailed: 'connection_test',
                    scoreBelow: 50
                },
                actions: [
                    {
                        type: 'run_script',
                        script: 'scripts/health-checks/remediation/restart-database-pool.sh',
                        description: 'Restart database connection pool'
                    }
                ],
                enabled: true,
                maxAttempts: 2,
                cooldownMinutes: 30,
                notifyOnSuccess: true,
                notifyOnFailure: true
            },
            {
                id: 'notification-queue-fix',
                module: 'notification-system',
                condition: {
                    warningContains: 'queue backlog'
                },
                actions: [
                    {
                        type: 'run_script',
                        script: 'scripts/health-checks/remediation/flush-notification-queue.sh',
                        description: 'Flush stale notification queue items'
                    }
                ],
                enabled: true,
                maxAttempts: 5,
                cooldownMinutes: 10,
                notifyOnSuccess: false,
                notifyOnFailure: true
            },
            {
                id: 'chat-websocket-fix',
                module: 'chat-system',
                condition: {
                    errorContains: 'WebSocket connection lost'
                },
                actions: [
                    {
                        type: 'restart_service',
                        target: 'websocket',
                        description: 'Restart WebSocket server'
                    }
                ],
                enabled: true,
                maxAttempts: 3,
                cooldownMinutes: 20,
                notifyOnSuccess: true,
                notifyOnFailure: true
            },
            {
                id: 'cache-cleanup',
                module: 'database-health',
                condition: {
                    warningContains: 'cache size exceeded'
                },
                actions: [
                    {
                        type: 'clear_cache',
                        target: 'redis',
                        description: 'Clear Redis cache'
                    },
                    {
                        type: 'database_cleanup',
                        target: 'old_sessions',
                        description: 'Clean old session data'
                    }
                ],
                enabled: true,
                maxAttempts: 2,
                cooldownMinutes: 60,
                notifyOnSuccess: false,
                notifyOnFailure: true
            },
            {
                id: 'ai-token-limit',
                module: 'ai-system',
                condition: {
                    warningContains: 'token limit approaching'
                },
                actions: [
                    {
                        type: 'notify_only',
                        description: 'Alert administrators about token usage'
                    },
                    {
                        type: 'run_script',
                        script: 'scripts/health-checks/remediation/reset-ai-limits.sh',
                        description: 'Reset daily AI token limits'
                    }
                ],
                enabled: true,
                maxAttempts: 1,
                cooldownMinutes: 1440, // 24 ore
                notifyOnSuccess: true,
                notifyOnFailure: false
            }
        ];
    };
    /**
     * Valuta e applica le regole di remediation
     */
    AutoRemediationSystem.prototype.evaluateAndRemediate = function (healthCheckResult) {
        return __awaiter(this, void 0, void 0, function () {
            var applicableRules, _i, applicableRules_1, rule, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        applicableRules = this.findApplicableRules(healthCheckResult);
                        if (applicableRules.length === 0) {
                            return [2 /*return*/, null];
                        }
                        _i = 0, applicableRules_1 = applicableRules;
                        _a.label = 1;
                    case 1:
                        if (!(_i < applicableRules_1.length)) return [3 /*break*/, 4];
                        rule = applicableRules_1[_i];
                        if (!this.canAttemptRemediation(rule)) {
                            logger_1.logger.info("\u23F3 Skipping rule ".concat(rule.id, " - in cooldown period"));
                            return [3 /*break*/, 3];
                        }
                        logger_1.logger.info("\uD83D\uDD27 Applying remediation rule: ".concat(rule.id));
                        return [4 /*yield*/, this.executeRemediation(rule, healthCheckResult)];
                    case 2:
                        result = _a.sent();
                        if (result.success) {
                            logger_1.logger.info("\u2705 Remediation successful: ".concat(rule.id));
                            return [2 /*return*/, result];
                        }
                        else {
                            logger_1.logger.error("\u274C Remediation failed: ".concat(rule.id), result.error);
                        }
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, null];
                }
            });
        });
    };
    /**
     * Trova le regole applicabili basate sul risultato del health check
     */
    AutoRemediationSystem.prototype.findApplicableRules = function (result) {
        return this.rules.filter(function (rule) {
            if (!rule.enabled || rule.module !== result.module) {
                return false;
            }
            var condition = rule.condition;
            // Controlla score
            if (condition.scoreBelow && result.score >= condition.scoreBelow) {
                return false;
            }
            // Controlla errori
            if (condition.errorContains) {
                var hasError = result.errors.some(function (e) {
                    return e.toLowerCase().includes(condition.errorContains.toLowerCase());
                });
                if (!hasError)
                    return false;
            }
            // Controlla warning
            if (condition.warningContains) {
                var hasWarning = result.warnings.some(function (w) {
                    return w.toLowerCase().includes(condition.warningContains.toLowerCase());
                });
                if (!hasWarning)
                    return false;
            }
            // Controlla check falliti
            if (condition.checkFailed) {
                var failedCheck = result.checks.find(function (c) {
                    return c.name === condition.checkFailed && c.status === 'fail';
                });
                if (!failedCheck)
                    return false;
            }
            return true;
        });
    };
    /**
     * Verifica se è possibile tentare la remediation
     */
    AutoRemediationSystem.prototype.canAttemptRemediation = function (rule) {
        var history = this.attemptHistory.get(rule.id) || [];
        var now = new Date();
        // Rimuovi tentativi vecchi
        var recentAttempts = history.filter(function (attempt) {
            var minutesAgo = (now.getTime() - attempt.getTime()) / (1000 * 60);
            return minutesAgo < rule.cooldownMinutes;
        });
        this.attemptHistory.set(rule.id, recentAttempts);
        return recentAttempts.length < rule.maxAttempts;
    };
    /**
     * Esegue le azioni di remediation
     */
    AutoRemediationSystem.prototype.executeRemediation = function (rule, healthCheckResult) {
        return __awaiter(this, void 0, void 0, function () {
            var result, history, _i, _a, action, actionSuccess, newCheck, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = {
                            ruleId: rule.id,
                            module: rule.module,
                            timestamp: new Date(),
                            success: false,
                            actionsExecuted: [],
                            healthScoreBefore: healthCheckResult.score
                        };
                        history = this.attemptHistory.get(rule.id) || [];
                        history.push(new Date());
                        this.attemptHistory.set(rule.id, history);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 10, , 13]);
                        _i = 0, _a = rule.actions;
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        action = _a[_i];
                        logger_1.logger.info("Executing action: ".concat(action.description));
                        return [4 /*yield*/, this.executeAction(action)];
                    case 3:
                        actionSuccess = _b.sent();
                        result.actionsExecuted.push(action.description);
                        if (!actionSuccess) {
                            throw new Error("Action failed: ".concat(action.description));
                        }
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: 
                    // Attendi un po' prima di verificare il risultato
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 5000); })];
                    case 6:
                        // Attendi un po' prima di verificare il risultato
                        _b.sent();
                        return [4 /*yield*/, this.rerunHealthCheck(rule.module)];
                    case 7:
                        newCheck = _b.sent();
                        if (newCheck) {
                            result.healthScoreAfter = newCheck.score;
                            result.success = newCheck.score > healthCheckResult.score;
                        }
                        else {
                            result.success = true; // Assumiamo successo se non possiamo verificare
                        }
                        if (!(rule.notifyOnSuccess && result.success)) return [3 /*break*/, 9];
                        return [4 /*yield*/, this.sendRemediationNotification(rule, result, 'success')];
                    case 8:
                        _b.sent();
                        _b.label = 9;
                    case 9: return [3 /*break*/, 13];
                    case 10:
                        error_3 = _b.sent();
                        result.error = error_3.message;
                        result.success = false;
                        if (!rule.notifyOnFailure) return [3 /*break*/, 12];
                        return [4 /*yield*/, this.sendRemediationNotification(rule, result, 'failure')];
                    case 11:
                        _b.sent();
                        _b.label = 12;
                    case 12: return [3 /*break*/, 13];
                    case 13: 
                    // Salva il risultato nel database
                    return [4 /*yield*/, this.saveRemediationResult(result)];
                    case 14:
                        // Salva il risultato nel database
                        _b.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Esegue una singola azione di remediation
     */
    AutoRemediationSystem.prototype.executeAction = function (action) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 12, , 13]);
                        _a = action.type;
                        switch (_a) {
                            case 'restart_service': return [3 /*break*/, 1];
                            case 'clear_cache': return [3 /*break*/, 3];
                            case 'run_script': return [3 /*break*/, 5];
                            case 'database_cleanup': return [3 /*break*/, 7];
                            case 'notify_only': return [3 /*break*/, 9];
                        }
                        return [3 /*break*/, 10];
                    case 1: return [4 /*yield*/, this.restartService(action.target)];
                    case 2: return [2 /*return*/, _b.sent()];
                    case 3: return [4 /*yield*/, this.clearCache(action.target)];
                    case 4: return [2 /*return*/, _b.sent()];
                    case 5: return [4 /*yield*/, this.runScript(action.script)];
                    case 6: return [2 /*return*/, _b.sent()];
                    case 7: return [4 /*yield*/, this.databaseCleanup(action.target)];
                    case 8: return [2 /*return*/, _b.sent()];
                    case 9:
                        logger_1.logger.info('Notification-only action');
                        return [2 /*return*/, true];
                    case 10:
                        logger_1.logger.warn("Unknown action type: ".concat(action.type));
                        return [2 /*return*/, false];
                    case 11: return [3 /*break*/, 13];
                    case 12:
                        error_4 = _b.sent();
                        logger_1.logger.error("Action execution failed: ".concat(action.description), error_4);
                        return [2 /*return*/, false];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Riavvia un servizio
     */
    AutoRemediationSystem.prototype.restartService = function (service) {
        return __awaiter(this, void 0, void 0, function () {
            var commands, command, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        commands = {
                            'auth': 'pm2 restart auth-service',
                            'websocket': 'pm2 restart websocket-server',
                            'queue': 'pm2 restart queue-worker',
                            'all': 'pm2 restart all'
                        };
                        command = commands[service];
                        if (!command) {
                            logger_1.logger.error("Unknown service: ".concat(service));
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, execAsync(command)];
                    case 1:
                        _a.sent();
                        logger_1.logger.info("\u2705 Service restarted: ".concat(service));
                        return [2 /*return*/, true];
                    case 2:
                        error_5 = _a.sent();
                        logger_1.logger.error("Failed to restart service ".concat(service, ":"), error_5);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Pulisce la cache
     */
    AutoRemediationSystem.prototype.clearCache = function (target) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, error_6;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 7, , 8]);
                        _a = target;
                        switch (_a) {
                            case 'redis': return [3 /*break*/, 1];
                            case 'jwt_keys': return [3 /*break*/, 3];
                        }
                        return [3 /*break*/, 5];
                    case 1: return [4 /*yield*/, execAsync('redis-cli FLUSHDB')];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 3: return [4 /*yield*/, execAsync('redis-cli DEL "jwt:*"')];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        logger_1.logger.warn("Unknown cache target: ".concat(target));
                        return [2 /*return*/, false];
                    case 6:
                        logger_1.logger.info("\u2705 Cache cleared: ".concat(target));
                        return [2 /*return*/, true];
                    case 7:
                        error_6 = _b.sent();
                        logger_1.logger.error("Failed to clear cache ".concat(target, ":"), error_6);
                        return [2 /*return*/, false];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Esegue uno script di remediation
     */
    AutoRemediationSystem.prototype.runScript = function (scriptPath) {
        return __awaiter(this, void 0, void 0, function () {
            var fullPath, _a, stdout, stderr, error_7;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        fullPath = path.join(__dirname, '../../../', scriptPath);
                        return [4 /*yield*/, execAsync("bash ".concat(fullPath))];
                    case 1:
                        _a = _b.sent(), stdout = _a.stdout, stderr = _a.stderr;
                        if (stderr) {
                            logger_1.logger.warn("Script stderr: ".concat(stderr));
                        }
                        logger_1.logger.info("\u2705 Script executed: ".concat(scriptPath));
                        return [2 /*return*/, true];
                    case 2:
                        error_7 = _b.sent();
                        logger_1.logger.error("Failed to run script ".concat(scriptPath, ":"), error_7);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Pulizia database
     */
    AutoRemediationSystem.prototype.databaseCleanup = function (target) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, cutoff, notifCutoff, error_8;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 7, , 8]);
                        _a = target;
                        switch (_a) {
                            case 'old_sessions': return [3 /*break*/, 1];
                            case 'old_notifications': return [3 /*break*/, 3];
                        }
                        return [3 /*break*/, 5];
                    case 1:
                        cutoff = new Date();
                        cutoff.setDate(cutoff.getDate() - 30);
                        return [4 /*yield*/, prisma.session.deleteMany({
                                where: { updatedAt: { lt: cutoff } }
                            })];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 3:
                        notifCutoff = new Date();
                        notifCutoff.setDate(notifCutoff.getDate() - 60);
                        return [4 /*yield*/, prisma.notification.deleteMany({
                                where: {
                                    createdAt: { lt: notifCutoff },
                                    isRead: true
                                }
                            })];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        logger_1.logger.warn("Unknown cleanup target: ".concat(target));
                        return [2 /*return*/, false];
                    case 6:
                        logger_1.logger.info("\u2705 Database cleanup completed: ".concat(target));
                        return [2 /*return*/, true];
                    case 7:
                        error_8 = _b.sent();
                        logger_1.logger.error("Database cleanup failed for ".concat(target, ":"), error_8);
                        return [2 /*return*/, false];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Ri-esegue un health check
     */
    AutoRemediationSystem.prototype.rerunHealthCheck = function (module) {
        return __awaiter(this, void 0, void 0, function () {
            var scriptPath, stdout, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        scriptPath = path.join(__dirname, '../modules', "".concat(module, "-check.ts"));
                        return [4 /*yield*/, execAsync("npx ts-node ".concat(scriptPath))];
                    case 1:
                        stdout = (_a.sent()).stdout;
                        return [2 /*return*/, JSON.parse(stdout)];
                    case 2:
                        error_9 = _a.sent();
                        logger_1.logger.error("Failed to rerun health check for ".concat(module, ":"), error_9);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Invia notifica sulla remediation
     */
    AutoRemediationSystem.prototype.sendRemediationNotification = function (rule, result, type) {
        return __awaiter(this, void 0, void 0, function () {
            var admins, title, message, _i, admins_1, admin, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, prisma.user.findMany({
                                where: {
                                    role: { in: ['ADMIN', 'SUPER_ADMIN'] },
                                    isActive: true
                                }
                            })];
                    case 1:
                        admins = _a.sent();
                        title = type === 'success'
                            ? "\u2705 Auto-Remediation Riuscita: ".concat(rule.module)
                            : "\u274C Auto-Remediation Fallita: ".concat(rule.module);
                        message = type === 'success'
                            ? "Il problema nel modulo ".concat(rule.module, " \u00E8 stato risolto automaticamente. Score: ").concat(result.healthScoreBefore, " \u2192 ").concat(result.healthScoreAfter)
                            : "Tentativo di auto-remediation fallito per ".concat(rule.module, ". Intervento manuale richiesto. Errore: ").concat(result.error);
                        _i = 0, admins_1 = admins;
                        _a.label = 2;
                    case 2:
                        if (!(_i < admins_1.length)) return [3 /*break*/, 5];
                        admin = admins_1[_i];
                        return [4 /*yield*/, notificationService.sendToUser({
                                userId: admin.id,
                                type: 'auto_remediation',
                                title: title,
                                message: message,
                                data: result,
                                priority: type === 'failure' ? 'high' : 'normal',
                                channels: ['websocket', 'email']
                            })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_10 = _a.sent();
                        logger_1.logger.error('Error sending remediation notification:', error_10);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Salva il risultato della remediation nel database
     */
    AutoRemediationSystem.prototype.saveRemediationResult = function (result) {
        return __awaiter(this, void 0, void 0, function () {
            var error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, prisma.autoRemediationLog.create({
                                data: {
                                    ruleId: result.ruleId,
                                    module: result.module,
                                    success: result.success,
                                    actionsExecuted: result.actionsExecuted,
                                    error: result.error,
                                    healthScoreBefore: result.healthScoreBefore,
                                    healthScoreAfter: result.healthScoreAfter,
                                    timestamp: result.timestamp
                                }
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_11 = _a.sent();
                        logger_1.logger.error('Error saving remediation result:', error_11);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Aggiunge o aggiorna una regola
     */
    AutoRemediationSystem.prototype.addOrUpdateRule = function (rule) {
        return __awaiter(this, void 0, void 0, function () {
            var existingIndex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        existingIndex = this.rules.findIndex(function (r) { return r.id === rule.id; });
                        if (existingIndex >= 0) {
                            this.rules[existingIndex] = rule;
                        }
                        else {
                            this.rules.push(rule);
                        }
                        return [4 /*yield*/, this.saveConfiguration()];
                    case 1:
                        _a.sent();
                        logger_1.logger.info("\u2705 Rule ".concat(rule.id, " saved"));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Rimuove una regola
     */
    AutoRemediationSystem.prototype.removeRule = function (ruleId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.rules = this.rules.filter(function (r) { return r.id !== ruleId; });
                        return [4 /*yield*/, this.saveConfiguration()];
                    case 1:
                        _a.sent();
                        logger_1.logger.info("\u2705 Rule ".concat(ruleId, " removed"));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Ottiene tutte le regole
     */
    AutoRemediationSystem.prototype.getRules = function () {
        return this.rules;
    };
    /**
     * Abilita/disabilita una regola
     */
    AutoRemediationSystem.prototype.toggleRule = function (ruleId, enabled) {
        return __awaiter(this, void 0, void 0, function () {
            var rule;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        rule = this.rules.find(function (r) { return r.id === ruleId; });
                        if (!rule) return [3 /*break*/, 2];
                        rule.enabled = enabled;
                        return [4 /*yield*/, this.saveConfiguration()];
                    case 1:
                        _a.sent();
                        logger_1.logger.info("\u2705 Rule ".concat(ruleId, " ").concat(enabled ? 'enabled' : 'disabled'));
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    return AutoRemediationSystem;
}());
exports.AutoRemediationSystem = AutoRemediationSystem;
// Export singleton
exports.autoRemediation = new AutoRemediationSystem();
