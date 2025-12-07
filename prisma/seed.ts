// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando a semeadura do banco (Seeding)...')

  // 1. Criar os Cargos (Roles)
  // Usamos 'upsert' para criar apenas se não existir
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Acesso total ao sistema',
      isSystem: true
    }
  })

  await prisma.role.upsert({
    where: { name: 'AGENT' },
    update: {},
    create: {
      name: 'AGENT',
      description: 'Operador de Atendimento',
      isSystem: false
    }
  })

  await prisma.role.upsert({
    where: { name: 'IT_SUPPORT' },
    update: {},
    create: {
      name: 'IT_SUPPORT',
      description: 'Técnico de Help Desk',
      isSystem: false
    }
  })

  console.log('✅ Cargos criados.')

  // 2. Criar o Usuário Admin
  const passwordHash = await bcrypt.hash('123456', 10) // Senha inicial: 123456

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@callcenter.com' },
    update: {},
    create: {
      email: 'admin@callcenter.com',
      username: 'admin',
      fullName: 'Administrador do Sistema',
      matricula: '0001',
      password: passwordHash,
      roleId: adminRole.id,
      isActive: true
    }
  })

  console.log(`✅ Usuário Admin criado: ${adminUser.email} (Senha: 123456)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })