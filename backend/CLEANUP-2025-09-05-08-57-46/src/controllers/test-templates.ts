import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function testTemplates(req: Request, res: Response) {
  try {
    // Conta i template
    const count = await prisma.notificationTemplate.count();
    
    // Prendi i primi 5 template
    const templates = await prisma.notificationTemplate.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      status: 'success',
      message: `Test completato - ${count} template nel database`,
      count: count,
      samples: templates.map(t => ({
        id: t.id,
        code: t.code,
        name: t.name,
        channels: t.channels,
        isActive: t.isActive
      }))
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}
