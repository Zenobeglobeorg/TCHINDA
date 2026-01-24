import { catalogService } from '../services/catalog.service.js';

export const listCategories = async (req, res, next) => {
  try {
    const categories = await catalogService.listCategories();
    res.json({ success: true, data: categories });
  } catch (e) {
    next(e);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const category = await catalogService.getCategoryById(req.params.id);
    res.json({ success: true, data: category });
  } catch (e) {
    next(e);
  }
};

export const listProducts = async (req, res, next) => {
  try {
    const filters = catalogService.parseProductQuery(req.query);
    // categoryId peut venir vide ("") -> normaliser
    if (filters.categoryId === '') filters.categoryId = undefined;
    const result = await catalogService.listProducts(filters);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await catalogService.getProductById(req.params.id);
    res.json({ success: true, data: product });
  } catch (e) {
    next(e);
  }
};

export const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await catalogService.getProductReviews(req.params.id);
    res.json({ success: true, data: reviews });
  } catch (e) {
    next(e);
  }
};

