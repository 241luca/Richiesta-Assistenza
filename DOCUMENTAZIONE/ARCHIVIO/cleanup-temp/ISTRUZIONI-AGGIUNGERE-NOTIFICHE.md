// Aggiungere dopo la riga degli import esistenti (circa riga 40)
import notificationTemplateRoutes from './routes/notificationTemplate.routes';

// Poi aggiungere la registrazione della route dopo le altre route API (cerca circa riga 270)
// Prima di "// Admin test routes"
app.use('/api/notifications', authenticate, notificationTemplateRoutes);
