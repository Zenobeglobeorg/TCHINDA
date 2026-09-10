import bcrypt from 'bcryptjs';
import { prisma } from '../src/utils/prisma.js';

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: node prisma/create-admin.js <email> <password>');
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        accountType: 'ADMIN',
        accountStatus: 'ACTIVE',
        emailVerified: true,
        phoneVerified: true,
        kycVerified: true,
        verificationStatus: 'VERIFIED',
      },
    });
    await prisma.adminProfile.upsert({
      where: { userId: existing.id },
      update: { level: 1, permissions: { all: true } },
      create: { userId: existing.id, level: 1, permissions: { all: true } },
    });
    console.log(`✅ Compte existant "${email}" promu ADMIN et mot de passe mis à jour.`);
  } else {
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        accountType: 'ADMIN',
        accountStatus: 'ACTIVE',
        firstName: 'Admin',
        lastName: 'TCHINDA',
        fullName: 'Admin TCHINDA',
        emailVerified: true,
        phoneVerified: true,
        kycVerified: true,
        verificationStatus: 'VERIFIED',
        adminProfile: { create: { level: 1, permissions: { all: true } } },
      },
    });
    console.log(`✅ Nouvel administrateur "${email}" créé.`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
