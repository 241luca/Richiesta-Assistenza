// Test script to check users and create admin if needed
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking users...');
  
  // List all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true
    }
  });
  
  console.log('\nExisting users:');
  users.forEach(user => {
    console.log(`- ${user.email} (${user.role}) - ${user.firstName} ${user.lastName}`);
  });
  
  // Check if we have an admin
  const adminUser = users.find(u => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN');
  
  if (!adminUser) {
    console.log('\nNo admin user found! Creating one...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@richiesta-assistenza.it',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Sistema',
        role: 'SUPER_ADMIN',
        phone: '0000000000',
        address: 'Via Admin 1',
        city: 'Roma',
        province: 'RM',
        postalCode: '00100',
        organizationId: 'default',
        isVerified: true
      }
    });
    
    console.log('Admin created:', admin.email);
  } else {
    console.log('\nAdmin user exists:', adminUser.email);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
