import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAllFullNames() {
  console.log('🔧 Fixing fullName for ALL users...\n');

  try {
    // Get all users
    const users = await prisma.user.findMany();
    
    console.log(`Found ${users.length} users to check\n`);
    
    let updated = 0;
    for (const user of users) {
      // Always update fullName to ensure it's correct
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
                      user.email.split('@')[0];
      
      if (user.fullName !== fullName) {
        await prisma.user.update({
          where: { id: user.id },
          data: { fullName }
        });
        console.log(`✅ Updated ${user.email}: fullName = "${fullName}"`);
        updated++;
      } else {
        console.log(`✓ ${user.email}: fullName already correct = "${fullName}"`);
      }
    }
    
    console.log(`\n📊 Summary: Updated ${updated} users`);
    
    // Verify all users now have fullName
    console.log('\n📋 Final check - All users with fullName:');
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        role: true
      }
    });
    
    allUsers.forEach(user => {
      if (!user.fullName) {
        console.log(`❌ ${user.email}: MISSING fullName!`);
      } else {
        console.log(`✅ ${user.email}: "${user.fullName}" (${user.role})`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllFullNames();