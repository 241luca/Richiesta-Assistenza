const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/services/notification.service.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Trova e sostituisci la sezione getUnread
const oldInclude = `include: {
        sender: true,
        recipient: true
      }`;

const newInclude = `include: {
        User_Notification_senderIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        User_Notification_recipientIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }`;

// Sostituisci
content = content.replace(oldInclude, newInclude);

// Scrivi il file
fs.writeFileSync(filePath, content);

console.log('Notification service fixato con successo');
