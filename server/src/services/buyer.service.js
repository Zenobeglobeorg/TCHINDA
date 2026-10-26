import { prisma } from '../utils/prisma.js';
import { generateOrderNumber } from '../utils/order.utils.js';
import { randomUUID } from 'crypto';
import { sendEmailVerificationCode, sendPhoneVerificationCode } from './auth.service.js';
import { convertAmount } from './currency.service.js';
import { holdOrderFunds, releaseOrderFunds, refundOrderFunds, hasOpenDispute } from './escrow.service.js';

const normalizeMoney = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getVerificationContext = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      emailVerified: true,
      phoneVerified: true,
      kycVerified: true,
      verificationStatus: true,
    },
  });
};

const isUnlimitedVerified = (user) => !!user?.kycVerified;

const getMaxAmountForUser = (user) => {
  if (isUnlimitedVerified(user)) return null;
  // Montants configurables via env (par défaut: conservateurs)
  const rawUnverified = process.env.LIMIT_UNVERIFIED_MAX_AMOUNT || '50000';
  const rawEmailVerified = process.env.LIMIT_EMAIL_VERIFIED_MAX_AMOUNT || '200000';
  const max = user?.emailVerified ? rawEmailVerified : rawUnverified;
  const n = Number(max);
  return Number.isFinite(n) ? n : null;
};

export const enforceWalletTxLimits = async ({ userId, walletId, amount, currency }) => {
  const user = await getVerificationContext(userId);
  if (!user) {
    const err = new Error('Utilisateur non trouvé');
    err.statusCode = 404;
    throw err;
  }
  if (isUnlimitedVerified(user)) return;

  const maxPerDay = Number(process.env.LIMIT_UNVERIFIED_WALLET_TX_PER_DAY || 5);
  const count = await prisma.transaction.count({
    where: {
      walletId,
      type: { in: ['DEPOSIT', 'WITHDRAWAL', 'PAYMENT'] },
      createdAt: { gte: startOfToday() },
    },
  });

  if (Number.isFinite(maxPerDay) && count >= maxPerDay) {
    const err = new Error(
      'Limite atteinte: maximum 5 transactions/jour pour un compte non vérifié. Veuillez compléter la vérification (email + KYC) pour des accès illimités.'
    );
    err.statusCode = 403;
    throw err;
  }

  const maxAmount = getMaxAmountForUser(user);
  const safeAmount = normalizeMoney(amount);
  if (maxAmount !== null && safeAmount > maxAmount) {
    const err = new Error(
      `Montant trop élevé pour votre niveau de vérification. Limite actuelle: ${maxAmount} ${currency || ''}`.trim()
    );
    err.statusCode = 403;
    throw err;
  }
};

const enforceOrderLimits = async ({ userId, total, currency, isWalletPayment }) => {
  const user = await getVerificationContext(userId);
  if (!user) {
    const err = new Error('Utilisateur non trouvé');
    err.statusCode = 404;
    throw err;
  }
  if (isUnlimitedVerified(user)) return;

  const maxOrdersPerDay = Number(process.env.LIMIT_UNVERIFIED_ORDERS_PER_DAY || 5);
  const orderCount = await prisma.order.count({
    where: {
      userId,
      createdAt: { gte: startOfToday() },
    },
  });

  if (Number.isFinite(maxOrdersPerDay) && orderCount >= maxOrdersPerDay) {
    const err = new Error(
      'Limite atteinte: maximum 5 commandes/jour pour un compte non vérifié. Veuillez compléter la vérification (email + KYC) pour des accès illimités.'
    );
    err.statusCode = 403;
    throw err;
  }

  // Si paiement wallet: appliquer aussi les limites montant
  if (isWalletPayment) {
    const maxAmount = getMaxAmountForUser(user);
    const safeTotal = normalizeMoney(total);
    if (maxAmount !== null && safeTotal > maxAmount) {
      const err = new Error(
        `Montant trop élevé pour votre niveau de vérification. Limite actuelle: ${maxAmount} ${currency || ''}`.trim()
      );
      err.statusCode = 403;
      throw err;
    }
  }
};

const ensureWalletCurrency = async (tx, walletId, currency) => {
  const cur = currency || 'XOF';
  let walletCurrency = await tx.walletCurrency.findUnique({
    where: {
      walletId_currency: {
        walletId,
        currency: cur,
      },
    },
  });

  if (!walletCurrency) {
    walletCurrency = await tx.walletCurrency.create({
      data: {
        walletId,
        currency: cur,
        balance: 0,
      },
    });
  }

  return walletCurrency;
};

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
 * Withdraw from wallet — disabled until real payouts (MTN MoMo Disbursements) exist.
 * Previously this debited the wallet and created a PENDING transaction nobody processed.
 */
export const withdraw = async () => {
  const err = new Error(
    "Les retraits ne sont pas encore disponibles. Votre solde reste intact sur votre portefeuille. Cette fonctionnalité sera activée très prochainement."
  );
  err.statusCode = 503;
  throw err;
};

/**
 * Convert between the user's wallet currencies at the real exchange rate (computed server-side).
 * Atomic: the debit only happens if the balance is sufficient at that very moment.
 */
export const transfer = async (userId, { fromCurrency, toCurrency, amount }) => {
  const value = normalizeMoney(amount);
  if (!(value > 0)) {
    const err = new Error('Montant invalide');
    err.statusCode = 400;
    throw err;
  }
  if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) {
    const err = new Error('Veuillez choisir deux devises différentes');
    err.statusCode = 400;
    throw err;
  }

  const wallet = await getWallet(userId);
  const { converted, rate } = await convertAmount(value, fromCurrency, toCurrency);
  if (!(converted > 0)) {
    const err = new Error('Montant trop faible pour être converti');
    err.statusCode = 400;
    throw err;
  }
  const groupRef = randomUUID();

  await prisma.$transaction(async (tx) => {
    const debited = await tx.walletCurrency.updateMany({
      where: { walletId: wallet.id, currency: fromCurrency, balance: { gte: value } },
      data: { balance: { decrement: value } },
    });
    if (debited.count !== 1) {
      const err = new Error('Solde insuffisant');
      err.statusCode = 400;
      throw err;
    }

    await tx.walletCurrency.upsert({
      where: { walletId_currency: { walletId: wallet.id, currency: toCurrency } },
      update: { balance: { increment: converted } },
      create: { walletId: wallet.id, currency: toCurrency, balance: converted },
    });

    const metadata = { conversionId: groupRef, rate, fromCurrency, toCurrency };
    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'CONVERSION_OUT',
        amount: value,
        currency: fromCurrency,
        status: 'COMPLETED',
        reference: `CVT-${groupRef}-OUT`,
        description: `Conversion vers ${toCurrency}`,
        metadata,
      },
    });
    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'CONVERSION_IN',
        amount: converted,
        currency: toCurrency,
        status: 'COMPLETED',
        reference: `CVT-${groupRef}-IN`,
        description: `Conversion depuis ${fromCurrency}`,
        metadata,
      },
    });
  }, { timeout: 30000, maxWait: 10000 });

  return { fromCurrency, toCurrency, amount: value, convertedAmount: converted, rate };
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
          variant: true,
          product: {
            include: {
              seller: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  sellerProfile: {
                    select: {
                      shopName: true,
                    },
                  },
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
            variant: true,
            product: true,
          },
        },
      },
    });
  }

  // Normaliser le seller.shopName (stocké dans sellerProfile.shopName)
  const normalizedItems = (cart.items || []).map((item) => {
    const seller = item?.product?.seller;
    const normalizedSeller = seller
      ? {
          id: seller.id,
          firstName: seller.firstName,
          lastName: seller.lastName,
          shopName: seller?.sellerProfile?.shopName || null,
        }
      : undefined;

    const normalizedProduct = item.product
      ? {
          ...item.product,
          ...(normalizedSeller ? { seller: normalizedSeller } : {}),
        }
      : item.product;

    return {
      ...item,
      product: normalizedProduct,
    };
  });

  // Calculate totals
  const subtotal = normalizedItems.reduce((sum, item) => {
    return sum + parseFloat(item.price) * item.quantity;
  }, 0);

  return {
    ...cart,
    items: normalizedItems,
    subtotal,
    shippingCost: 0, // Will be calculated based on subscription
    total: subtotal,
  };
};

/**
 * Add to cart
 */
export const addToCart = async (userId, productId, quantity = 1, variantId = null) => {
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
    const err = new Error('Produit non trouvé');
    err.statusCode = 404;
    throw err;
  }

  // Autoriser l'ajout uniquement si le produit est visible et approuvé.
  const allowedStatuses = new Set(['ACTIVE']);
  if (!product.isActive || !allowedStatuses.has(product.status)) {
    const err = new Error('Produit non disponible');
    err.statusCode = 400;
    throw err;
  }

  // Si le produit a des variantes, exiger une variantId valide
  const normalizedVariantId = variantId ? String(variantId) : null;
  let variant = null;
  if (product.hasVariants) {
    if (!normalizedVariantId) {
      const err = new Error('Veuillez sélectionner une variante');
      err.statusCode = 400;
      throw err;
    }
    variant = await prisma.productVariant.findUnique({
      where: { id: normalizedVariantId },
    });
    if (!variant || variant.productId !== product.id || !variant.isActive) {
      const err = new Error('Variante invalide');
      err.statusCode = 400;
      throw err;
    }
    if (variant.stock <= 0) {
      const err = new Error('Variante en rupture de stock');
      err.statusCode = 400;
      throw err;
    }
  } else if (normalizedVariantId) {
    // Produit sans variantes: refuser une variantId pour éviter incohérences
    const err = new Error('Ce produit n’a pas de variantes');
    err.statusCode = 400;
    throw err;
  }

  const safeQty = Math.max(1, Number(quantity) || 1);

  // Check if item already in cart
  // IMPORTANT: le schema utilise @@unique([cartId, productId, variantId])
  // donc la variante fait partie de l'identité de l'article.
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId,
      variantId: normalizedVariantId,
    },
  });

  if (existingItem) {
    // Update quantity
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + safeQty },
    });
  } else {
    // Create new item
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        variantId: normalizedVariantId,
        quantity: safeQty,
        // Si variante: prendre son prix, sinon prix produit
        price: variant ? variant.price : product.price,
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
    const err = new Error('Panier non trouvé');
    err.statusCode = 404;
    throw err;
  }

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
  });

  if (!item) {
    const err = new Error('Article non trouvé dans le panier');
    err.statusCode = 404;
    throw err;
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
    // Retourner un format cohérent (avec product) comme lors de la création
    return await prisma.wishlistItem.findUnique({
      where: { id: existing.id },
      include: { product: true },
    });
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
 * Create orders from cart: one order per seller (grouped by checkoutGroupId), paid in a single operation.
 * The first order is returned as the "primary" one, with `groupOrders` and `groupTotal` for the full picture.
 */
export const createOrder = async (userId, orderData) => {
  const cart = await getCart(userId);

  if (!cart.items || cart.items.length === 0) {
    throw new Error('Le panier est vide');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const shippingCost =
    user?.subscriptionType === 'GOLD' || user?.subscriptionType === 'DIAMOND' ? 0 : orderData.shippingCost || 0;

  const paymentMethod = orderData.paymentMethod || 'WALLET';
  const currency = orderData.currency || 'XOF';

  // Group cart items by seller; shipping is charged once, on the first order.
  const bySeller = new Map();
  for (const item of cart.items) {
    const sellerId = item.product?.sellerId || null;
    if (!bySeller.has(sellerId)) bySeller.set(sellerId, []);
    bySeller.get(sellerId).push(item);
  }
  const drafts = [...bySeller.entries()].map(([sellerId, items], index) => {
    const subtotal = items.reduce((sum, it) => sum + parseFloat(it.price) * it.quantity, 0);
    const shipping = index === 0 ? shippingCost : 0;
    return { sellerId, items, subtotal, shipping, total: subtotal + shipping };
  });
  const groupTotal = drafts.reduce((sum, d) => sum + d.total, 0);
  const checkoutGroupId = randomUUID();

  await enforceOrderLimits({
    userId,
    total: groupTotal,
    currency,
    isWalletPayment: paymentMethod === 'WALLET',
  });

  const buildOrderData = (draft, extra) => ({
    orderNumber: generateOrderNumber(),
    userId,
    sellerId: draft.sellerId,
    checkoutGroupId,
    subtotal: draft.subtotal,
    shippingCost: draft.shipping,
    total: draft.total,
    currency,
    shippingAddressId: orderData.shippingAddressId,
    billingAddressId: orderData.billingAddressId,
    paymentMethod,
    ...extra,
    items: {
      create: draft.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        price: item.price,
        currency: item.currency,
        total: parseFloat(item.price) * item.quantity,
        productSnapshot: {
          name: item.product?.name,
          image: item.variant?.images?.[0] || item.product?.images?.[0],
          sku: item.variant?.sku || item.product?.sku,
          variantName: item.variant?.name || null,
        },
      })),
    },
  });
  const orderInclude = { items: { include: { product: true } } };
  const withGroup = (orders) => ({ ...orders[0], groupOrders: orders, groupTotal });

  // Wallet: real debit of the whole group, then one paid order (+ escrow) per seller.
  if (paymentMethod === 'WALLET') {
    const wallet = await getWallet(userId);
    await enforceWalletTxLimits({ userId, walletId: wallet.id, amount: groupTotal, currency });
    const safeTotal = normalizeMoney(groupTotal);
    const now = new Date();
    const paymentReference = `PAY-${randomUUID()}`;

    const orders = await prisma.$transaction(async (tx) => {
      const walletCurrency = await ensureWalletCurrency(tx, wallet.id, currency);
      const currentBalance = normalizeMoney(walletCurrency.balance);
      if (currentBalance < safeTotal) {
        const err = new Error('Solde insuffisant');
        err.statusCode = 400;
        throw err;
      }

      await tx.walletCurrency.update({
        where: { id: walletCurrency.id },
        data: { balance: currentBalance - safeTotal },
      });

      const created = [];
      for (const [index, draft] of drafts.entries()) {
        const order = await tx.order.create({
          data: buildOrderData(draft, {
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            paymentReference,
            paidAt: now,
          }),
          include: orderInclude,
        });

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            type: 'PAYMENT',
            amount: normalizeMoney(draft.total),
            currency,
            status: 'COMPLETED',
            reference: index === 0 ? paymentReference : `${paymentReference}-${index}`,
            description: `Paiement commande ${order.orderNumber}`,
            paymentMethod: 'WALLET',
            metadata: { orderId: order.id, checkoutGroupId },
          },
        });

        await holdOrderFunds(tx, order.id);
        created.push(order);
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    }, { timeout: 30000, maxWait: 10000 });

    return withGroup(orders);
  }

  // Other methods (e.g. MoMo): pending orders, paid later by the payment flow (whole group at once).
  const orders = await prisma.$transaction(async (tx) => {
    const created = [];
    for (const draft of drafts) {
      created.push(
        await tx.order.create({
          data: buildOrderData(draft, { status: 'PENDING', paymentStatus: 'PENDING' }),
          include: orderInclude,
        })
      );
    }
    return created;
  }, { timeout: 30000, maxWait: 10000 });

  await clearCart(userId);
  return withGroup(orders);
};

/**
 * Create order for a single item ("buy now") without touching the cart
 */
export const createBuyNowOrder = async (userId, orderData) => {
  const { productId, variantId = null, quantity = 1 } = orderData || {};

  if (!productId) {
    const err = new Error('productId est requis');
    err.statusCode = 400;
    throw err;
  }

  const safeQty = Math.max(1, Number(quantity) || 1);

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    const err = new Error('Produit non trouvé');
    err.statusCode = 404;
    throw err;
  }

  const allowedStatuses = new Set(['ACTIVE']);
  if (!product.isActive || !allowedStatuses.has(product.status)) {
    const err = new Error('Produit non disponible');
    err.statusCode = 400;
    throw err;
  }

  const normalizedVariantId = variantId ? String(variantId) : null;
  let variant = null;
  if (product.hasVariants) {
    if (!normalizedVariantId) {
      const err = new Error('Veuillez sélectionner une variante');
      err.statusCode = 400;
      throw err;
    }
    variant = await prisma.productVariant.findUnique({ where: { id: normalizedVariantId } });
    if (!variant || variant.productId !== product.id || !variant.isActive) {
      const err = new Error('Variante invalide');
      err.statusCode = 400;
      throw err;
    }
    if (variant.stock <= 0) {
      const err = new Error('Variante en rupture de stock');
      err.statusCode = 400;
      throw err;
    }
  } else {
    if (normalizedVariantId) {
      const err = new Error('Ce produit n’a pas de variantes');
      err.statusCode = 400;
      throw err;
    }
    if (product.stock <= 0) {
      const err = new Error('Produit en rupture de stock');
      err.statusCode = 400;
      throw err;
    }
  }

  const unitPrice = variant ? variant.price : product.price;
  const subtotal = parseFloat(unitPrice) * safeQty;

  // Get user to check subscription for free shipping
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  const shippingCost =
    user?.subscriptionType === 'GOLD' || user?.subscriptionType === 'DIAMOND' ? 0 : orderData.shippingCost || 0;

  const total = subtotal + shippingCost;

  const paymentMethod = orderData.paymentMethod || 'WALLET';
  const currency = product.currency || orderData.currency || 'XOF';

  await enforceOrderLimits({
    userId,
    total,
    currency,
    isWalletPayment: paymentMethod === 'WALLET',
  });

  if (paymentMethod === 'WALLET') {
    const wallet = await getWallet(userId);
    await enforceWalletTxLimits({ userId, walletId: wallet.id, amount: total, currency });
    const safeTotal = normalizeMoney(total);
    const now = new Date();
    const paymentReference = `PAY-${randomUUID()}`;

    const paidOrder = await prisma.$transaction(async (tx) => {
      const walletCurrency = await ensureWalletCurrency(tx, wallet.id, currency);
      const currentBalance = normalizeMoney(walletCurrency.balance);
      if (currentBalance < safeTotal) {
        const err = new Error('Solde insuffisant');
        err.statusCode = 400;
        throw err;
      }

      await tx.walletCurrency.update({
        where: { id: walletCurrency.id },
        data: { balance: currentBalance - safeTotal },
      });

      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          sellerId: product.sellerId,
          status: 'CONFIRMED',
          subtotal,
          shippingCost,
          total,
          currency,
          shippingAddressId: orderData.shippingAddressId,
          billingAddressId: orderData.billingAddressId,
          paymentMethod,
          paymentStatus: 'PAID',
          paymentReference,
          paidAt: now,
          items: {
            create: [
              {
                productId: product.id,
                variantId: normalizedVariantId,
                quantity: safeQty,
                price: unitPrice,
                currency: product.currency,
                total: parseFloat(unitPrice) * safeQty,
                productSnapshot: {
                  name: product.name,
                  image: variant?.images?.[0] || product?.images?.[0],
                  sku: variant?.sku || product?.sku,
                  variantName: variant?.name || null,
                },
              },
            ],
          },
        },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'PAYMENT',
          amount: safeTotal,
          currency,
          status: 'COMPLETED',
          reference: paymentReference,
          description: `Paiement commande ${order.orderNumber}`,
          paymentMethod: 'WALLET',
          metadata: { orderId: order.id },
        },
      });

      await holdOrderFunds(tx, order.id);

      return order;
    }, { timeout: 30000, maxWait: 10000 });

    return paidOrder;
  }

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId,
      sellerId: product.sellerId,
      status: 'PENDING',
      subtotal,
      shippingCost,
      total,
      currency,
      shippingAddressId: orderData.shippingAddressId,
      billingAddressId: orderData.billingAddressId,
      paymentMethod,
      paymentStatus: 'PENDING',
      items: {
        create: [
          {
            productId: product.id,
            variantId: normalizedVariantId,
            quantity: safeQty,
            price: unitPrice,
            currency: product.currency,
            total: parseFloat(unitPrice) * safeQty,
            productSnapshot: {
              name: product.name,
              image: variant?.images?.[0] || product?.images?.[0],
              sku: variant?.sku || product?.sku,
              variantName: variant?.name || null,
            },
          },
        ],
      },
    },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  });

  return order;
};

/**
 * Cancel order
 */
export const cancelOrder = async (userId, orderId) => {
  const order = await getOrder(userId, orderId);

  if (['SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status)) {
    throw new Error('Cette commande ne peut plus être annulée');
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: 'CANCELLED' },
    include: {
      items: true,
    },
  });

  await refundOrderFunds(orderId);
  return updated;
};

/**
 * Buyer confirms receipt: releases the escrow to the sellers' available balance
 */
export const confirmDelivery = async (userId, orderId) => {
  const order = await getOrder(userId, orderId);

  if (order.paymentStatus !== 'PAID') {
    const err = new Error("Cette commande n'est pas payée");
    err.statusCode = 400;
    throw err;
  }
  if (!['SHIPPED', 'DELIVERED'].includes(order.status)) {
    const err = new Error("La commande n'a pas encore été expédiée");
    err.statusCode = 400;
    throw err;
  }

  if (await hasOpenDispute(orderId)) {
    const err = new Error("Un litige est ouvert sur cette commande : les fonds sont gelés jusqu'à la décision de l'administrateur");
    err.statusCode = 400;
    throw err;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'DELIVERED', deliveredAt: order.deliveredAt || new Date() },
  });
  const released = await releaseOrderFunds(orderId);

  return { orderId, status: 'DELIVERED', releasedEscrows: released.length };
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
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('Utilisateur non trouvé');
    err.statusCode = 404;
    throw err;
  }
  return await sendEmailVerificationCode(user.email);
};

/**
 * Request phone verification
 */
export const requestPhoneVerification = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('Utilisateur non trouvé');
    err.statusCode = 404;
    throw err;
  }
  if (!user.phone) {
    const err = new Error('Numéro de téléphone requis');
    err.statusCode = 400;
    throw err;
  }
  return await sendPhoneVerificationCode(user.phone);
};

/**
 * Submit KYC
 */
export const submitKYC = async (userId, kycData) => {
  // If there is already a pending verification, update it instead of creating duplicates.
  const existingPending = await prisma.verification.findFirst({
    where: {
      userId,
      method: 'KYC_IDENTITY',
      status: 'PENDING',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existingPending) {
    const updated = await prisma.verification.update({
      where: { id: existingPending.id },
      data: {
        documentType: kycData.documentType ?? existingPending.documentType,
        documentNumber: kycData.documentNumber ?? existingPending.documentNumber,
        documentFront: kycData.documentFront ?? existingPending.documentFront,
        documentBack: kycData.documentBack ?? existingPending.documentBack,
        selfie: kycData.selfie ?? existingPending.selfie,
        updatedAt: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        kycVerified: false,
        verificationStatus: 'PENDING',
      },
    });

    return updated;
  }

  const created = await prisma.verification.create({
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

  await prisma.user.update({
    where: { id: userId },
    data: {
      kycVerified: false,
      verificationStatus: 'PENDING',
    },
  });

  return created;
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


