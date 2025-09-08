"use strict";
/**
 * Health Check Report Generator
 * Genera report PDF settimanali con statistiche e trend
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportGenerator = exports.HealthCheckReportGenerator = void 0;
var client_1 = require("@prisma/client");
var pdfkit_1 = __importDefault(require("pdfkit"));
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var date_fns_1 = require("date-fns");
var locale_1 = require("date-fns/locale");
var notification_service_1 = require("../../../backend/src/services/notification.service");
var logger_1 = require("../../../backend/src/utils/logger");
var prisma = new client_1.PrismaClient();
var notificationService = new notification_service_1.NotificationService();
var HealthCheckReportGenerator = /** @class */ (function () {
    function HealthCheckReportGenerator() {
        this.reportsDir = path.join(__dirname, '../../../reports/health-checks');
        this.ensureReportsDirectory();
    }
    /**
     * Assicura che la directory dei report esista
     */
    HealthCheckReportGenerator.prototype.ensureReportsDirectory = function () {
        if (!fs.existsSync(this.reportsDir)) {
            fs.mkdirSync(this.reportsDir, { recursive: true });
        }
    };
    /**
     * Genera il report settimanale
     */
    HealthCheckReportGenerator.prototype.generateWeeklyReport = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, weekStart, weekEnd, previousWeekStart, currentWeekData, previousWeekData, moduleStats, overallHealth, filename, filepath, _a, _b, error_1;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 7, , 8]);
                        now = new Date();
                        weekStart = (0, date_fns_1.startOfWeek)(now, { weekStartsOn: 1 });
                        weekEnd = (0, date_fns_1.endOfWeek)(now, { weekStartsOn: 1 });
                        previousWeekStart = (0, date_fns_1.startOfWeek)((0, date_fns_1.subWeeks)(now, 1), { weekStartsOn: 1 });
                        logger_1.logger.info('📊 Generating weekly health check report...');
                        return [4 /*yield*/, this.getHealthCheckData(weekStart, weekEnd)];
                    case 1:
                        currentWeekData = _d.sent();
                        return [4 /*yield*/, this.getHealthCheckData(previousWeekStart, weekStart)];
                    case 2:
                        previousWeekData = _d.sent();
                        return [4 /*yield*/, this.calculateModuleStats(currentWeekData, previousWeekData)];
                    case 3:
                        moduleStats = _d.sent();
                        overallHealth = this.calculateOverallHealth(currentWeekData);
                        filename = "health-report-".concat((0, date_fns_1.format)(weekStart, 'yyyy-MM-dd'), ".pdf");
                        filepath = path.join(this.reportsDir, filename);
                        _a = this.createPDF;
                        _b = [filepath];
                        _c = {
                            weekStart: weekStart,
                            weekEnd: weekEnd,
                            moduleStats: moduleStats,
                            overallHealth: overallHealth,
                            totalChecks: currentWeekData.length
                        };
                        return [4 /*yield*/, this.getIncidents(weekStart, weekEnd)];
                    case 4: return [4 /*yield*/, _a.apply(this, _b.concat([(_c.incidents = _d.sent(),
                                _c)]))];
                    case 5:
                        _d.sent();
                        // Invia il report agli admin
                        return [4 /*yield*/, this.sendReportToAdmins(filepath, weekStart)];
                    case 6:
                        // Invia il report agli admin
                        _d.sent();
                        logger_1.logger.info("\u2705 Weekly report generated: ".concat(filename));
                        return [2 /*return*/, filepath];
                    case 7:
                        error_1 = _d.sent();
                        logger_1.logger.error('Error generating weekly report:', error_1);
                        throw error_1;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Recupera i dati dei health check dal database
     */
    HealthCheckReportGenerator.prototype.getHealthCheckData = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.healthCheckResult.findMany({
                            where: {
                                timestamp: {
                                    gte: startDate,
                                    lt: endDate
                                }
                            },
                            orderBy: { timestamp: 'asc' }
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Calcola le statistiche per ogni modulo
     */
    HealthCheckReportGenerator.prototype.calculateModuleStats = function (currentData, previousData) {
        return __awaiter(this, void 0, void 0, function () {
            var modules, stats, _loop_1, this_1, _i, modules_1, module_1;
            return __generator(this, function (_a) {
                modules = __spreadArray([], new Set(currentData.map(function (d) { return d.module; })), true);
                stats = [];
                _loop_1 = function (module_1) {
                    var moduleData = currentData.filter(function (d) { return d.module === module_1; });
                    var prevModuleData = previousData.filter(function (d) { return d.module === module_1; });
                    var scores = moduleData.map(function (d) { return d.score; });
                    var avgScore = scores.reduce(function (a, b) { return a + b; }, 0) / scores.length;
                    var prevAvgScore = prevModuleData.length > 0
                        ? prevModuleData.map(function (d) { return d.score; }).reduce(function (a, b) { return a + b; }, 0) / prevModuleData.length
                        : avgScore;
                    stats.push({
                        module: module_1,
                        avgScore: Math.round(avgScore),
                        minScore: Math.min.apply(Math, scores),
                        maxScore: Math.max.apply(Math, scores),
                        totalChecks: moduleData.length,
                        failureCount: moduleData.filter(function (d) { return d.status === 'critical'; }).length,
                        warningCount: moduleData.filter(function (d) { return d.status === 'warning'; }).length,
                        uptime: this_1.calculateUptime(moduleData),
                        trend: avgScore > prevAvgScore ? 'improving' :
                            avgScore < prevAvgScore ? 'degrading' : 'stable'
                    });
                };
                this_1 = this;
                for (_i = 0, modules_1 = modules; _i < modules_1.length; _i++) {
                    module_1 = modules_1[_i];
                    _loop_1(module_1);
                }
                return [2 /*return*/, stats.sort(function (a, b) { return a.avgScore - b.avgScore; })];
            });
        });
    };
    /**
     * Calcola l'uptime percentuale
     */
    HealthCheckReportGenerator.prototype.calculateUptime = function (data) {
        var healthyChecks = data.filter(function (d) { return d.status === 'healthy'; }).length;
        return Math.round((healthyChecks / data.length) * 100);
    };
    /**
     * Calcola la salute complessiva del sistema
     */
    HealthCheckReportGenerator.prototype.calculateOverallHealth = function (data) {
        if (data.length === 0)
            return 0;
        var totalScore = data.reduce(function (sum, d) { return sum + d.score; }, 0);
        return Math.round(totalScore / data.length);
    };
    /**
     * Recupera gli incidenti della settimana
     */
    HealthCheckReportGenerator.prototype.getIncidents = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            var criticalResults;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.healthCheckResult.findMany({
                            where: {
                                timestamp: {
                                    gte: startDate,
                                    lt: endDate
                                },
                                status: 'critical'
                            },
                            orderBy: { timestamp: 'desc' },
                            take: 10
                        })];
                    case 1:
                        criticalResults = _a.sent();
                        return [2 /*return*/, criticalResults.map(function (r) { return ({
                                module: r.module,
                                timestamp: r.timestamp,
                                score: r.score,
                                errors: r.errors
                            }); })];
                }
            });
        });
    };
    /**
     * Crea il documento PDF
     */
    HealthCheckReportGenerator.prototype.createPDF = function (filepath, data) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var doc = new pdfkit_1.default({
                            size: 'A4',
                            margins: { top: 50, bottom: 50, left: 50, right: 50 }
                        });
                        var stream = fs.createWriteStream(filepath);
                        doc.pipe(stream);
                        // Header
                        doc.fontSize(24)
                            .text('REPORT SETTIMANALE HEALTH CHECK', { align: 'center' })
                            .moveDown();
                        doc.fontSize(12)
                            .text("Periodo: ".concat((0, date_fns_1.format)(data.weekStart, 'dd/MM/yyyy', { locale: locale_1.it }), " - ").concat((0, date_fns_1.format)(data.weekEnd, 'dd/MM/yyyy', { locale: locale_1.it })))
                            .text("Generato: ".concat((0, date_fns_1.format)(new Date(), 'dd/MM/yyyy HH:mm', { locale: locale_1.it })))
                            .moveDown();
                        // Summary Box
                        doc.fontSize(14)
                            .fillColor('#2563eb')
                            .text('RIEPILOGO GENERALE', { underline: true })
                            .fillColor('black')
                            .moveDown(0.5);
                        doc.fontSize(11)
                            .text("Health Score Globale: ".concat(data.overallHealth, "/100"))
                            .text("Controlli Totali: ".concat(data.totalChecks))
                            .text("Moduli Monitorati: ".concat(data.moduleStats.length))
                            .moveDown();
                        // Stato Moduli
                        doc.fontSize(14)
                            .fillColor('#2563eb')
                            .text('STATO DEI MODULI', { underline: true })
                            .fillColor('black')
                            .moveDown(0.5);
                        // Tabella moduli
                        var tableTop = doc.y;
                        var col1 = 50;
                        var col2 = 200;
                        var col3 = 280;
                        var col4 = 360;
                        var col5 = 440;
                        // Header tabella
                        doc.fontSize(10)
                            .text('Modulo', col1, tableTop)
                            .text('Score Medio', col2, tableTop)
                            .text('Uptime %', col3, tableTop)
                            .text('Errori', col4, tableTop)
                            .text('Trend', col5, tableTop);
                        doc.moveTo(col1, tableTop + 15)
                            .lineTo(520, tableTop + 15)
                            .stroke();
                        // Righe tabella
                        var yPosition = tableTop + 25;
                        for (var _i = 0, _a = data.moduleStats; _i < _a.length; _i++) {
                            var stat = _a[_i];
                            var statusColor = stat.avgScore >= 80 ? '#10b981' :
                                stat.avgScore >= 60 ? '#f59e0b' : '#ef4444';
                            doc.fontSize(9)
                                .fillColor('black')
                                .text(stat.module, col1, yPosition)
                                .fillColor(statusColor)
                                .text("".concat(stat.avgScore, "/100"), col2, yPosition)
                                .fillColor('black')
                                .text("".concat(stat.uptime, "%"), col3, yPosition)
                                .text(stat.failureCount.toString(), col4, yPosition);
                            // Trend icon
                            var trendSymbol = stat.trend === 'improving' ? '↑' :
                                stat.trend === 'degrading' ? '↓' : '→';
                            var trendColor = stat.trend === 'improving' ? '#10b981' :
                                stat.trend === 'degrading' ? '#ef4444' : '#6b7280';
                            doc.fillColor(trendColor)
                                .text(trendSymbol, col5, yPosition)
                                .fillColor('black');
                            yPosition += 20;
                            // Nuova pagina se necessario
                            if (yPosition > 700) {
                                doc.addPage();
                                yPosition = 50;
                            }
                        }
                        doc.moveDown(2);
                        // Incidenti critici
                        if (data.incidents.length > 0) {
                            doc.fontSize(14)
                                .fillColor('#ef4444')
                                .text('INCIDENTI CRITICI', { underline: true })
                                .fillColor('black')
                                .moveDown(0.5);
                            for (var _b = 0, _c = data.incidents.slice(0, 5); _b < _c.length; _b++) {
                                var incident = _c[_b];
                                doc.fontSize(9)
                                    .text("\u2022 ".concat((0, date_fns_1.format)(incident.timestamp, 'dd/MM HH:mm'), " - ").concat(incident.module, " (Score: ").concat(incident.score, "/100)"))
                                    .text("  ".concat(incident.errors.join(', ')), { indent: 10 })
                                    .moveDown(0.5);
                            }
                        }
                        // Raccomandazioni
                        doc.moveDown()
                            .fontSize(14)
                            .fillColor('#2563eb')
                            .text('RACCOMANDAZIONI', { underline: true })
                            .fillColor('black')
                            .moveDown(0.5);
                        var recommendations = _this.generateRecommendations(data.moduleStats);
                        doc.fontSize(10);
                        for (var _d = 0, recommendations_1 = recommendations; _d < recommendations_1.length; _d++) {
                            var rec = recommendations_1[_d];
                            doc.text("\u2022 ".concat(rec)).moveDown(0.5);
                        }
                        // Footer
                        doc.fontSize(8)
                            .fillColor('#6b7280')
                            .text('Report generato automaticamente dal Sistema Health Check', 50, 750, { align: 'center' })
                            .text('© 2025 LM Tecnologie - Sistema Richiesta Assistenza', { align: 'center' });
                        doc.end();
                        stream.on('finish', resolve);
                        stream.on('error', reject);
                    })];
            });
        });
    };
    /**
     * Genera raccomandazioni basate sui dati
     */
    HealthCheckReportGenerator.prototype.generateRecommendations = function (stats) {
        var recommendations = [];
        // Moduli critici
        var criticalModules = stats.filter(function (s) { return s.avgScore < 60; });
        if (criticalModules.length > 0) {
            recommendations.push("Attenzione immediata richiesta per: ".concat(criticalModules.map(function (m) { return m.module; }).join(', ')));
        }
        // Moduli in peggioramento
        var degradingModules = stats.filter(function (s) { return s.trend === 'degrading'; });
        if (degradingModules.length > 0) {
            recommendations.push("Monitorare attentamente i moduli in peggioramento: ".concat(degradingModules.map(function (m) { return m.module; }).join(', ')));
        }
        // Uptime basso
        var lowUptimeModules = stats.filter(function (s) { return s.uptime < 90; });
        if (lowUptimeModules.length > 0) {
            recommendations.push("Migliorare la stabilit\u00E0 per: ".concat(lowUptimeModules.map(function (m) { return m.module; }).join(', ')));
        }
        // Raccomandazioni generiche
        if (recommendations.length === 0) {
            recommendations.push('Sistema generalmente stabile, continuare il monitoraggio regolare');
            recommendations.push('Considerare l\'ottimizzazione dei moduli con score < 90');
        }
        return recommendations;
    };
    /**
     * Invia il report agli amministratori
     */
    HealthCheckReportGenerator.prototype.sendReportToAdmins = function (filepath, weekStart) {
        return __awaiter(this, void 0, void 0, function () {
            var admins, weekString, _i, admins_1, admin, error_2;
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
                        weekString = (0, date_fns_1.format)(weekStart, 'dd/MM/yyyy', { locale: locale_1.it });
                        _i = 0, admins_1 = admins;
                        _a.label = 2;
                    case 2:
                        if (!(_i < admins_1.length)) return [3 /*break*/, 5];
                        admin = admins_1[_i];
                        return [4 /*yield*/, notificationService.sendToUser({
                                userId: admin.id,
                                type: 'health_check_report',
                                title: '📊 Report Settimanale Health Check',
                                message: "Il report health check della settimana del ".concat(weekString, " \u00E8 disponibile."),
                                data: {
                                    reportPath: filepath,
                                    weekStart: weekStart.toISOString()
                                },
                                priority: 'normal',
                                channels: ['email', 'websocket']
                            })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        logger_1.logger.info("\uD83D\uDCE7 Report sent to ".concat(admins.length, " administrators"));
                        return [3 /*break*/, 7];
                    case 6:
                        error_2 = _a.sent();
                        logger_1.logger.error('Error sending report to admins:', error_2);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Genera report on-demand
     */
    HealthCheckReportGenerator.prototype.generateCustomReport = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            var data, filename, filepath, moduleStats, overallHealth, _a, _b;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.getHealthCheckData(startDate, endDate)];
                    case 1:
                        data = _d.sent();
                        filename = "health-report-custom-".concat((0, date_fns_1.format)(new Date(), 'yyyy-MM-dd-HHmm'), ".pdf");
                        filepath = path.join(this.reportsDir, filename);
                        return [4 /*yield*/, this.calculateModuleStats(data, [])];
                    case 2:
                        moduleStats = _d.sent();
                        overallHealth = this.calculateOverallHealth(data);
                        _a = this.createPDF;
                        _b = [filepath];
                        _c = {
                            weekStart: startDate,
                            weekEnd: endDate,
                            moduleStats: moduleStats,
                            overallHealth: overallHealth,
                            totalChecks: data.length
                        };
                        return [4 /*yield*/, this.getIncidents(startDate, endDate)];
                    case 3: return [4 /*yield*/, _a.apply(this, _b.concat([(_c.incidents = _d.sent(),
                                _c)]))];
                    case 4:
                        _d.sent();
                        return [2 /*return*/, filepath];
                }
            });
        });
    };
    return HealthCheckReportGenerator;
}());
exports.HealthCheckReportGenerator = HealthCheckReportGenerator;
// Export singleton
exports.reportGenerator = new HealthCheckReportGenerator();
