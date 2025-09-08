// Correzione per notification.service.ts
// Sostituisci le righe problematiche nel metodo getUnread

// DA:
include: {
  sender: true,
  recipient: true
}

// A:
include: {
  User_Notification_recipientIdToUser: true,
  User_Notification_senderIdToUser: true
}

// Oppure più semplicemente, rimuovi l'include se non necessario:
// Rimuovi completamente la sezione include
