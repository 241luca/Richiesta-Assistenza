const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.notificationTemplate.count()
  .then(count => console.log('TEMPLATE NEL DB:', count))
  .finally(() => prisma.$disconnect());
