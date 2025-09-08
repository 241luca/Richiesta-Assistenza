import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function testLogin() {
  console.log('🔍 Testing Login Credentials...\n');

  try {
    // Find admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
        role: true,
        organizationId: true,
        status: true,
        emailVerified: true,
        fullName: true
      }
    });

    if (!admin) {
      console.log('❌ Admin user not found!');
      console.log('   Run: npx tsx scripts/create-admin.ts');
      return;
    }

    console.log('✅ Admin user found:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Status: ${admin.status}`);
    console.log(`   Email Verified: ${admin.emailVerified}`);
    console.log(`   Organization: ${admin.organizationId}`);
    console.log(`   Full Name: ${admin.fullName}`);

    // Test password
    console.log('\n🔑 Testing password...');
    const testPassword = 'Admin123!';
    const isValid = await bcrypt.compare(testPassword, admin.password);
    
    if (isValid) {
      console.log('✅ Password is correct: Admin123!');
    } else {
      console.log('❌ Password is incorrect. Resetting...');
      
      // Reset password
      const newHashedPassword = await bcrypt.hash('Admin123!', 10);
      await prisma.user.update({
        where: { id: admin.id },
        data: { 
          password: newHashedPassword,
          emailVerified: true,
          status: 'active'
        }
      });
      console.log('✅ Password has been reset to: Admin123!');
    }

    // Check organization data
    if (admin.organizationId) {
      console.log('\n📊 Organization Data:');
      
      const org = await prisma.organization.findUnique({
        where: { id: admin.organizationId }
      });
      console.log(`   Organization: ${org?.name} (${org?.id})`);
      
      const requestCount = await prisma.assistanceRequest.count({
        where: { organizationId: admin.organizationId }
      });
      const quoteCount = await prisma.quote.count({
        where: { organizationId: admin.organizationId }
      });
      
      console.log(`   Requests in org: ${requestCount}`);
      console.log(`   Quotes in org: ${quoteCount}`);
      
      if (requestCount === 0 && quoteCount === 0) {
        console.log('\n⚠️  No data in organization. Checking if data exists elsewhere...');
        
        const totalRequests = await prisma.assistanceRequest.count();
        const totalQuotes = await prisma.quote.count();
        
        console.log(`   Total requests in DB: ${totalRequests}`);
        console.log(`   Total quotes in DB: ${totalQuotes}`);
        
        if (totalRequests > 0 || totalQuotes > 0) {
          console.log('\n   📌 Data exists but with different organizationId!');
          console.log('   Run: npx tsx scripts/fix-org-ids.ts');
        }
      }
    }

    console.log('\n✅ Login credentials verified:');
    console.log('   📧 Email: admin@example.com');
    console.log('   🔑 Password: Admin123!');
    console.log('   🌐 URL: http://localhost:5193/login');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();