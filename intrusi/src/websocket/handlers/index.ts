/**
 * WebSocket Handlers Index
 * Esporta tutti gli handler per gli eventi WebSocket
 */

export { handleNotificationEvents, sendNotificationToUser, broadcastNotificationToOrganization } from './notification.handler';
export { handleRequestEvents, notifyRequestAssignment, notifyRequestCompletion } from './request.handler';
export { handleQuoteEvents, notifyNewQuote, notifyDepositPayment } from './quote.handler';
export { handleMessageEvents, getUnreadMessageCount, getRecentConversations } from './message.handler';
