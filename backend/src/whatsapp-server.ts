import express from 'express';
import cors from 'cors';
import { whatsappRouter } from './routes/whatsapp.routes';

const app = express();
const PORT = process.env.PORT || 3201;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'whatsapp' });
});

// WhatsApp routes
app.use('/api/whatsapp', whatsappRouter);

app.listen(PORT, () => {
  console.log(`WhatsApp Service running on port ${PORT}`);
});
