# CORREZIONE URL API SISTEMA NOTIFICHE

## Il problema
Le API nel frontend puntavano a `/api/notifications/*` mentre il backend è configurato su `/api/notification-templates/*`

## Correzioni da applicare:

### 1. NotificationDashboard.tsx
Cambiare tutte le URL da:
- `/api/notifications/templates` → `/api/notification-templates/templates`
- `/api/notifications/events` → `/api/notification-templates/events`
- `/api/notifications/statistics` → `/api/notification-templates/statistics`
- `/api/notifications/queue/process` → `/api/notification-templates/queue/process`

### 2. TemplateEditor.tsx  
Cambiare:
- `/api/notifications/templates` → `/api/notification-templates/templates`
- `/api/notifications/templates/${id}` → `/api/notification-templates/templates/${id}`
- `/api/notifications/templates/${code}/preview` → `/api/notification-templates/templates/${code}/preview`

### 3. EventManager.tsx
Cambiare:
- `/api/notifications/events/${code}/trigger` → `/api/notification-templates/events/${code}/trigger`
- `/api/notifications/events/${id}` → `/api/notification-templates/events/${id}`

## Verifica che lo script seed sia stato eseguito:
```bash
cd backend
npx ts-node src/scripts/seed-notification-templates.ts
```

## Test API diretta:
```bash
curl http://localhost:3200/api/notification-templates/templates \
  -H "Authorization: Bearer YOUR_TOKEN"
```
