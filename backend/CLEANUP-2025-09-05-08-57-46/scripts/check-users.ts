import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('🔍 Checking all users in database...\n');

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        organizationId: true,
        fullName: true,
        status: true
      }
    });

    console.log(`Found ${users.length} users:\n`);
    
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Full Name: ${user.fullName}`);
      console.log(`  Status: ${user.status}`);
      console.log(`  Org ID: ${user.organizationId}`);
      console.log('---');
    });

    // Check for username 'admin'
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (adminUser) {
      console.log('\n✅ User with username "admin" exists:');
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Role: ${adminUser.role}`);
      
      if (adminUser.email !== 'admin@example.com') {
        console.log('\n⚠️  But email is not admin@example.com!');
        console.log('   This needs to be fixed.');
      }
    } else {
      console.log('\n❌ No user with username "admin" found');
    }

    // Check organizations
    console.log('\n📁 Organizations:');
    const orgs = await prisma.organization.findMany();
    orgs.forEach(org => {
      console.log(`   ${org.name} (${org.id})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();