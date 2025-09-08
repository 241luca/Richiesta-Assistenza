import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkAndFixAdmin() {
  console.log('🔍 Checking admin user...\n');

  try {
    // 1. Check if admin exists
    let admin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (!admin) {
      console.log('❌ Admin user not found. Creating...');
      
      // Get or create organization
      let org = await prisma.organization.findFirst();
      if (!org) {
        org = await prisma.organization.create({
          data: {
            name: 'Demo Organization',
            slug: 'demo-org'
          }
        });
      }
      
      // Create admin user with all required fields
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      admin = await prisma.user.create({
        data: {
          username: 'admin',  // Added username field
          email: 'admin@example.com',
          password: hashedPassword,
          firstName: 'Super',
          lastName: 'Admin',
          fullName: 'Super Admin',
          role: 'SUPER_ADMIN',
          organizationId: org.id,
          isActive: true,
          isEmailVerified: true
        }
      });
      console.log('✅ Admin user created successfully');
      console.log('   Username: admin');
      console.log('   Email: admin@example.com');
      console.log('   Password: Admin123!');
    } else {
      console.log('✅ Admin user exists');
      console.log(`   Username: ${admin.username}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Organization: ${admin.organizationId}`);
      
      // Update password to ensure it's correct
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      await prisma.user.update({
        where: { id: admin.id },
        data: { 
          password: hashedPassword,
          isActive: true,
          isEmailVerified: true,
          fullName: admin.fullName || `${admin.firstName} ${admin.lastName}`
        }
      });
      console.log('✅ Admin password reset to: Admin123!');
    }

    // 2. Check organization alignment
    console.log('\n📊 Organization Data Check:');
    
    const org = await prisma.organization.findUnique({
      where: { id: admin.organizationId }
    });
    console.log(`   Organization: ${org?.name} (${org?.id})`);
    
    // Count data in this organization
    const requestCount = await prisma.assistanceRequest.count({
      where: { organizationId: admin.organizationId }
    });
    const quoteCount = await prisma.quote.count({
      where: { organizationId: admin.organizationId }
    });
    
    console.log(`   Requests in org: ${requestCount}`);
    console.log(`   Quotes in org: ${quoteCount}`);
    
    // 3. List all users
    console.log('\n📋 All users in the system:');
    const allUsers = await prisma.user.findMany({
      select: {
        username: true,
        email: true,
        role: true,
        organizationId: true,
        isActive: true
      }
    });
    
    allUsers.forEach(user => {
      console.log(`   - ${user.username || 'no-username'} / ${user.email} (${user.role}) - Active: ${user.isActive}`);
    });
    
    // 4. Sample requests
    console.log('\n📝 Sample Requests:');
    const sampleRequests = await prisma.assistanceRequest.findMany({
      take: 3,
      include: {
        client: {
          select: { email: true }
        },
        category: true
      }
    });
    
    if (sampleRequests.length > 0) {
      sampleRequests.forEach(req => {
        console.log(`   - "${req.title}" (Org: ${req.organizationId})`);
        console.log(`     Status: ${req.status}, Client: ${req.client?.email}`);
      });
    } else {
      console.log('   No requests found');
    }
    
    // 5. Sample quotes
    console.log('\n💰 Sample Quotes:');
    const sampleQuotes = await prisma.quote.findMany({
      take: 3,
      include: {
        professional: {
          select: { email: true }
        },
        request: true
      }
    });
    
    if (sampleQuotes.length > 0) {
      sampleQuotes.forEach(quote => {
        console.log(`   - "${quote.title}" (Org: ${quote.organizationId})`);
        console.log(`     Status: ${quote.status}, Professional: ${quote.professional?.email}`);
      });
    } else {
      console.log('   No quotes found');
    }

    console.log('\n✅ Check complete!');
    console.log('\n📌 To login use:');
    console.log('   Email: admin@example.com');
    console.log('   Password: Admin123!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixAdmin();