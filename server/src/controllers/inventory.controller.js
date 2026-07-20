import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as xlsx from 'xlsx';

const prisma = new PrismaClient();

export const inventoryController = {
  // ========== ENTREPÔTS ==========
  createWarehouse: async (req, res) => {
    try {
      const { name, location, managerName } = req.body;
      const sellerId = req.user.id;

      const warehouse = await prisma.warehouse.create({
        data: {
          sellerId,
          name,
          location,
          managerName,
        },
      });

      res.status(201).json({ success: true, data: warehouse });
    } catch (error) {
      console.error('Erreur createWarehouse:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la création de l\'entrepôt' });
    }
  },

  getWarehouses: async (req, res) => {
    try {
      const sellerId = req.user.id;
      const warehouses = await prisma.warehouse.findMany({
        where: { sellerId, isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ success: true, data: warehouses });
    } catch (error) {
      console.error('Erreur getWarehouses:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération des entrepôts' });
    }
  },

  updateWarehouse: async (req, res) => {
    try {
      const { id } = req.params;
      const sellerId = req.user.id;
      const { name, location, managerName, isActive } = req.body;

      const warehouse = await prisma.warehouse.findFirst({
        where: { id, sellerId },
      });

      if (!warehouse) {
        return res.status(404).json({ success: false, message: 'Entrepôt non trouvé' });
      }

      const updated = await prisma.warehouse.update({
        where: { id },
        data: { name, location, managerName, isActive },
      });

      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error('Erreur updateWarehouse:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de l\'entrepôt' });
    }
  },

  // ========== MOUVEMENTS DE STOCK ==========
  recordMovement: async (req, res) => {
    try {
      const { productId, variantId, warehouseId, type, quantity, reference, reason } = req.body;
      const createdBy = req.user.id;
      const sellerId = req.user.id;

      // Vérifier que le produit appartient au vendeur
      const product = await prisma.product.findFirst({
        where: { id: productId, sellerId },
        include: { variants: true }
      });

      if (!product) {
        return res.status(404).json({ success: false, message: 'Produit non trouvé' });
      }

      let currentStock = product.stock;
      let model = 'product';
      let targetId = productId;

      if (variantId) {
        const variant = product.variants.find(v => v.id === variantId);
        if (!variant) {
          return res.status(404).json({ success: false, message: 'Variante non trouvée' });
        }
        currentStock = variant.stock;
        model = 'productVariant';
        targetId = variantId;
      }

      let newStock = currentStock;
      const qty = Math.abs(parseInt(quantity));

      if (type === 'IN') {
        newStock = currentStock + qty;
      } else if (type === 'OUT') {
        newStock = currentStock - qty;
      } else if (type === 'ADJUST') {
        newStock = currentStock + parseInt(quantity);
      } else if (type === 'TRANSFER') {
        return res.status(400).json({ success: false, message: 'Transfert non implémenté' });
      }

      if (newStock < 0) {
        return res.status(400).json({ success: false, message: 'Le stock ne peut pas être négatif' });
      }

      // Transaction Prisma pour garantir l'intégrité
      const result = await prisma.$transaction(async (prismaClient) => {
        // 1. Mettre à jour le stock
        if (model === 'product') {
          await prismaClient.product.update({
            where: { id: targetId },
            data: { stock: newStock }
          });
        } else {
          await prismaClient.productVariant.update({
            where: { id: targetId },
            data: { stock: newStock }
          });
        }

        // 2. Enregistrer le mouvement
        const movement = await prismaClient.stockMovement.create({
          data: {
            productId,
            variantId,
            warehouseId,
            type,
            quantity: type === 'OUT' ? -qty : parseInt(quantity),
            previousStock: currentStock,
            newStock,
            reference,
            reason,
            createdBy
          }
        });

        return movement;
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      console.error('Erreur recordMovement:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de l\'enregistrement du mouvement de stock' });
    }
  },

  getMovements: async (req, res) => {
    try {
      const sellerId = req.user.id;
      const { productId, warehouseId, page = 1, limit = 20 } = req.query;

      const where = {
        product: { sellerId }
      };

      if (productId) where.productId = productId;
      if (warehouseId) where.warehouseId = warehouseId;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [movements, total] = await Promise.all([
        prisma.stockMovement.findMany({
          where,
          include: {
            product: { select: { name: true, sku: true } },
            variant: { select: { name: true, sku: true } },
            warehouse: { select: { name: true } },
            user: { select: { firstName: true, lastName: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit)
        }),
        prisma.stockMovement.count({ where })
      ]);

      res.status(200).json({
        success: true,
        data: movements,
        pagination: {
          total,
          page: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Erreur getMovements:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération des mouvements' });
    }
  },

  getAlerts: async (req, res) => {
    try {
      const sellerId = req.user.id;

      const products = await prisma.product.findMany({
        where: {
          sellerId,
          isActive: true,
          hasVariants: false,
          stock: { lte: prisma.product.fields.minStock }
        },
        select: { id: true, name: true, sku: true, stock: true, minStock: true }
      });

      const variants = await prisma.productVariant.findMany({
        where: {
          product: { sellerId, isActive: true },
          isActive: true,
          stock: { lte: prisma.productVariant.fields.minStock }
        },
        select: { 
          id: true, name: true, sku: true, stock: true, minStock: true,
          product: { select: { id: true, name: true } }
        }
      });

      res.status(200).json({ 
        success: true, 
        data: {
          products,
          variants
        } 
      });
    } catch (error) {
      console.error('Erreur getAlerts:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération des alertes' });
    }
  },

  // ========== IMPORT CSV/EXCEL ==========
  importProducts: async (req, res) => {
    try {
      const sellerId = req.user.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });
      }

      let records = [];

      if (file.originalname.endsWith('.csv')) {
        records = parse(file.buffer, {
          columns: true,
          skip_empty_lines: true,
          delimiter: [',', ';']
        });
      } else if (file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
        const workbook = xlsx.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        records = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      } else {
        return res.status(400).json({ success: false, message: 'Format de fichier non supporté. Utilisez CSV ou Excel.' });
      }

      if (records.length === 0) {
        return res.status(400).json({ success: false, message: 'Le fichier est vide' });
      }

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        try {
          const name = row['Nom'] || row['name'];
          const price = parseFloat(row['Prix'] || row['price']);
          const stock = parseInt(row['Stock'] || row['stock']) || 0;
          let sku = row['SKU'] || row['sku'];

          if (!name || isNaN(price)) {
            errors.push(`Ligne ${i + 2}: Nom ou prix invalide`);
            errorCount++;
            continue;
          }

          if (!sku) {
            sku = `SKU-${sellerId.substring(0, 4).toUpperCase()}-${Math.floor(Math.random() * 1000000)}`;
          }

          const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          let slug = baseSlug;
          let counter = 1;
          while (await prisma.product.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
          }

          await prisma.product.create({
            data: {
              sellerId,
              name,
              slug,
              description: row['Description'] || row['description'] || '',
              price,
              stock,
              sku,
              status: 'ACTIVE'
            }
          });

          successCount++;
        } catch (e) {
          console.error(`Erreur ligne ${i + 2}:`, e);
          errors.push(`Ligne ${i + 2}: Erreur système`);
          errorCount++;
        }
      }

      res.status(200).json({
        success: true,
        data: {
          total: records.length,
          successCount,
          errorCount,
          errors
        }
      });
    } catch (error) {
      console.error('Erreur importProducts:', error);
      res.status(500).json({ success: false, message: 'Erreur lors de l\'importation des produits' });
    }
  }
};
