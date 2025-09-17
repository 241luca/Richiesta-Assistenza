# FIX URL SISTEMA NOTIFICHE

## ✅ PROBLEMA RISOLTO!

Il problema era un doppio `/api/api/` negli URL perché:
1. L'axios client già aggiunge `/api` come base URL 
2. Nel componente stavamo aggiungendo di nuovo `/api`

## Correzioni applicate:

### NotificationDashboard.tsx
Cambiato da:
```javascript
api.get('/api/notification-templates/templates')
```
A:
```javascript
api.get('/notification-templates/templates')
```

### TemplateEditor.tsx
Cambiato da:
```javascript
api.post('/api/notification-templates/templates')
```
A:
```javascript
api.post('/notification-templates/templates')
```

## URL CORRETTI:
- ✅ `/notification-templates/templates` - Lista template
- ✅ `/notification-templates/events` - Eventi
- ✅ `/notification-templates/statistics` - Statistiche
- ✅ `/notification-templates/queue/process` - Processa coda
- ✅ `/notification-templates/templates/{id}` - CRUD singolo template

## ISTRUZIONI:
1. Ricarica la pagina (Cmd+R)
2. Ora dovresti vedere i template con le icone
3. Clicca sulla matita per modificare
4. Clicca su "Nuovo Template" per crearne uno nuovo
