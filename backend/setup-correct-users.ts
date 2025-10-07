import { prisma } from './src/config/database';
import bcrypt from 'bcryptjs';

async function setupCorrectUsers() {
  try {
    console.log('🔧 Setting up correct users from LoginPage...\n');
    
    // Prima trova o crea l'organizzazione
    let org = await prisma.organization.findFirst();
    if (!org) {
      console.log('Creating default organization...');
      org = await prisma.organization.create({
        data: {
          name: 'Richiesta Assistenza',
          slug: 'richiesta-assistenza'
        }
      });
    }
    
    // Utenti corretti dalla LoginPage
    const users = [
      {
        email: 'admin@assistenza.it',
        password: 'password123',
        username: 'admin',
        firstName: 'Super',
        lastName: 'Admin',
        fullName: 'Super Admin',
        role: 'SUPER_ADMIN'
      },
      {
        email: 'luigi.bianchi@gmail.com',
        password: 'password123',
        username: 'luigi.bianchi',
        firstName: 'Luigi',
        lastName: 'Bianchi',
        fullName: 'Luigi Bianchi',
        role: 'CLIENT'
      },
      {
        email: 'mario.rossi@assistenza.it',
        password: 'password123',
        username: 'mario.rossi',
        firstName: 'Mario',
        lastName: 'Rossi',
        fullName: 'Mario Rossi',
        role: 'PROFESSIONAL'
      },
      {
        email: 'staff@assistenza.it',
        password: 'staff123',
        username: 'staff',
        firstName: 'Staff',
        lastName: 'Assistenza',
        fullName: 'Staff Assistenza',
        role: 'ADMIN'
      }
    ];
    
    for (const userData of users) {
      console.log(`\n📝 Processing ${userData.email}...`);
      
      // Hash della password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Cerca se esiste
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (existingUser) {
        // Aggiorna l'utente esistente
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            password: hashedPassword,
            role: userData.role as any,
            firstName: userData.firstName,
            lastName: userData.lastName,
            fullName: userData.fullName
          }
        });
        console.log(`   ✅ Updated existing user`);
      } else {
        // Crea nuovo utente
        await prisma.user.create({
          data: {
            email: userData.email,
            username: userData.username,
            password: hashedPassword,
            firstName: userData.firstName,
            lastName: userData.lastName,
            fullName: userData.fullName,
            role: userData.role as any,
            organizationId: org.id,
            emailVerified: true
          }
        });
        console.log(`   ✅ Created new user`);
      }
      
      // Verifica password
      const user = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (user) {
        const isValid = await bcrypt.compare(userData.password, user.password);
        console.log(`   Password test: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All users configured correctly!\n');
    console.log('Available logins:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SUPER ADMIN:');
    console.log('  Email: admin@assistenza.it');
    console.log('  Password: password123\n');
    
    console.log('CLIENT:');
    console.log('  Email: luigi.bianchi@gmail.com');
    console.log('  Password: password123\n');
    
    console.log('PROFESSIONAL:');
    console.log('  Email: mario.rossi@assistenza.it');
    console.log('  Password: password123\n');
    
    console.log('STAFF:');
    console.log('  Email: staff@assistenza.it');
    console.log('  Password: staff123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupCorrectUsers().catch(console.error);
