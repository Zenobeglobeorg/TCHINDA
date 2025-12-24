import { PrismaClient } from '@prisma/client';
import { generateOrderNumber } from '../utils/order.utils.js';

const prisma = new PrismaClient();

/**
 * Get buyer profile with related data
 */
export const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      buyerProfile: true,
      addresses: {
        orderBy: { isDefault: 'desc' },
      },
    },
  });

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  return user;
};

/**
 * Update buyer profile
 */
export const updateProfile = async (userId, updateData) => {
  const allowedFields = [
    'firstName',
    'lastName',
    'phone',
    'dateOfBirth',
    'country',
    'city',
    'address',
    'postalCode',
    'photo',
  ];

  const dataToUpdate = {};
  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      dataToUpdate[field] = updateData[field];
    }
  });

  if (updateData.dateOfBirth) {
    dataToUpdate.dateOfBirth = new Date(updateData.dateOfBirth);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate,
    include: {
      buyerProfile: true,
      addresses: true,
    },
  });

  return user;
};

/**
 * Get all addresses
 */
export const getAddresses = async (userId) => {
  return await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
};

/**
 * Create address
 */
export const createAddress = async (userId, addressData) => {
  // If this is set as default, unset other defaults
  if (addressData.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  return await prisma.address.create({
    data: {
      ...addressData,
      userId,
    },
  });
};

/**
 * Get address by ID
 */
export const getAddress = async (userId, addressId) => {
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!address) {
    throw new Error('Adresse non trouvée');
  }

  return address;
};

/**
 * Update address
 */
export const updateAddress = async (userId, addressId, addressData) => {
  // Verify ownership
  await getAddress(userId, addressId);

  // If setting as default, unset other defaults
  if (addressData.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true, id: { not: addressId } },
      data: { isDefault: false },
    });
  }

  return await prisma.address.update({
    where: { id: addressId },
    data: addressData,
  });
};

/**
 * Delete address
 */
export const deleteAddress = async (userId, addressId) => {
  await getAddress(userId, addressId);
  await prisma.address.delete({
    where: { id: addressId },
  });
};

/**
 * Set default address
 */
export const setDefaultAddress = async (userId, addressId) => {
  await getAddress(userId, addressId);

  // Unset all defaults
  await prisma.address.updateMany({
    where: { userId, isDefault: true },
    data: { isDefault: false },
  });

  // Set new default
  return await prisma.address.update({
    where: { id: addressId },
    data: { isDefault: true },
  });
};

/**
 * Get wallet with currencies
 */
export const getWallet = async (userId) => {
  let wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: {
      walletCurrencies: true,
    },
  });

  // Create wallet if it doesn't exist
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId,
        balance: 0,
        currency: 'XOF',
        walletCurrencies: {
          create: {
            currency: 'XOF',
            balance: 0,
          },
        },
      },
      include: {
        walletCurrencies: true,
      },
    });
  }

  return wallet;
};

/**
 * Get transactions
 */
export const getTransactions = async (userId, options = {}) => {
  const wallet = await getWallet(userId);

  const where = { walletId: wallet.id };
  if (options.type) where.type = options.type;
  if (options.status) where.status = options.status;

  return await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options.limit || 50,
    skip: options.offset || 0,
  });
};

/**
 * Deposit to wallet
 */
export const deposit = async (userId, { amount, currency, paymentMethod }) => {
  const wallet = await getWallet(userId);

  // Find or create currency wallet
  let walletCurrency = await prisma.walletCurrency.findUnique({
    where: {
      walletId_currency: {
        walletId: wallet.id,
        currency,
      },
    },
  });

  if (!walletCurrency) {
    walletCurrency = await prisma.walletCurrency.create({
      data: {
        walletId: wallet.id,
        currency,
        balance: 0,
      },
    });
  }

  // Update balance
  const newBalance = parseFloat(walletCurrency.balance) + amount;
  await prisma.walletCurrency.update({
    where: { id: walletCurrency.id },
    data: { balance: newBalance },
  });

  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      type: 'DEPOSIT',
      amount,
      currency,
      status: 'COMPLETED',
      paymentMethod,
      description: `Dépôt de ${amount} ${currency}`,
    },
  });

  return transaction;
};

/**
 * Withdraw from wallet
 */
export const withdraw = async (userId, { amount, currency, paymentMethod }) => {
  const wallet = await getWallet(userId);

  const walletCurrency = await prisma.walletCurrency.findUnique({
    where: {
      walletId_currency: {
        walletId: wallet.id,
        currency,
      },
    },
  });

  if (!walletCurrency || parseFloat(walletCurrency.balance) < amount) {
    throw new Error('Solde insuffisant');
  }

  // Update balance
  const newBalance = parseFloat(walletCurrency.balance) - amount;
  await prisma.walletCurrency.update({
    where: { id: walletCurrency.id },
    data: { balance: newBalance },
  });

  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      type: 'WITHDRAWAL',
      amount,
      currency,
      status: 'PENDING', // Will be updated when payment is confirmed
      paymentMethod,
      description: `Retrait de ${amount} ${currency}`,
    },
  });

  return transaction;
};

/**
 * Transfer between currencies
 */
export const transfer = async (userId, { fromCurrency, toCurrency, amount }) => {
  const wallet = await getWallet(userId);

  // Get source currency
  const fromWalletCurrency = await prisma.walletCurrency.findUnique({
    where: {
      walletId_currency: {
        walletId: wallet.id,
        currency: fromCurrency,
      },
    },
  });

  if (!fromWalletCurrency || parseFloat(fromWalletCurrency.balance) < amount) {
    throw new Error('Solde insuffisant');
  }

  // Get or create destination currency
  let toWalletCurrency = await prisma.walletCurrency.findUnique({
    where: {
      walletId_currency: {
        walletId: wallet.id,
        currency: toCurrency,
      },
    },
  });

  if (!toWalletCurrency) {
    toWalletCurrency = await prisma.walletCurrency.create({
      data: {
        walletId: wallet.id,
        currency: toCurrency,
        balance: 0,
      },
    });
  }

  // Simple conversion (in production, use real exchange rates)
  const exchangeRate = 1; // TODO: Implement real exchange rate
  const convertedAmount = amount * exchangeRate;

  // Update balances
  await prisma.walletCurrency.update({
    where: { id: fromWalletCurrency.id },
    data: { balance: parseFloat(fromWalletCurrency.balance) - amount },
  });

  await prisma.walletCurrency.update({
    where: { id: toWalletCurrency.id },
    data: { balance: parseFloat(toWalletCurrency.balance) + convertedAmount },
  });

  // Create transactions
  await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      type: 'WITHDRAWAL',
      amount,
      currency: fromCurrency,
      status: 'COMPLETED',
      description: `Transfert vers ${toCurrency}`,
    },
  });

  await prisma.transaction.create({
    data: {
      walletId: wallet.id,
      type: 'DEPOSIT',
      amount: convertedAmount,
      currency: toCurrency,
      status: 'COMPLETED',
      description: `Transfert depuis ${fromCurrency}`,
    },
  });

  return { fromCurrency, toCurrency, amount, convertedAmount };
};

/**
 * Get cart
 */
export const getCart = async (userId) => {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              seller: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  shopName: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  // Calculate totals
  const subtotal = cart.items.reduce((sum, item) => {
    return sum + parseFloat(item.price) * item.quantity;
  }, 0);

  return {
    ...cart,
    subtotal,
    shippingCost: 0, // Will be calculated based on subscription
    total: subtotal,
  };
};

/**
 * Add to cart
 */
export const addToCart = async (userId, productId, quantity = 1) => {
  // Get or create cart
  let cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
    });
  }

  // Get product
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error('Produit non trouvé');
  }

  if (product.status !== 'ACTIVE') {
    throw new Error('Produit non disponible');
  }

  // Check if item already in cart
  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
  });

  if (existingItem) {
    // Update quantity
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
    });
  } else {
    // Create new item
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
        price: product.price,
        currency: product.currency,
      },
    });
  }

  return await getCart(userId);
};

/**
 * Update cart item
 */
export const updateCartItem = async (userId, itemId, quantity) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    throw new Error('Panier non trouvé');
  }

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
  });

  if (!item) {
    throw new Error('Article non trouvé dans le panier');
  }

  if (quantity <= 0) {
    await prisma.cartItem.delete({
      where: { id: itemId },
    });
  } else {
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  return await getCart(userId);
};

/**
 * Remove from cart
 */
export const removeFromCart = async (userId, itemId) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    throw new Error('Panier non trouvé');
  }

  await prisma.cartItem.deleteMany({
    where: { id: itemId, cartId: cart.id },
  });

  return await getCart(userId);
};

/**
 * Clear cart
 */
export const clearCart = async (userId) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    return;
  }

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });
};

/**
 * Get wishlist
 */
export const getWishlist = async (userId) => {
  return await prisma.wishlistItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Add to wishlist
 */
export const addToWishlist = async (userId, productId) => {
  // Check if already in wishlist
  const existing = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

  if (existing) {
    return existing;
  }

  return await prisma.wishlistItem.create({
    data: {
      userId,
      productId,
    },
    include: {
      product: true,
    },
  });
};

/**
 * Remove from wishlist
 */
export const removeFromWishlist = async (userId, itemId) => {
  await prisma.wishlistItem.deleteMany({
    where: { id: itemId, userId },
  });
};

/**
 * Get orders
 */
export const getOrders = async (userId, options = {}) => {
  const where = { userId };
  if (options.status) where.status = options.status;

  return await prisma.order.findMany({
    where,
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: options.limit || 50,
    skip: options.offset || 0,
  });
};

/**
 * Get order by ID
 */
export const getOrder = async (userId, orderId) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error('Commande non trouvée');
  }

  return order;
};

/**
 * Create order from cart
 */
export const createOrder = async (userId, orderData) => {
  // Get cart
  const cart = await getCart(userId);

  if (!cart.items || cart.items.length === 0) {
    throw new Error('Le panier est vide');
  }

  // Calculate totals
  const subtotal = cart.items.reduce((sum, item) => {
    return sum + parseFloat(item.price) * item.quantity;
  }, 0);

  // Get user to check subscription for free shipping
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  const shippingCost =
    user?.subscriptionType === 'GOLD' || user?.subscriptionType === 'DIAMOND' ? 0 : orderData.shippingCost || 0;

  const total = subtotal + shippingCost;

  // Create order
  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId,
      status: 'PENDING',
      subtotal,
      shippingCost,
      total,
      currency: orderData.currency || 'XOF',
      shippingAddressId: orderData.shippingAddressId,
      billingAddressId: orderData.billingAddressId,
      paymentMethod: orderData.paymentMethod || 'WALLET',
      paymentStatus: 'PENDING',
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          currency: item.currency,
          total: parseFloat(item.price) * item.quantity,
          productSnapshot: {
            name: item.product?.name,
            image: item.product?.images?.[0],
            sku: item.product?.sku,
          },
        })),
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  // Clear cart
  await clearCart(userId);

  return order;
};

/**
 * Cancel order
 */
export const cancelOrder = async (userId, orderId) => {
  const order = await getOrder(userId, orderId);

  if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
    throw new Error('Cette commande ne peut pas être annulée');
  }

  return await prisma.order.update({
    where: { id: orderId },
    data: { status: 'CANCELLED' },
    include: {
      items: true,
    },
  });
};

/**
 * Get verification status
 */
export const getVerificationStatus = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      verifications: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return {
    emailVerified: user?.emailVerified || false,
    phoneVerified: user?.phoneVerified || false,
    kycVerified: user?.kycVerified || false,
    verificationStatus: user?.verificationStatus || 'PENDING',
    verifications: user?.verifications || [],
  };
};

/**
 * Request email verification
 */
export const requestEmailVerification = async (userId) => {
  // This would typically send an email with verification code
  // For now, we'll just return success
  // In production, integrate with email service
  return { success: true };
};

/**
 * Request phone verification
 */
export const requestPhoneVerification = async (userId) => {
  // This would typically send an SMS with verification code
  // For now, we'll just return success
  // In production, integrate with SMS service
  return { success: true };
};

/**
 * Submit KYC
 */
export const submitKYC = async (userId, kycData) => {
  return await prisma.verification.create({
    data: {
      userId,
      method: 'KYC_IDENTITY',
      status: 'PENDING',
      documentType: kycData.documentType,
      documentNumber: kycData.documentNumber,
      documentFront: kycData.documentFront,
      documentBack: kycData.documentBack,
      selfie: kycData.selfie,
    },
  });
};

/**
 * Get KYC status
 */
export const getKYCStatus = async (userId) => {
  const verifications = await prisma.verification.findMany({
    where: {
      userId,
      method: 'KYC_IDENTITY',
    },
    orderBy: { createdAt: 'desc' },
  });

  return verifications[0] || null;
};

/**
 * Get subscription
 */
export const getSubscription = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return {
    subscriptionType: user?.subscriptionType || 'FREE',
    subscriptionStart: user?.subscriptionStart,
    subscriptionEnd: user?.subscriptionEnd,
    isActive: user?.subscriptionEnd ? new Date(user.subscriptionEnd) > new Date() : false,
  };
};

/**
 * Subscribe
 */
export const subscribe = async (userId, subscriptionType) => {
  if (!['GOLD', 'DIAMOND'].includes(subscriptionType)) {
    throw new Error('Type d\'abonnement invalide');
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionType,
      subscriptionStart: startDate,
      subscriptionEnd: endDate,
    },
  });

  return {
    subscriptionType: user.subscriptionType,
    subscriptionStart: user.subscriptionStart,
    subscriptionEnd: user.subscriptionEnd,
  };
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionType: 'FREE',
      subscriptionEnd: null,
    },
  });
};


