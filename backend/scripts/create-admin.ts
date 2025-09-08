import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createOrFixAdmin() {
  console.log('🔧 Creating/Fixing Admin User...\n');

  try {
    // 1. Get or create organization
    let org = await prisma.organization.findFirst();
    if (!org) {
      console.log('Creating organization...');
      org = await prisma.organization.create({
        data: {
          name: 'Demo Organization',
          slug: 'demo-org'
        }
      });
      console.log(`✅ Organization created: ${org.name} (${org.id})`);
    } else {
      console.log(`✅ Organization exists: ${org.name} (${org.id})`);
    }

    // 2. Delete existing admin if exists (to recreate fresh)
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });
    
    if (existingAdmin) {
      console.log('Removing old admin user...');
      await prisma.user.delete({
        where: { id: existingAdmin.id }
      });
    }

    // 3. Create new admin user with correct fields
    console.log('Creating new admin user...');
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        fullName: 'Super Admin',
        role: 'SUPER_ADMIN',
        organizationId: org.id,
        // Use correct field names from schema
        emailVerified: true,
        emailVerifiedAt: new Date(),
        status: 'active',
        // Add required fields that might be missing
        phone: '+39 000 0000000',
        address: 'Via Demo 1',
        city: 'Roma',
        province: 'RM',
        postalCode: '00100',
        country: 'IT'
      }
    });
    
    console.log('\n✅ Admin user created successfully!');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: Admin123!');
    console.log(`🏢 Organization: ${org.name}`);
    console.log(`👤 Username: ${admin.username}`);
    console.log(`🆔 User ID: ${admin.id}`);
    
    // 4. Update all existing data to use this organization
    console.log('\n🔄 Updating existing data to use same organization...');
    
    // Update all users to same organization
    const usersUpdated = await prisma.user.updateMany({
      where: {
        organizationId: { not: org.id }
      },
      data: { organizationId: org.id }
    });
    console.log(`   Updated ${usersUpdated.count} users`);
    
    // Update requests
    const requestsUpdated = await prisma.assistanceRequest.updateMany({
      where: {
        organizationId: { not: org.id }
      },
      data: { organizationId: org.id }
    });
    console.log(`   Updated ${requestsUpdated.count} requests`);
    
    // Update quotes
    const quotesUpdated = await prisma.quote.updateMany({
      where: {
        organizationId: { not: org.id }
      },
      data: { organizationId: org.id }
    });
    console.log(`   Updated ${quotesUpdated.count} quotes`);
    
    // 5. Check data in the organization
    console.log('\n📊 Data Check for Organization:');
    const totalUsers = await prisma.user.count({ where: { organizationId: org.id } });
    const totalRequests = await prisma.assistanceRequest.count({ where: { organizationId: org.id } });
    const totalQuotes = await prisma.quote.count({ where: { organizationId: org.id } });
    
    console.log(`   Users in org: ${totalUsers}`);
    console.log(`   Requests in org: ${totalRequests}`);
    console.log(`   Quotes in org: ${totalQuotes}`);
    
    // 6. List all users
    console.log('\n👥 All Users:');
    const allUsers = await prisma.user.findMany({
      select: {
        username: true,
        email: true,
        role: true,
        organizationId: true,
        status: true
      }
    });
    
    allUsers.forEach(user => {
      console.log(`   - ${user.username} / ${user.email} (${user.role}) - Status: ${user.status}`);
    });
    
    // 7. Sample data
    const sampleRequest = await prisma.assistanceRequest.findFirst({
      include: { 
        client: {
          select: {
            email: true,
            fullName: true
          }
        },
        category: true 
      }
    });
    
    if (sampleRequest) {
      console.log('\n📝 Sample Request:');
      console.log(`   Title: ${sampleRequest.title}`);
      console.log(`   Status: ${sampleRequest.status}`);
      console.log(`   Client: ${sampleRequest.client?.email}`);
      console.log(`   Category: ${sampleRequest.category?.name}`);
      console.log(`   Organization: ${sampleRequest.organizationId}`);
    }
    
    const sampleQuote = await prisma.quote.findFirst({
      include: {
        professional: {
          select: {
            email: true,
            fullName: true
          }
        },
        request: true
      }
    });
    
    if (sampleQuote) {
      console.log('\n💰 Sample Quote:');
      console.log(`   Title: ${sampleQuote.title}`);
      console.log(`   Status: ${sampleQuote.status}`);
      console.log(`   Professional: ${sampleQuote.professional?.email}`);
      console.log(`   Request: ${sampleQuote.request?.title}`);
      console.log(`   Organization: ${sampleQuote.organizationId}`);
    }
    
    console.log('\n✅ Setup complete! You can now login with:');
    console.log('   📧 Email: admin@example.com');
    console.log('   🔑 Password: Admin123!');
    console.log('   🌐 URL: http://localhost:5193');
    console.log('\n📌 If you still can\'t see data:');
    console.log('   1. Restart the backend server');
    console.log('   2. Clear browser cache/cookies');
    console.log('   3. Login again with the credentials above');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createOrFixAdmin();