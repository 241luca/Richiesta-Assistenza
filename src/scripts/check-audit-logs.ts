// Test script to check AuditLog table
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Count total records
    const count = await prisma.auditLog.count();
    console.log(`\n📊 Total AuditLog records: ${count}`);
    
    // Get latest 5 records
    const latestLogs = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            fullName: true,
            role: true
          }
        }
      }
    });
    
    console.log('\n📝 Latest 5 Audit Logs:');
    console.log('------------------------');
    
    latestLogs.forEach((log, index) => {
      console.log(`\n${index + 1}. Record ID: ${log.id}`);
      console.log(`   Timestamp: ${log.timestamp}`);
      console.log(`   User: ${log.user?.email || log.userEmail || 'System'}`);
      console.log(`   Action: ${log.action}`);
      console.log(`   Entity: ${log.entityType} ${log.entityId ? `(${log.entityId})` : ''}`);
      console.log(`   Success: ${log.success ? '✅' : '❌'}`);
      console.log(`   Category: ${log.category}`);
      console.log(`   Severity: ${log.severity}`);
    });
    
    // Group by action
    const actionGroups = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: true,
      orderBy: {
        _count: {
          action: 'desc'
        }
      }
    });
    
    console.log('\n📈 Actions Summary:');
    console.log('-------------------');
    actionGroups.forEach(group => {
      console.log(`   ${group.action}: ${group._count} occurrences`);
    });
    
    // Check for any errors
    const errors = await prisma.auditLog.count({
      where: { success: false }
    });
    
    console.log(`\n⚠️  Failed operations: ${errors}`);
    
  } catch (error) {
    console.error('❌ Error querying AuditLog:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
