const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.notificationTemplate.findMany({
  select: { category: true }
})
.then(templates => {
  const cats = [...new Set(templates.map(t => t.category))];
  console.log('CATEGORIE NEL DB:', cats);
})
.finally(() => prisma.$disconnect());
