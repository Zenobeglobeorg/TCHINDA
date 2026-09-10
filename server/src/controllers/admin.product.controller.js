import { adminProductService } from '../services/admin.product.service.js';

export const listProducts = async (req, res, next) => {
  try {
    const { status, sellerId, categoryId, search, page = 1, limit = 20 } = req.query || {};
    const result = await adminProductService.listProducts({
      status,
      sellerId,
      categoryId,
      search,
      page,
      limit,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const approveProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await adminProductService.approveProduct(id);

    res.status(200).json({
      success: true,
      message: 'Produit approuvé avec succès',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await adminProductService.rejectProduct(id);

    res.status(200).json({
      success: true,
      message: 'Produit rejeté',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const product = await adminProductService.updateProductStatus(id, status);

    res.status(200).json({
      success: true,
      message: 'Statut du produit mis à jour',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
