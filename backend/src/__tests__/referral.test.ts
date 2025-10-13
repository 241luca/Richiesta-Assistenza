import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { app } from '../server';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/richiesta_assistenza_test'
    }
  }
});

describe('Referral Routes - small tests', () => {
  let referrerToken: string;
  let refereeToken: string;
  let referrer: any;
  let refereeEmail: string;
  let refereeId: string | undefined;

  beforeAll(async () => {
    // Crea un referrer
    referrer = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: `referrer_test_${Date.now()}@example.com`,
        username: `referrer_${Date.now()}`,
        password: await bcrypt.hash('Password123!', 12),
        firstName: 'Mario',
        lastName: 'Rossi',
        fullName: 'Mario Rossi',
        phone: '3331234567',
        address: 'Via Roma 1',
        city: 'Milano',
        province: 'MI',
        postalCode: '20100',
        role: 'CLIENT',
        updatedAt: new Date()
      }
    });

    referrerToken = jwt.sign(
      { userId: referrer.id },
      process.env.JWT_SECRET || 'assistenza_jwt_secret_2024_secure_key',
      { expiresIn: '1h' }
    );

    refereeEmail = `referee_test_${Date.now()}@example.com`;
  });

  afterAll(async () => {
    const userIds = [referrer?.id, refereeId].filter(Boolean) as string[];
    if (userIds.length) {
      await prisma.notificationLog.deleteMany({ where: { recipientId: { in: userIds } } });
      await prisma.notification.deleteMany({ where: { OR: [
        { recipientId: { in: userIds } },
        { senderId: { in: userIds } }
      ] } });
    } else {
      await prisma.notification.deleteMany({});
    }
    await prisma.referral.deleteMany({});
    if (userIds.length) {
      await prisma.pointTransaction.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.userPoints.deleteMany({ where: { userId: { in: userIds } } });
    }
    const emails = [referrer?.email, refereeEmail].filter(Boolean) as string[];
    if (emails.length) {
      await prisma.user.deleteMany({ where: { email: { in: emails } } });
    }
    await prisma.$disconnect();
  });

  it('should validate invite body (missing email -> 400)', async () => {
    const res = await request(app)
      .post('/api/referrals/invite')
      .set('Authorization', `Bearer ${referrerToken}`)
      .send({})
      .expect(400);

    expect(res.body).toHaveProperty('error');
  });

  it('should create invite and track signup successfully', async () => {
    // Crea invito
    const inviteRes = await request(app)
      .post('/api/referrals/invite')
      .set('Authorization', `Bearer ${referrerToken}`)
      .send({ email: refereeEmail, message: 'Prova servizio' })
      .expect(201);

    expect(inviteRes.body).toHaveProperty('success', true);
    const code = inviteRes.body.data.code;
    expect(typeof code).toBe('string');

    // Crea referee utente direttamente in DB
    const referee = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: refereeEmail,
        username: `referee_${Date.now()}`,
        password: await bcrypt.hash('Password123!', 12),
        firstName: 'Luigi',
        lastName: 'Verdi',
        fullName: 'Luigi Verdi',
        phone: '3331234568',
        address: 'Via Verdi 2',
        city: 'Torino',
        province: 'TO',
        postalCode: '10100',
        role: 'CLIENT',
        updatedAt: new Date()
      }
    });
    refereeId = referee.id;

    refereeToken = jwt.sign(
      { userId: referee.id },
      process.env.JWT_SECRET || 'assistenza_jwt_secret_2024_secure_key',
      { expiresIn: '1h' }
    );

    // Track signup
    const trackRes = await request(app)
      .post('/api/referrals/track-signup')
      .set('Authorization', `Bearer ${refereeToken}`)
      .send({ referralCode: code })
      .expect(200);

    expect(trackRes.body).toHaveProperty('success', true);
    expect(trackRes.body.data).toMatchObject({ tracked: true });
  });
});