import express from 'express';
import {
  listCategories,
  getCategoryById,
  listProducts,
  listDeals,
  getProductById,
  getProductReviews,
} from '../controllers/catalog.controller.js';

const router = express.Router();

// Categories (public)
router.get('/categories', listCategories);
router.get('/categories/:id', getCategoryById);

// Products (public)
router.get('/products', listProducts);
// Deals (public)
router.get('/deals', listDeals);
router.get('/products/:id', getProductById);
router.get('/products/:id/reviews', getProductReviews);

export default router;

