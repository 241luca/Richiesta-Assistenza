"use strict";
/**
 * Notification Event Handlers
 * Gestisce tutti gli eventi relativi alle notifiche real-time
 * FIXED: Corretti problemi di nomenclatura database e generazione UUID
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
exports.handleNotificationEvents = handleNotificationEvents;
exports.sendNotificationToUser = sendNotificationToUser;
exports.broadcastNotificationToOrganization = broadcastNotificationToOrganization;
exports.sendNotificationToGroup = sendNotificationToGroup;
var client_1 = require("@prisma/client");
var logger_1 = require("../../utils/logger");
var uuid_1 = require("uuid");
var prisma = new client_1.PrismaClient();
function handleNotificationEvents(socket, io) {
    var _this = this;
    /**
     * Recupera tutte le notifiche non lette dell'utente
     */
    socket.on('notification:getUnread', function () { return __awaiter(_this, void 0, void 0, function () {
        var notifications, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, prisma.notification.findMany({
                            where: {
                                recipientId: socket.userId,
                                isRead: false
                            },
                            orderBy: {
                                createdAt: 'desc'
                            },
                            take: 50
                        })];
                case 1:
                    notifications = _a.sent();
                    socket.emit('notification:unreadList', {
                        notifications: notifications,
                        count: notifications.length
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    logger_1.logger.error('Error fetching unread notifications:', error_1);
                    socket.emit('error', { message: 'Failed to fetch notifications' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    /**
     * Segna una notifica come letta
     */
    socket.on('notification:markAsRead', function (notificationId) { return __awaiter(_this, void 0, void 0, function () {
        var notification, unreadCount, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, prisma.notification.findFirst({
                            where: {
                                id: notificationId,
                                recipientId: socket.userId
                            }
                        })];
                case 1:
                    notification = _a.sent();
                    if (!notification) {
                        throw new Error('Notification not found');
                    }
                    return [4 /*yield*/, prisma.notification.update({
                            where: { id: notificationId },
                            data: {
                                isRead: true,
                                readAt: new Date()
                            }
                        })];
                case 2:
                    _a.sent();
                    socket.emit('notification:marked', {
                        id: notificationId,
                        isRead: true
                    });
                    return [4 /*yield*/, prisma.notification.count({
                            where: {
                                recipientId: socket.userId,
                                isRead: false
                            }
                        })];
                case 3:
                    unreadCount = _a.sent();
                    socket.emit('notification:unreadCount', { count: unreadCount });
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    logger_1.logger.error('Error marking notification as read:', error_2);
                    socket.emit('error', { message: 'Failed to mark notification as read' });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    /**
     * Segna tutte le notifiche come lette
     */
    socket.on('notification:markAllAsRead', function () { return __awaiter(_this, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, prisma.notification.updateMany({
                            where: {
                                recipientId: socket.userId,
                                isRead: false
                            },
                            data: {
                                isRead: true,
                                readAt: new Date()
                            }
                        })];
                case 1:
                    _a.sent();
                    socket.emit('notification:allMarked', { success: true });
                    socket.emit('notification:unreadCount', { count: 0 });
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    logger_1.logger.error('Error marking all notifications as read:', error_3);
                    socket.emit('error', { message: 'Failed to mark all notifications as read' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    /**
     * Elimina una notifica
     */
    socket.on('notification:delete', function (notificationId) { return __awaiter(_this, void 0, void 0, function () {
        var notification, unreadCount, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, prisma.notification.findFirst({
                            where: {
                                id: notificationId,
                                recipientId: socket.userId
                            }
                        })];
                case 1:
                    notification = _a.sent();
                    if (!notification) {
                        throw new Error('Notification not found');
                    }
                    return [4 /*yield*/, prisma.notification.delete({
                            where: { id: notificationId }
                        })];
                case 2:
                    _a.sent();
                    socket.emit('notification:deleted', { id: notificationId });
                    return [4 /*yield*/, prisma.notification.count({
                            where: {
                                recipientId: socket.userId,
                                isRead: false
                            }
                        })];
                case 3:
                    unreadCount = _a.sent();
                    socket.emit('notification:unreadCount', { count: unreadCount });
                    return [3 /*break*/, 5];
                case 4:
                    error_4 = _a.sent();
                    logger_1.logger.error('Error deleting notification:', error_4);
                    socket.emit('error', { message: 'Failed to delete notification' });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); });
    /**
     * Recupera le preferenze di notifica dell'utente
     */
    socket.on('notification:getPreferences', function () { return __awaiter(_this, void 0, void 0, function () {
        var preferences, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, prisma.notificationPreference.findUnique({
                            where: { userId: socket.userId }
                        })];
                case 1:
                    preferences = _a.sent();
                    socket.emit('notification:preferences', preferences || {
                        emailNotifications: true,
                        pushNotifications: true,
                        smsNotifications: false
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_5 = _a.sent();
                    logger_1.logger.error('Error fetching notification preferences:', error_5);
                    socket.emit('error', { message: 'Failed to fetch preferences' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    /**
     * Aggiorna le preferenze di notifica
     */
    socket.on('notification:updatePreferences', function (preferences) { return __awaiter(_this, void 0, void 0, function () {
        var updated, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, prisma.notificationPreference.upsert({
                            where: { userId: socket.userId },
                            update: preferences,
                            create: __assign({ id: (0, uuid_1.v4)(), userId: socket.userId }, preferences)
                        })];
                case 1:
                    updated = _a.sent();
                    socket.emit('notification:preferencesUpdated', updated);
                    return [3 /*break*/, 3];
                case 2:
                    error_6 = _a.sent();
                    logger_1.logger.error('Error updating notification preferences:', error_6);
                    socket.emit('error', { message: 'Failed to update preferences' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
}
/**
 * Invia una notifica real-time a un utente specifico
 * FIXED: Corretti campi database e generazione UUID
 */
function sendNotificationToUser(io, userId, notification) {
    return __awaiter(this, void 0, void 0, function () {
        var saved, unreadCount, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, prisma.notification.create({
                            data: {
                                id: (0, uuid_1.v4)(), // ✅ FIX 1: Genera sempre UUID
                                recipientId: userId,
                                type: notification.type,
                                title: notification.title,
                                content: notification.message, // ✅ FIX 2: Usa 'content' non 'message'
                                metadata: notification.data || {}, // Campo corretto per dati extra
                                priority: normalizePriority(notification.priority), // ✅ FIX 3: Converti in MAIUSCOLO
                                isRead: false
                            }
                        })];
                case 1:
                    saved = _a.sent();
                    // Invia via WebSocket se l'utente è online
                    io.to("user:".concat(userId)).emit('notification:new', __assign(__assign({}, saved), { timestamp: new Date() }));
                    return [4 /*yield*/, prisma.notification.count({
                            where: {
                                recipientId: userId,
                                isRead: false
                            }
                        })];
                case 2:
                    unreadCount = _a.sent();
                    io.to("user:".concat(userId)).emit('notification:unreadCount', { count: unreadCount });
                    logger_1.logger.info("Notification sent to user ".concat(userId, ": ").concat(notification.title));
                    return [2 /*return*/, saved];
                case 3:
                    error_7 = _a.sent();
                    logger_1.logger.error('Error sending notification:', error_7);
                    throw error_7;
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Invia una notifica a tutti gli utenti di un'organizzazione
 * FIXED: Corretti campi database e generazione UUID
 */
function broadcastNotificationToOrganization(io, notification) {
    return __awaiter(this, void 0, void 0, function () {
        var users, notificationData, notifications, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, prisma.user.findMany({
                            select: { id: true }
                        })];
                case 1:
                    users = _a.sent();
                    notificationData = users.map(function (user) { return ({
                        id: (0, uuid_1.v4)(), // ✅ FIX 1: Genera UUID per ogni notifica
                        recipientId: user.id,
                        type: notification.type,
                        title: notification.title,
                        content: notification.message, // ✅ FIX 2: Usa 'content'
                        metadata: notification.data || {},
                        priority: normalizePriority(notification.priority), // ✅ FIX 3: MAIUSCOLO
                        isRead: false
                    }); });
                    return [4 /*yield*/, prisma.notification.createMany({
                            data: notificationData
                        })];
                case 2:
                    notifications = _a.sent();
                    // Broadcast via WebSocket
                    io.emit('notification:new', __assign(__assign({}, notification), { timestamp: new Date() }));
                    return [2 /*return*/, notifications];
                case 3:
                    error_8 = _a.sent();
                    logger_1.logger.error('Error broadcasting notification:', error_8);
                    throw error_8;
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Helper per normalizzare la priorità in MAIUSCOLO per il database
 * ✅ FIX 3: Funzione helper per convertire priority
 */
function normalizePriority(priority) {
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
}
/**
 * Invia una notifica a un gruppo di utenti
 * FIXED: Aggiunto metodo helper con campi corretti
 */
function sendNotificationToGroup(io, userIds, notification) {
    return __awaiter(this, void 0, void 0, function () {
        var notificationData, notifications, _i, userIds_1, userId, unreadCount, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    notificationData = userIds.map(function (userId) { return ({
                        id: (0, uuid_1.v4)(), // ✅ FIX 1: UUID per ogni notifica
                        recipientId: userId,
                        type: notification.type,
                        title: notification.title,
                        content: notification.message, // ✅ FIX 2: Campo corretto
                        metadata: notification.data || {},
                        priority: normalizePriority(notification.priority), // ✅ FIX 3: MAIUSCOLO
                        isRead: false
                    }); });
                    return [4 /*yield*/, prisma.notification.createMany({
                            data: notificationData
                        })];
                case 1:
                    notifications = _a.sent();
                    _i = 0, userIds_1 = userIds;
                    _a.label = 2;
                case 2:
                    if (!(_i < userIds_1.length)) return [3 /*break*/, 5];
                    userId = userIds_1[_i];
                    io.to("user:".concat(userId)).emit('notification:new', __assign(__assign({}, notification), { timestamp: new Date() }));
                    return [4 /*yield*/, prisma.notification.count({
                            where: {
                                recipientId: userId,
                                isRead: false
                            }
                        })];
                case 3:
                    unreadCount = _a.sent();
                    io.to("user:".concat(userId)).emit('notification:unreadCount', { count: unreadCount });
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    logger_1.logger.info("Notification sent to ".concat(userIds.length, " users: ").concat(notification.title));
                    return [2 /*return*/, notifications];
                case 6:
                    error_9 = _a.sent();
                    logger_1.logger.error('Error sending notification to group:', error_9);
                    throw error_9;
                case 7: return [2 /*return*/];
            }
        });
    });
}
