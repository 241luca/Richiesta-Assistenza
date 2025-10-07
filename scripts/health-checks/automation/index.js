"use strict";
/**
 * Health Check Automation System - Main Export
 * Fase 4: Automation & Alerts
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
exports.HealthCheckOrchestrator = exports.orchestrator = exports.PerformanceMonitor = exports.performanceMonitor = exports.AutoRemediationSystem = exports.autoRemediation = exports.HealthCheckReportGenerator = exports.reportGenerator = exports.HealthCheckScheduler = exports.scheduler = void 0;
exports.startHealthCheckAutomation = startHealthCheckAutomation;
exports.stopHealthCheckAutomation = stopHealthCheckAutomation;
exports.runManualHealthCheck = runManualHealthCheck;
exports.generateHealthReport = generateHealthReport;
exports.getHealthSystemStatus = getHealthSystemStatus;
var scheduler_1 = require("./scheduler");
Object.defineProperty(exports, "scheduler", { enumerable: true, get: function () { return scheduler_1.scheduler; } });
Object.defineProperty(exports, "HealthCheckScheduler", { enumerable: true, get: function () { return scheduler_1.HealthCheckScheduler; } });
var report_generator_1 = require("./report-generator");
Object.defineProperty(exports, "reportGenerator", { enumerable: true, get: function () { return report_generator_1.reportGenerator; } });
Object.defineProperty(exports, "HealthCheckReportGenerator", { enumerable: true, get: function () { return report_generator_1.HealthCheckReportGenerator; } });
var auto_remediation_1 = require("./auto-remediation");
Object.defineProperty(exports, "autoRemediation", { enumerable: true, get: function () { return auto_remediation_1.autoRemediation; } });
Object.defineProperty(exports, "AutoRemediationSystem", { enumerable: true, get: function () { return auto_remediation_1.AutoRemediationSystem; } });
var performance_monitor_1 = require("./performance-monitor");
Object.defineProperty(exports, "performanceMonitor", { enumerable: true, get: function () { return performance_monitor_1.performanceMonitor; } });
Object.defineProperty(exports, "PerformanceMonitor", { enumerable: true, get: function () { return performance_monitor_1.PerformanceMonitor; } });
var orchestrator_1 = require("./orchestrator");
Object.defineProperty(exports, "orchestrator", { enumerable: true, get: function () { return orchestrator_1.orchestrator; } });
Object.defineProperty(exports, "HealthCheckOrchestrator", { enumerable: true, get: function () { return orchestrator_1.HealthCheckOrchestrator; } });
/**
 * Inizializza e avvia tutto il sistema di automazione
 */
function startHealthCheckAutomation() {
    return __awaiter(this, void 0, void 0, function () {
        var orchestrator;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('./orchestrator')); })];
                case 1:
                    orchestrator = (_a.sent()).orchestrator;
                    return [4 /*yield*/, orchestrator.start()];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Ferma il sistema di automazione
 */
function stopHealthCheckAutomation() {
    var orchestrator = require('./orchestrator').orchestrator;
    orchestrator.stop();
}
/**
 * Esegue un check manuale
 */
function runManualHealthCheck(module) {
    return __awaiter(this, void 0, void 0, function () {
        var orchestrator;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('./orchestrator')); })];
                case 1:
                    orchestrator = (_a.sent()).orchestrator;
                    return [4 /*yield*/, orchestrator.runManualCheckWithRemediation(module)];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
/**
 * Genera un report on-demand
 */
function generateHealthReport(startDate, endDate) {
    return __awaiter(this, void 0, void 0, function () {
        var orchestrator;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('./orchestrator')); })];
                case 1:
                    orchestrator = (_a.sent()).orchestrator;
                    return [4 /*yield*/, orchestrator.generateReport(startDate, endDate)];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
/**
 * Ottiene lo stato del sistema
 */
function getHealthSystemStatus() {
    return __awaiter(this, void 0, void 0, function () {
        var orchestrator;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('./orchestrator')); })];
                case 1:
                    orchestrator = (_a.sent()).orchestrator;
                    return [4 /*yield*/, orchestrator.getSystemStatus()];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
