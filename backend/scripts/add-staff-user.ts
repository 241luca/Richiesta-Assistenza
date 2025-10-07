import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function addStaffUser() {
  try {
    console.log('👤 Adding Staff user...\n')
    
    // Check if staff user already exists
    const existingStaff = await prisma.user.findUnique({
      where: { email: 'staff@assistenza.it' }
    })
    
    if (existingStaff) {
      console.log('⚠️ Staff user already exists')
      return
    }
    
    // Get an organization
    const org = await prisma.organization.findFirst()
    
    if (!org) {
      console.error('❌ No organization found. Please run seed first.')
      return
    }
    
    // Create staff user with password 'staff123' as shown in LoginPage
    const hashedPassword = await bcrypt.hash('staff123', 10)
    
    const staffUser = await prisma.user.create({
      data: {
        email: 'staff@assistenza.it',
        username: 'staff_assistenza',
        password: hashedPassword,
        firstName: 'Staff',
        lastName: 'Assistenza',
        fullName: 'Staff Assistenza',
        role: 'ADMIN', // Staff role maps to ADMIN in the system
        organizationId: org.id,
        emailVerified: true,
        phone: '+39 333 4567890',
        address: 'Via Staff 1',
        city: 'Roma',
        province: 'RM',
        postalCode: '00100'
      }
    })
    
    console.log('✅ Created Staff user:', staffUser.email)
    
    // Show all users
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        firstName: true,
        lastName: true
      }
    })
    
    console.log('\n📊 All users in database:')
    console.table(allUsers)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addStaffUser()
