"use strict";
/**
 * Notification Service
 * Gestisce l'invio di notifiche attraverso vari canali (WebSocket, Email, SMS)
 * FIXED: Corretti tutti i problemi critici di nomenclatura database
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
exports.broadcastNotification = exports.sendNotification = exports.notificationService = exports.NotificationService = void 0;
var client_1 = require("@prisma/client");
var logger_1 = require("../utils/logger");
var notification_handler_1 = require("../websocket/handlers/notification.handler");
var email_service_1 = require("./email.service");
var uuid_1 = require("uuid");
var responseFormatter_1 = require("../utils/responseFormatter");
var prisma = new client_1.PrismaClient();
var NotificationService = /** @class */ (function () {
    function NotificationService() {
        this.io = null;
        // L'istanza di Socket.io verrà impostata dal server principale
    }
    /**
     * Imposta l'istanza di Socket.io
     */
    NotificationService.prototype.setIO = function (io) {
        this.io = io;
    };
    /**
     * Invia una notifica a un utente specifico
     */
    NotificationService.prototype.sendToUser = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var preferences, channels, notification, promises, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!data.userId) {
                            throw new Error('userId is required for user notifications');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, this.getUserPreferences(data.userId)];
                    case 2:
                        preferences = _a.sent();
                        channels = data.channels || this.getDefaultChannels(data.priority);
                        return [4 /*yield*/, prisma.notification.create({
                                data: {
                                    id: (0, uuid_1.v4)(), // ✅ FIX 1: Genera sempre UUID
                                    type: data.type,
                                    title: data.title,
                                    content: data.message, // ✅ FIX 2: Usa 'content' non 'message'
                                    recipientId: data.userId,
                                    priority: this.normalizePriority(data.priority), // ✅ FIX 3: Converti in MAIUSCOLO
                                    isRead: false,
                                    metadata: data.data || {} // Campo corretto per dati extra
                                }
                            })];
                    case 3:
                        notification = _a.sent();
                        promises = [];
                        if (channels.includes('websocket') && preferences.websocket && this.io) {
                            promises.push((0, notification_handler_1.sendNotificationToUser)(this.io, data.userId, {
                                type: data.type,
                                title: data.title,
                                message: data.message,
                                data: data.data,
                                priority: data.priority
                            }));
                        }
                        if (channels.includes('email') && preferences.email) {
                            promises.push(this.sendEmailNotification(data.userId, data));
                        }
                        if (channels.includes('sms') && preferences.sms) {
                            promises.push(this.sendSMSNotification(data.userId, data));
                        }
                        if (channels.includes('push') && preferences.push) {
                            promises.push(this.sendPushNotification(data.userId, data));
                        }
                        return [4 /*yield*/, Promise.allSettled(promises)];
                    case 4:
                        _a.sent();
                        logger_1.logger.info("Notification sent to user ".concat(data.userId, ": ").concat(data.title));
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        logger_1.logger.error('Error sending notification to user:', error_1);
                        throw error_1;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Invia una notifica a tutti gli utenti
     */
    NotificationService.prototype.broadcastToAll = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var users, error_2;
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        if (this.io) {
                            // Broadcast to all connected users
                            this.io.emit('notification', {
                                type: data.type,
                                title: data.title,
                                message: data.message,
                                data: data.data,
                                priority: data.priority
                            });
                        }
                        if (!((_a = data.channels) === null || _a === void 0 ? void 0 : _a.includes('email'))) return [3 /*break*/, 3];
                        return [4 /*yield*/, prisma.user.findMany({
                                select: { id: true, email: true }
                            })];
                    case 1:
                        users = _b.sent();
                        return [4 /*yield*/, Promise.allSettled(users.map(function (user) { return _this.sendEmailNotification(user.id, data); }))];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        logger_1.logger.info("Notification broadcasted to all users: ".concat(data.title));
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _b.sent();
                        logger_1.logger.error('Error broadcasting notification:', error_2);
                        throw error_2;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Invia una notifica a un ruolo specifico
     */
    NotificationService.prototype.sendToRole = function (role, data) {
        return __awaiter(this, void 0, void 0, function () {
            var users, error_3;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, prisma.user.findMany({
                                where: {
                                    role: role
                                },
                                select: { id: true }
                            })];
                    case 1:
                        users = _a.sent();
                        return [4 /*yield*/, Promise.allSettled(users.map(function (user) { return _this.sendToUser(__assign(__assign({}, data), { userId: user.id })); }))];
                    case 2:
                        _a.sent();
                        logger_1.logger.info("Notification sent to role ".concat(role, ": ").concat(data.title));
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        logger_1.logger.error('Error sending notification to role:', error_3);
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Recupera le preferenze di notifica di un utente
     */
    NotificationService.prototype.getUserPreferences = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var preferences;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.notificationPreference.findUnique({
                            where: { userId: userId }
                        })];
                    case 1:
                        preferences = _a.sent();
                        return [2 /*return*/, preferences || {
                                email: true,
                                push: true,
                                sms: false,
                                websocket: true, // Default: websocket enabled
                                emailNotifications: true,
                                pushNotifications: true,
                                smsNotifications: false
                            }];
                }
            });
        });
    };
    /**
     * Normalizza la priorità per il database (MAIUSCOLO)
     * FIX 3: Converte sempre in maiuscolo per l'enum del database
     */
    NotificationService.prototype.normalizePriority = function (priority) {
        var normalizedPriority = (priority || 'normal').toUpperCase();
        switch (normalizedPriority) {
            case 'LOW':
                return 'LOW';
            case 'HIGH':
                return 'HIGH';
            case 'URGENT':
                return 'URGENT';
            case 'NORMAL':
            default:
                return 'NORMAL';
        }
    };
    /**
     * Determina i canali di default basati sulla priorità
     */
    NotificationService.prototype.getDefaultChannels = function (priority) {
        switch (priority === null || priority === void 0 ? void 0 : priority.toLowerCase()) {
            case 'urgent':
                return ['websocket', 'email', 'sms', 'push'];
            case 'high':
                return ['websocket', 'email', 'push'];
            case 'normal':
                return ['websocket', 'email'];
            case 'low':
            default:
                return ['websocket'];
        }
    };
    /**
     * Invia notifica via email
     */
    NotificationService.prototype.sendEmailNotification = function (userId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var user, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 6]);
                        return [4 /*yield*/, prisma.user.findUnique({
                                where: { id: userId },
                                select: { email: true, firstName: true, lastName: true }
                            })];
                    case 1:
                        user = _a.sent();
                        if (!user)
                            return [2 /*return*/];
                        return [4 /*yield*/, (0, email_service_1.sendEmail)({
                                to: user.email,
                                subject: data.title,
                                html: this.formatEmailContent(data, user)
                            })];
                    case 2:
                        _a.sent();
                        // FIXED: Log notifica email nel database
                        return [4 /*yield*/, prisma.notificationLog.create({
                                data: {
                                    id: (0, uuid_1.v4)(),
                                    recipientId: userId,
                                    recipientEmail: user.email,
                                    channel: 'email',
                                    status: 'sent',
                                    subject: data.title,
                                    content: data.message,
                                    variables: data.data || {},
                                    sentAt: new Date()
                                }
                            })];
                    case 3:
                        // FIXED: Log notifica email nel database
                        _a.sent();
                        logger_1.logger.debug("Email notification sent to ".concat(user.email));
                        return [3 /*break*/, 6];
                    case 4:
                        error_4 = _a.sent();
                        logger_1.logger.error('Error sending email notification:', error_4);
                        // Log errore nel database
                        return [4 /*yield*/, prisma.notificationLog.create({
                                data: {
                                    id: (0, uuid_1.v4)(),
                                    recipientId: userId,
                                    channel: 'email',
                                    status: 'failed',
                                    subject: data.title,
                                    content: data.message,
                                    variables: data.data || {},
                                    failedAt: new Date(),
                                    failureReason: error_4.message
                                }
                            })];
                    case 5:
                        // Log errore nel database
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Invia notifica via SMS
     */
    NotificationService.prototype.sendSMSNotification = function (userId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var user, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, prisma.user.findUnique({
                                where: { id: userId },
                                select: { phone: true }
                            })];
                    case 1:
                        user = _a.sent();
                        if (!(user === null || user === void 0 ? void 0 : user.phone))
                            return [2 /*return*/];
                        // TODO: Implementare invio SMS con provider (Twilio, etc.)
                        logger_1.logger.debug("SMS notification would be sent to ".concat(user.phone));
                        // Log nel database
                        return [4 /*yield*/, prisma.notificationLog.create({
                                data: {
                                    id: (0, uuid_1.v4)(),
                                    recipientId: userId,
                                    recipientPhone: user.phone,
                                    channel: 'sms',
                                    status: 'pending', // Cambierà quando SMS sarà implementato
                                    content: data.message.substring(0, 160), // SMS ha limite caratteri
                                    variables: data.data || {}
                                }
                            })];
                    case 2:
                        // Log nel database
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _a.sent();
                        logger_1.logger.error('Error sending SMS notification:', error_5);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Invia push notification
     */
    NotificationService.prototype.sendPushNotification = function (userId, data) {
        return __awaiter(this, void 0, void 0, function () {
            var error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // TODO: Implementare push notifications (FCM, etc.)
                        logger_1.logger.debug("Push notification would be sent to user ".concat(userId));
                        // Log nel database
                        return [4 /*yield*/, prisma.notificationLog.create({
                                data: {
                                    id: (0, uuid_1.v4)(),
                                    recipientId: userId,
                                    channel: 'push',
                                    status: 'pending', // Cambierà quando push sarà implementato
                                    subject: data.title,
                                    content: data.message,
                                    variables: data.data || {}
                                }
                            })];
                    case 1:
                        // Log nel database
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _a.sent();
                        logger_1.logger.error('Error sending push notification:', error_6);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Formatta il contenuto dell'email
     */
    NotificationService.prototype.formatEmailContent = function (data, user) {
        var _a;
        return "\n      <!DOCTYPE html>\n      <html>\n      <head>\n        <style>\n          body { font-family: Arial, sans-serif; }\n          .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n          .header { background-color: #3B82F6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }\n          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }\n          .button { \n            display: inline-block; \n            padding: 12px 24px; \n            background-color: #3B82F6; \n            color: white; \n            text-decoration: none; \n            border-radius: 4px;\n            margin-top: 16px;\n          }\n          .footer { margin-top: 20px; text-align: center; color: #666; font-size: 12px; }\n        </style>\n      </head>\n      <body>\n        <div class=\"container\">\n          <div class=\"header\">\n            <h2>".concat(data.title, "</h2>\n          </div>\n          <div class=\"content\">\n            <p>Ciao ").concat(user.firstName, ",</p>\n            <p>").concat(data.message, "</p>\n            ").concat(((_a = data.data) === null || _a === void 0 ? void 0 : _a.actionUrl) ? "\n              <a href=\"".concat(data.data.actionUrl, "\" class=\"button\">Visualizza Dettagli</a>\n            ") : '', "\n          </div>\n          <div class=\"footer\">\n            <p>Questa \u00E8 una notifica automatica dal Sistema di Richiesta Assistenza.</p>\n            <p>Per modificare le tue preferenze di notifica, accedi al tuo profilo.</p>\n          </div>\n        </div>\n      </body>\n      </html>\n    ");
    };
    /**
     * Segna una notifica come letta
     */
    NotificationService.prototype.markAsRead = function (notificationId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, prisma.notification.updateMany({
                                where: {
                                    id: notificationId,
                                    recipientId: userId
                                },
                                data: {
                                    isRead: true,
                                    readAt: new Date()
                                }
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_7 = _a.sent();
                        logger_1.logger.error('Error marking notification as read:', error_7);
                        throw error_7;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Segna tutte le notifiche come lette
     */
    NotificationService.prototype.markAllAsRead = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, prisma.notification.updateMany({
                                where: {
                                    recipientId: userId,
                                    isRead: false
                                },
                                data: {
                                    isRead: true,
                                    readAt: new Date()
                                }
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_8 = _a.sent();
                        logger_1.logger.error('Error marking all notifications as read:', error_8);
                        throw error_8;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Recupera le notifiche non lette
     */
    NotificationService.prototype.getUnread = function (userId_1) {
        return __awaiter(this, arguments, void 0, function (userId, limit) {
            var notifications, error_9;
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, prisma.notification.findMany({
                                where: {
                                    recipientId: userId,
                                    isRead: false
                                },
                                orderBy: {
                                    createdAt: 'desc'
                                },
                                take: limit,
                            })];
                    case 1:
                        notifications = _a.sent();
                        return [2 /*return*/, (0, responseFormatter_1.formatNotificationList)(notifications)];
                    case 2:
                        error_9 = _a.sent();
                        logger_1.logger.error('Error fetching unread notifications:', error_9);
                        throw error_9;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Conta le notifiche non lette
     */
    NotificationService.prototype.countUnread = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, prisma.notification.count({
                                where: {
                                    recipientId: userId,
                                    isRead: false
                                }
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_10 = _a.sent();
                        logger_1.logger.error('Error counting unread notifications:', error_10);
                        return [2 /*return*/, 0];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Elimina le notifiche vecchie
     */
    NotificationService.prototype.cleanupOldNotifications = function () {
        return __awaiter(this, arguments, void 0, function (daysToKeep) {
            var cutoffDate, result, error_11;
            if (daysToKeep === void 0) { daysToKeep = 30; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        cutoffDate = new Date();
                        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
                        return [4 /*yield*/, prisma.notification.deleteMany({
                                where: {
                                    createdAt: { lt: cutoffDate },
                                    isRead: true
                                }
                            })];
                    case 1:
                        result = _a.sent();
                        logger_1.logger.info("Cleaned up ".concat(result.count, " old notifications"));
                        return [3 /*break*/, 3];
                    case 2:
                        error_11 = _a.sent();
                        logger_1.logger.error('Error cleaning up old notifications:', error_11);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Crea una notifica diretta nel database (utility method)
     */
    NotificationService.prototype.createNotification = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, prisma.notification.create({
                                data: {
                                    id: (0, uuid_1.v4)(), // ✅ Sempre genera UUID
                                    recipientId: params.recipientId,
                                    type: params.type,
                                    title: params.title,
                                    content: params.content, // ✅ Campo corretto
                                    priority: params.priority || 'NORMAL', // ✅ Default MAIUSCOLO
                                    metadata: params.metadata || {},
                                    senderId: params.senderId,
                                    entityType: params.entityType,
                                    entityId: params.entityId,
                                    isRead: false
                                }
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_12 = _a.sent();
                        logger_1.logger.error('Error creating notification:', error_12);
                        throw error_12;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return NotificationService;
}());
exports.NotificationService = NotificationService;
// Singleton instance
exports.notificationService = new NotificationService();
// Helper functions per retrocompatibilità
var sendNotification = function (data) { return exports.notificationService.sendToUser(data); };
exports.sendNotification = sendNotification;
var broadcastNotification = function (data) { return exports.notificationService.broadcastToAll(data); };
exports.broadcastNotification = broadcastNotification;
