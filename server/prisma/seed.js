import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed...');

  // Créer un administrateur fondateur par défaut
  const adminEmail = 'admin@tchinda.com';
  const adminPassword = 'Admin@1234';

  // Vérifier si l'admin existe déjà
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('✅ Administrateur déjà existant');
    return;
  }

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  // Créer l'administrateur
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
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
      adminProfile: {
        create: {
          level: 1,
          permissions: {
            all: true,
          },
        },
      },
    },
  });

  console.log('✅ Administrateur créé avec succès');
  console.log(`📧 Email: ${adminEmail}`);
  console.log(`🔑 Mot de passe: ${adminPassword}`);
  console.log('⚠️  Changez ce mot de passe après la première connexion!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



