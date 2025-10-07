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

    // 2. Check if admin exists by email OR username
    let admin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@example.com' },
          { username: 'admin' }
        ]
      }
    });
    
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    if (admin) {
      console.log('Admin user exists, updating...');
      
      // Update existing admin
      admin = await prisma.user.update({
        where: { id: admin.id },
        data: {
          email: 'admin@example.com',
          username: 'admin',
          password: hashedPassword,
          firstName: 'Super',
          lastName: 'Admin',
          fullName: 'Super Admin',
          role: 'SUPER_ADMIN',
          organizationId: org.id,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          status: 'active',
          phone: admin.phone || '+39 000 0000000',
          address: admin.address || 'Via Demo 1',
          city: admin.city || 'Roma',
          province: admin.province || 'RM',
          postalCode: admin.postalCode || '00100',
          country: admin.country || 'IT'
        }
      });
      console.log('✅ Admin user updated successfully!');
    } else {
      console.log('Creating new admin user...');
      
      // Create new admin
      admin = await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@example.com',
          password: hashedPassword,
          firstName: 'Super',
          lastName: 'Admin',
          fullName: 'Super Admin',
          role: 'SUPER_ADMIN',
          organizationId: org.id,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          status: 'active',
          phone: '+39 000 0000000',
          address: 'Via Demo 1',
          city: 'Roma',
          province: 'RM',
          postalCode: '00100',
          country: 'IT'
        }
      });
      console.log('✅ Admin user created successfully!');
    }
    
    console.log('\n📧 Email: admin@example.com');
    console.log('🔑 Password: Admin123!');
    console.log(`🏢 Organization: ${org.name}`);
    console.log(`👤 Username: ${admin.username}`);
    console.log(`🆔 User ID: ${admin.id}`);
    
    // 3. Fix all fullName fields for users
    console.log('\n🔄 Fixing fullName for all users...');
    const usersWithoutFullName = await prisma.user.findMany({
      where: {
        OR: [
          { fullName: null },
          { fullName: '' }
        ]
      }
    });
    
    for (const user of usersWithoutFullName) {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0];
      await prisma.user.update({
        where: { id: user.id },
        data: { fullName }
      });
      console.log(`   Updated fullName for ${user.email}: "${fullName}"`);
    }
    
    // 4. Update all existing data to use this organization
    console.log('\n🔄 Updating all data to use same organization...');
    
    // Update all users
    const usersUpdated = await prisma.user.updateMany({
      where: {
        organizationId: { not: org.id }
      },
      data: { organizationId: org.id }
    });
    if (usersUpdated.count > 0) {
      console.log(`   ✅ Updated ${usersUpdated.count} users`);
    }
    
    // Update all requests
    const requestsUpdated = await prisma.assistanceRequest.updateMany({
      where: {
        OR: [
          { organizationId: { not: org.id } },
          { organizationId: null }
        ]
      },
      data: { organizationId: org.id }
    });
    if (requestsUpdated.count > 0) {
      console.log(`   ✅ Updated ${requestsUpdated.count} requests`);
    }
    
    // Update all quotes
    const quotesUpdated = await prisma.quote.updateMany({
      where: {
        OR: [
          { organizationId: { not: org.id } },
          { organizationId: null }
        ]
      },
      data: { organizationId: org.id }
    });
    if (quotesUpdated.count > 0) {
      console.log(`   ✅ Updated ${quotesUpdated.count} quotes`);
    }
    
    // 5. Final data check
    console.log('\n📊 Final Data Check:');
    
    const totalUsers = await prisma.user.count({ where: { organizationId: org.id } });
    const totalRequests = await prisma.assistanceRequest.count({ where: { organizationId: org.id } });
    const totalQuotes = await prisma.quote.count({ where: { organizationId: org.id } });
    const totalCategories = await prisma.category.count();
    
    console.log(`   Users in org: ${totalUsers}`);
    console.log(`   Requests in org: ${totalRequests}`);
    console.log(`   Quotes in org: ${totalQuotes}`);
    console.log(`   Categories: ${totalCategories}`);
    
    // 6. Show sample data
    if (totalRequests > 0) {
      const sampleRequest = await prisma.assistanceRequest.findFirst({
        where: { organizationId: org.id },
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
        console.log(`   Title: "${sampleRequest.title}"`);
        console.log(`   Status: ${sampleRequest.status}`);
        console.log(`   Client: ${sampleRequest.client?.fullName || sampleRequest.client?.email}`);
        console.log(`   Category: ${sampleRequest.category?.name}`);
      }
    }
    
    if (totalQuotes > 0) {
      const sampleQuote = await prisma.quote.findFirst({
        where: { organizationId: org.id },
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
        console.log(`   Title: "${sampleQuote.title}"`);
        console.log(`   Status: ${sampleQuote.status}`);
        console.log(`   Professional: ${sampleQuote.professional?.fullName || sampleQuote.professional?.email}`);
        console.log(`   Request: ${sampleQuote.request?.title}`);
      }
    }
    
    console.log('\n✅ SETUP COMPLETE!');
    console.log('\n📌 Login Instructions:');
    console.log('   1. Go to: http://localhost:5193/login');
    console.log('   2. Email: admin@example.com');
    console.log('   3. Password: Admin123!');
    console.log('\n⚠️  If you still can\'t see data:');
    console.log('   1. Restart the backend (Ctrl+C and npm run dev)');
    console.log('   2. Clear browser cache/cookies');
    console.log('   3. Try incognito/private browsing mode');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createOrFixAdmin();