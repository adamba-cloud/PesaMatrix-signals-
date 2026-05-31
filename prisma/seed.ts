import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'craigphilip761@gmail.com';
  const rawPassword = 'PesaMatrix@Temp2026';

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(rawPassword, 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        mustChangePassword: true,
      },
    });
    console.log(`Admin seeded: ${adminEmail} / temp password: ${rawPassword}`);
  } else {
    console.log('Admin already exists, skipping seed.');
  }

  // Ensure SystemConfig exists with defaults
  await prisma.systemConfig.upsert({
    where: { id: 'PESAMATRIX_CONFIG' },
    update: {},
    create: {
      id: 'PESAMATRIX_CONFIG',
      killSwitchActive: false,
      maxSpread: 5.0,
      maxVolatilityBonus: 20.0,
      subscriptionFee: 3000.0,
      subscriptionDays: 30,
    },
  });
  console.log('SystemConfig initialized.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
