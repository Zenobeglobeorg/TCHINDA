import { prisma } from '../utils/prisma.js';

function slugify(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateUniqueSlug(name, excludeId) {
  const base = slugify(name);
  let slug = base || `category-${Date.now()}`;
  let i = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.category.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return slug;
    slug = `${base}-${i}`;
    i += 1;
  }
}

export const adminCategoryService = {
  async listCategories() {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        parentId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const counts = await prisma.product.groupBy({
      by: ['categoryId'],
      where: { categoryId: { in: categories.map((c) => c.id) } },
      _count: { _all: true },
    });
    const countMap = new Map(counts.map((c) => [c.categoryId, c._count._all]));

    return categories.map((c) => ({
      ...c,
      productCount: countMap.get(c.id) || 0,
    }));
  },

  async createCategory(data) {
    const { name, description, parentId, image } = data || {};
    if (!name || !String(name).trim()) {
      const err = new Error('Le nom de la catégorie est requis');
      err.statusCode = 400;
      throw err;
    }

    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId }, select: { id: true } });
      if (!parent) {
        const err = new Error('Catégorie parente introuvable');
        err.statusCode = 400;
        throw err;
      }
    }

    const slug = await generateUniqueSlug(name);

    return prisma.category.create({
      data: {
        name: String(name).trim(),
        slug,
        description: description ? String(description).trim() : null,
        image: image ? String(image).trim() : null,
        parentId: parentId || null,
        isActive: true,
      },
    });
  },

  async updateCategory(categoryId, data) {
    const existing = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!existing) {
      const err = new Error('Catégorie introuvable');
      err.statusCode = 404;
      throw err;
    }

    const { name, description, parentId, image } = data || {};

    if (parentId && parentId === categoryId) {
      const err = new Error('La catégorie ne peut pas être son propre parent');
      err.statusCode = 400;
      throw err;
    }
    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId }, select: { id: true } });
      if (!parent) {
        const err = new Error('Catégorie parente introuvable');
        err.statusCode = 400;
        throw err;
      }
    }

    let slug;
    if (name && String(name).trim() && String(name).trim() !== existing.name) {
      slug = await generateUniqueSlug(name, categoryId);
    }

    return prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(slug ? { slug } : {}),
        ...(description !== undefined ? { description: description ? String(description).trim() : null } : {}),
        ...(image !== undefined ? { image: image ? String(image).trim() : null } : {}),
        ...(parentId !== undefined ? { parentId: parentId || null } : {}),
      },
    });
  },

  async toggleCategoryActive(categoryId, isActive) {
    const existing = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!existing) {
      const err = new Error('Catégorie introuvable');
      err.statusCode = 404;
      throw err;
    }

    return prisma.category.update({
      where: { id: categoryId },
      data: { isActive: Boolean(isActive) },
    });
  },

  async deleteCategory(categoryId) {
    const existing = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!existing) {
      const err = new Error('Catégorie introuvable');
      err.statusCode = 404;
      throw err;
    }

    await prisma.$transaction([
      // Détacher les enfants
      prisma.category.updateMany({
        where: { parentId: categoryId },
        data: { parentId: null },
      }),
      // Détacher les produits
      prisma.product.updateMany({
        where: { categoryId },
        data: { categoryId: null },
      }),
      prisma.category.delete({ where: { id: categoryId } }),
    ]);

    return { success: true };
  },
};

