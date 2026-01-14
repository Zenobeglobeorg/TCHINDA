// Code à ajouter à la fin de server/src/services/admin.service.js

/**
 * Créer un nouvel utilisateur (par admin)
 */
export const createUser = async (userData) => {
  const { hashPassword } = await import('../utils/password.utils.js');
  const {
    email,
    password,
    accountType,
    firstName,
    lastName,
    phone,
    country,
  } = userData;

  return await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('Cet email est déjà utilisé');
    }

    if (phone) {
      const existingPhone = await tx.user.findUnique({ where: { phone } });
      if (existingPhone) {
        throw new Error('Ce numéro de téléphone est déjà utilisé');
      }
    }

    const hashedPassword = await hashPassword(password);
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : null;

    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        accountType,
        firstName,
        lastName,
        fullName,
        phone,
        country,
        accountStatus: 'ACTIVE',
        emailVerified: true,
        phoneVerified: phone ? true : false,
      },
    });

    switch (accountType) {
      case 'BUYER':
        await tx.buyerProfile.create({ data: { userId: user.id } });
        await tx.wallet.create({
          data: {
            userId: user.id,
            currency: country === 'SN' || country === 'CI' ? 'XOF' : 'XAF',
          },
        });
        break;
      case 'SELLER':
        await tx.sellerProfile.create({ data: { userId: user.id } });
        await tx.wallet.create({
          data: {
            userId: user.id,
            currency: country === 'SN' || country === 'CI' ? 'XOF' : 'XAF',
          },
        });
        break;
      case 'MODERATOR':
        await tx.moderatorProfile.create({ data: { userId: user.id } });
        break;
      case 'ACCOUNTANT':
        await tx.accountantProfile.create({ data: { userId: user.id } });
        break;
      case 'DELIVERY':
        await tx.deliveryProfile.create({ data: { userId: user.id } });
        break;
      case 'COMMERCIAL':
        await tx.commercialProfile.create({ data: { userId: user.id } });
        await tx.wallet.create({
          data: {
            userId: user.id,
            currency: country === 'SN' || country === 'CI' ? 'XOF' : 'XAF',
          },
        });
        break;
    }

    return user;
  });
};
