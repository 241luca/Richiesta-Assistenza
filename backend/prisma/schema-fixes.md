# Correzioni Schema Prisma

## Problemi identificati:
1. Nomi relazioni auto-generati lunghi (es: User_AssistanceRequest_clientIdToUser)
2. Inconsistenze maiuscole/minuscole
3. Nomi non intuitivi

## Correzioni da applicare:

### Model AssistanceRequest
PRIMA:
- User_AssistanceRequest_assignedByToUser
- User_AssistanceRequest_clientIdToUser  
- User_AssistanceRequest_professionalIdToUser

DOPO:
- assignedByUser
- client
- professional

### Model InterventionReport
PRIMA:
- User_InterventionReport_clientIdToUser
- User_InterventionReport_professionalIdToUser

DOPO:
- client
- professional

### Model Message
PRIMA:
- User_Message_recipientIdToUser
- User_Message_senderIdToUser

DOPO:
- recipient
- sender

### Model Notification
PRIMA:
- User_Notification_recipientIdToUser
- User_Notification_senderIdToUser

DOPO:
- recipient
- sender
