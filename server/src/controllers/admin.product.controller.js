import { adminProductService } from '../services/admin.product.service.js';

export const listPendingProducts = async (req, res, next) => {
  try {
    const { sellerId, search, page = 1, limit = 20 } = req.query || {};
    const result = await adminProductService.listPendingProducts({
      sellerId,
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
