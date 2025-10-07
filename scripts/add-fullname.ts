import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addFullNameToUsers() {
  console.log('🔧 Adding fullName to all users...\n');

  try {
    // Get all users
    const users = await prisma.user.findMany();
    
    console.log(`Found ${users.length} users to check`);
    
    let updated = 0;
    for (const user of users) {
      // Check if fullName is missing or empty
      if (!user.fullName) {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0];
        
        await prisma.user.update({
          where: { id: user.id },
          data: { fullName }
        });
        
        console.log(`   Updated ${user.email}: fullName = "${fullName}"`);
        updated++;
      }
    }
    
    console.log(`\n✅ Updated ${updated} users with fullName`);
    
    // Show all users with their fullName
    console.log('\n📋 All users:');
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        fullName: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });
    
    allUsers.forEach(user => {
      console.log(`   ${user.email}: "${user.fullName}" (${user.role})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addFullNameToUsers();