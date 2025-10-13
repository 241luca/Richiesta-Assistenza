import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  const [service, key, nameArg, activeArg] = process.argv.slice(2)

  if (!service || !key) {
    console.error('Uso: npx ts-node scripts/set-api-key.ts <SERVICE> <KEY> [NAME] [active:true|false]')
    process.exit(1)
  }

  const name = nameArg ?? `${service} API Key`
  const isActive = activeArg ? activeArg === 'true' : true

  await prisma.apiKey.upsert({
    where: { service },
    update: {
      key,
      name,
      isActive,
      updatedAt: new Date()
    },
    create: {
      id: uuidv4(),
      service,
      key,
      name,
      isActive,
      updatedAt: new Date()
    }
  })

  console.log(`✅ API key impostata: ${service} (active=${isActive})`)
}

main()
  .catch((err) => {
    console.error('❌ Errore:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })