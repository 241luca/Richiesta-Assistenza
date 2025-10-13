import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server';

describe('Health Check', () => {
  it('GET /health risponde con stato ok', async () => {
    const res = await request(app)
      .get('/health')
      .expect(200);

    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('port');
    expect(res.body).toHaveProperty('websocket', 'ready');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/test/health risponde con ResponseFormatter e dettagli', async () => {
    const res = await request(app)
      .get('/api/test/health')
      .expect(200);

    // Struttura standardizzata
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('metadata');
    expect(res.body).toHaveProperty('timestamp');

    // Dati health
    expect(res.body.data).toHaveProperty('status');
    expect(['operational', 'degraded', 'critical']).toContain(res.body.data.status);
    expect(typeof res.body.data.database).toBe('boolean');
    expect(res.body.data).toHaveProperty('details');

    // Metadati
    expect(res.body.metadata).toHaveProperty('testsExecuted');
    expect(res.body.metadata).toHaveProperty('healthScore');
  });
});