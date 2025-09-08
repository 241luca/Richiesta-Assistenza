const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    port: 3200,
    timestamp: new Date().toISOString() 
  });
});

const PORT = 3200;
app.listen(PORT, () => {
  console.log(`✅ Server attivo su http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
