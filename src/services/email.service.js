"use strict";
/**
 * Email Service
 * Servizio per l'invio di email tramite Nodemailer/Brevo
 * Le configurazioni sono gestite dall'admin nel database
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
exports.sendEmail = sendEmail;
exports.updateEmailConfiguration = updateEmailConfiguration;
exports.testEmailConfiguration = testEmailConfiguration;
exports.getEmailLogs = getEmailLogs;
exports.getWelcomeEmailTemplate = getWelcomeEmailTemplate;
exports.getResetPasswordEmailTemplate = getResetPasswordEmailTemplate;
exports.getNewQuoteEmailTemplate = getNewQuoteEmailTemplate;
var nodemailer = __importStar(require("nodemailer"));
var client_1 = require("@prisma/client");
var logger_1 = require("../utils/logger");
var prisma = new client_1.PrismaClient();
// Cache per la configurazione email
var emailConfig = null;
var transporter = null;
/**
 * Recupera la configurazione email dal database
 */
function getEmailConfiguration() {
    return __awaiter(this, void 0, void 0, function () {
        var config, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, prisma.systemSetting.findFirst({
                            where: { key: 'email_configuration' }
                        })];
                case 1:
                    config = _a.sent();
                    if (config && config.value) {
                        emailConfig = JSON.parse(config.value);
                        return [2 /*return*/, emailConfig];
                    }
                    // Configurazione di default per development
                    return [2 /*return*/, {
                            provider: 'brevo',
                            host: 'smtp-relay.brevo.com',
                            port: 587,
                            secure: false,
                            auth: {
                                User: '',
                                pass: ''
                            },
                            from: 'noreply@richiesta-assistenza.it',
                            enabled: false // Disabilitato di default
                        }];
                case 2:
                    error_1 = _a.sent();
                    logger_1.logger.error('Error loading email configuration:', error_1);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Inizializza o aggiorna il transporter
 */
function initializeTransporter() {
    return __awaiter(this, void 0, void 0, function () {
        var config, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getEmailConfiguration()];
                case 1:
                    config = _a.sent();
                    if (!config || !config.enabled) {
                        logger_1.logger.info('📧 Email service disabled or not configured');
                        return [2 /*return*/, null];
                    }
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    transporter = nodemailer.createTransport({
                        host: config.host,
                        port: config.port,
                        secure: config.secure,
                        auth: {
                            User: config.auth.user,
                            pass: config.auth.pass
                        }
                    });
                    // Verifica la configurazione
                    return [4 /*yield*/, transporter.verify()];
                case 3:
                    // Verifica la configurazione
                    _a.sent();
                    logger_1.logger.info('✅ Email transporter initialized successfully');
                    return [2 /*return*/, transporter];
                case 4:
                    error_2 = _a.sent();
                    logger_1.logger.error('❌ Failed to initialize email transporter:', error_2);
                    transporter = null;
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Invia una email
 */
function sendEmail(options) {
    return __awaiter(this, void 0, void 0, function () {
        var config, mailOptions, info, error_3;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 6, , 8]);
                    if (!!transporter) return [3 /*break*/, 2];
                    return [4 /*yield*/, initializeTransporter()];
                case 1:
                    _c.sent();
                    _c.label = 2;
                case 2:
                    // Se ancora non c'è il transporter, logga solo
                    if (!transporter) {
                        logger_1.logger.info('📧 Email (Service Disabled):', {
                            to: options.to,
                            subject: options.subject,
                            preview: (_a = options.text) === null || _a === void 0 ? void 0 : _a.substring(0, 100)
                        });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, getEmailConfiguration()];
                case 3:
                    config = _c.sent();
                    mailOptions = {
                        from: options.from || config.from || 'noreply@richiesta-assistenza.it',
                        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                        subject: options.subject,
                        text: options.text,
                        html: options.html || options.text,
                        replyTo: options.replyTo,
                        attachments: options.attachments
                    };
                    // In development, logga solo l'email invece di inviarla
                    if (process.env.NODE_ENV === 'development' && !config.enabled) {
                        logger_1.logger.info('📧 Email (Development Mode - Not Sent):', {
                            to: mailOptions.to,
                            subject: mailOptions.subject,
                            preview: (_b = options.text) === null || _b === void 0 ? void 0 : _b.substring(0, 100)
                        });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, transporter.sendMail(mailOptions)];
                case 4:
                    info = _c.sent();
                    // Salva nel log delle email inviate
                    return [4 /*yield*/, prisma.emailLog.create({
                            data: {
                                to: mailOptions.to,
                                subject: mailOptions.subject,
                                status: 'sent',
                                messageId: info.messageId,
                                sentAt: new Date()
                            }
                        })];
                case 5:
                    // Salva nel log delle email inviate
                    _c.sent();
                    logger_1.logger.info("\uD83D\uDCE7 Email sent successfully: ".concat(info.messageId), {
                        to: mailOptions.to,
                        subject: mailOptions.subject
                    });
                    return [3 /*break*/, 8];
                case 6:
                    error_3 = _c.sent();
                    // Log errore nel database
                    return [4 /*yield*/, prisma.emailLog.create({
                            data: {
                                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                                subject: options.subject,
                                status: 'failed',
                                error: error_3 instanceof Error ? error_3.message : 'Unknown error',
                                sentAt: new Date()
                            }
                        })];
                case 7:
                    // Log errore nel database
                    _c.sent();
                    logger_1.logger.error('❌ Error sending email:', error_3);
                    throw new Error("Failed to send email: ".concat(error_3 instanceof Error ? error_3.message : 'Unknown error'));
                case 8: return [2 /*return*/];
            }
        });
    });
}
/**
 * Aggiorna la configurazione email (solo admin)
 */
function updateEmailConfiguration(config) {
    return __awaiter(this, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, prisma.systemSetting.upsert({
                            where: { key: 'email_configuration' },
                            update: {
                                value: JSON.stringify(config),
                                updatedAt: new Date()
                            },
                            create: {
                                key: 'email_configuration',
                                value: JSON.stringify(config),
                                description: 'Email service configuration (Brevo/SMTP)'
                            }
                        })];
                case 1:
                    _a.sent();
                    // Reinizializza il transporter con la nuova configurazione
                    emailConfig = config;
                    return [4 /*yield*/, initializeTransporter()];
                case 2:
                    _a.sent();
                    logger_1.logger.info('✅ Email configuration updated successfully');
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _a.sent();
                    logger_1.logger.error('❌ Error updating email configuration:', error_4);
                    throw error_4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Test della configurazione email
 */
function testEmailConfiguration(testEmail) {
    return __awaiter(this, void 0, void 0, function () {
        var error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, sendEmail({
                            to: testEmail,
                            subject: 'Test Email - Richiesta Assistenza',
                            html: "\n        <h2>Test Email</h2>\n        <p>Questa \u00E8 una email di test dal sistema Richiesta Assistenza.</p>\n        <p>Se ricevi questa email, la configurazione \u00E8 corretta!</p>\n        <p>Data invio: ".concat(new Date().toLocaleString('it-IT'), "</p>\n      ")
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, true];
                case 2:
                    error_5 = _a.sent();
                    logger_1.logger.error('Test email failed:', error_5);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Recupera i log delle email
 */
function getEmailLogs() {
    return __awaiter(this, arguments, void 0, function (limit) {
        if (limit === void 0) { limit = 100; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.emailLog.findMany({
                        take: limit,
                        orderBy: { sentAt: 'desc' }
                    })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
/**
 * Template per email di benvenuto
 */
function getWelcomeEmailTemplate(userName, verificationLink) {
    return "\n    <!DOCTYPE html>\n    <html>\n    <head>\n      <style>\n        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n        .header { background-color: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }\n        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }\n        .button { display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }\n        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }\n      </style>\n    </head>\n    <body>\n      <div class=\"container\">\n        <div class=\"header\">\n          <h1>Benvenuto in Richiesta Assistenza!</h1>\n        </div>\n        <div class=\"content\">\n          <h2>Ciao ".concat(userName, "!</h2>\n          <p>Grazie per esserti registrato sulla nostra piattaforma di richiesta assistenza.</p>\n          <p>Con il tuo account potrai:</p>\n          <ul>\n            <li>Richiedere assistenza da professionisti qualificati</li>\n            <li>Ricevere preventivi personalizzati</li>\n            <li>Gestire le tue richieste in tempo reale</li>\n            <li>Comunicare direttamente con i professionisti</li>\n          </ul>\n          ").concat(verificationLink ? "\n            <p>Per completare la registrazione, verifica il tuo indirizzo email:</p>\n            <center>\n              <a href=\"".concat(verificationLink, "\" class=\"button\">Verifica Email</a>\n            </center>\n            <p style=\"font-size: 12px; color: #666;\">\n              Se il pulsante non funziona, copia e incolla questo link nel browser:<br>\n              ").concat(verificationLink, "\n            </p>\n          ") : '', "\n          <p>Se hai domande o necessiti di assistenza, non esitare a contattarci.</p>\n          <p>Cordiali saluti,<br>Il Team di Richiesta Assistenza</p>\n        </div>\n        <div class=\"footer\">\n          <p>Questa email \u00E8 stata inviata a ").concat(userName, ". Se non hai richiesto questa registrazione, ignora questa email.</p>\n          <p>\u00A9 2025 Richiesta Assistenza. Tutti i diritti riservati.</p>\n        </div>\n      </div>\n    </body>\n    </html>\n  ");
}
/**
 * Template per email di reset password
 */
function getResetPasswordEmailTemplate(userName, resetLink) {
    return "\n    <!DOCTYPE html>\n    <html>\n    <head>\n      <style>\n        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n        .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }\n        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }\n        .button { display: inline-block; padding: 12px 24px; background-color: #EF4444; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }\n        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }\n        .warning { background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 10px; margin: 20px 0; }\n      </style>\n    </head>\n    <body>\n      <div class=\"container\">\n        <div class=\"header\">\n          <h1>Reset Password</h1>\n        </div>\n        <div class=\"content\">\n          <h2>Ciao ".concat(userName, ",</h2>\n          <p>Abbiamo ricevuto una richiesta di reset password per il tuo account.</p>\n          <p>Se hai richiesto tu il reset, clicca sul pulsante sottostante per impostare una nuova password:</p>\n          <center>\n            <a href=\"").concat(resetLink, "\" class=\"button\">Reset Password</a>\n          </center>\n          <p style=\"font-size: 12px; color: #666;\">\n            Se il pulsante non funziona, copia e incolla questo link nel browser:<br>\n            ").concat(resetLink, "\n          </p>\n          <div class=\"warning\">\n            <strong>\u26A0\uFE0F Attenzione:</strong> Questo link scadr\u00E0 tra 1 ora per motivi di sicurezza.\n          </div>\n          <p>Se non hai richiesto il reset della password, ignora questa email. Il tuo account rimarr\u00E0 sicuro.</p>\n          <p>Cordiali saluti,<br>Il Team di Richiesta Assistenza</p>\n        </div>\n        <div class=\"footer\">\n          <p>Per motivi di sicurezza, questo link \u00E8 valido solo per 1 ora.</p>\n          <p>\u00A9 2025 Richiesta Assistenza. Tutti i diritti riservati.</p>\n        </div>\n      </div>\n    </body>\n    </html>\n  ");
}
/**
 * Template per notifica nuovo preventivo
 */
function getNewQuoteEmailTemplate(clientName, professionalName, requestTitle, quoteAmount, quoteLink) {
    var formattedAmount = new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR'
    }).format(quoteAmount / 100);
    return "\n    <!DOCTYPE html>\n    <html>\n    <head>\n      <style>\n        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n        .header { background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }\n        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }\n        .quote-box { background-color: white; border: 2px solid #10B981; padding: 20px; border-radius: 8px; margin: 20px 0; }\n        .amount { font-size: 24px; font-weight: bold; color: #10B981; }\n        .button { display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }\n        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }\n      </style>\n    </head>\n    <body>\n      <div class=\"container\">\n        <div class=\"header\">\n          <h1>\uD83D\uDCB0 Nuovo Preventivo Ricevuto!</h1>\n        </div>\n        <div class=\"content\">\n          <h2>Ciao ".concat(clientName, ",</h2>\n          <p>Hai ricevuto un nuovo preventivo per la tua richiesta:</p>\n          <div class=\"quote-box\">\n            <h3>").concat(requestTitle, "</h3>\n            <p><strong>Professionista:</strong> ").concat(professionalName, "</p>\n            <p><strong>Importo:</strong> <span class=\"amount\">").concat(formattedAmount, "</span></p>\n          </div>\n          <p>Visualizza i dettagli completi del preventivo e confrontalo con altri ricevuti:</p>\n          <center>\n            <a href=\"").concat(quoteLink, "\" class=\"button\">Visualizza Preventivo</a>\n          </center>\n          <p>Ricorda che puoi:</p>\n          <ul>\n            <li>Confrontare tutti i preventivi ricevuti</li>\n            <li>Chattare con il professionista per chiarimenti</li>\n            <li>Richiedere modifiche se necessario</li>\n            <li>Accettare il preventivo quando sei pronto</li>\n          </ul>\n          <p>Cordiali saluti,<br>Il Team di Richiesta Assistenza</p>\n        </div>\n        <div class=\"footer\">\n          <p>Questa \u00E8 una notifica automatica. Non rispondere a questa email.</p>\n          <p>\u00A9 2025 Richiesta Assistenza. Tutti i diritti riservati.</p>\n        </div>\n      </div>\n    </body>\n    </html>\n  ");
}
exports.default = {
    sendEmail: sendEmail,
    updateEmailConfiguration: updateEmailConfiguration,
    testEmailConfiguration: testEmailConfiguration,
    getEmailLogs: getEmailLogs,
    getWelcomeEmailTemplate: getWelcomeEmailTemplate,
    getResetPasswordEmailTemplate: getResetPasswordEmailTemplate,
    getNewQuoteEmailTemplate: getNewQuoteEmailTemplate
};
