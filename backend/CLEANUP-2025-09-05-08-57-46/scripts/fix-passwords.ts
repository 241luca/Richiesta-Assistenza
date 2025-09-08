import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function fixPasswords() {
  console.log('🔧 Fixing user passwords to match LoginPage...\n');

  try {
    // Define correct credentials from LoginPage
    const correctCredentials = [
      { email: 'admin@assistenza.it', password: 'password123' },
      { email: 'luigi.bianchi@gmail.com', password: 'password123' },
      { email: 'mario.rossi@assistenza.it', password: 'password123' },
      { email: 'staff@assistenza.it', password: 'staff123' }
    ];

    for (const cred of correctCredentials) {
      const user = await prisma.user.findUnique({
        where: { email: cred.email }
      });

      if (user) {
        const hashedPassword = await bcrypt.hash(cred.password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            password: hashedPassword,
            emailVerified: true,
            status: 'active'
          }
        });
        console.log(`✅ Updated password for ${cred.email}`);
      } else {
        console.log(`❌ User not found: ${cred.email}`);
      }
    }

    // Check if we need to update admin@example.com to admin@assistenza.it
    const wrongAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (wrongAdmin) {
      console.log('\n🔄 Found admin@example.com, updating to admin@assistenza.it...');
      
      // Check if admin@assistenza.it already exists
      const existingCorrectAdmin = await prisma.user.findUnique({
        where: { email: 'admin@assistenza.it' }
      });

      if (!existingCorrectAdmin) {
        // Update email to correct one
        const hashedPassword = await bcrypt.hash('password123', 10);
        await prisma.user.update({
          where: { id: wrongAdmin.id },
          data: { 
            email: 'admin@assistenza.it',
            password: hashedPassword
          }
        });
        console.log('✅ Updated admin email to admin@assistenza.it');
      } else {
        console.log('⚠️  admin@assistenza.it already exists, deleting admin@example.com');
        await prisma.user.delete({
          where: { id: wrongAdmin.id }
        });
      }
    }

    console.log('\n📋 Final user list:');
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        fullName: true
      }
    });

    allUsers.forEach(user => {
      console.log(`   ${user.email} (${user.role}) - ${user.fullName}`);
    });

    console.log('\n✅ Passwords fixed! Use these credentials:');
    console.log('   admin@assistenza.it / password123');
    console.log('   luigi.bianchi@gmail.com / password123');
    console.log('   mario.rossi@assistenza.it / password123');
    console.log('   staff@assistenza.it / staff123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPasswords();