import express from 'express';
import {
  listCategories,
  getCategoryById,
  listProducts,
  listDeals,
  getProductById,
  getProductReviews,
} from '../controllers/catalog.controller.js';
import { getCurrencyRates } from '../controllers/config.controller.js';

const router = express.Router();

// Configuration globale & devises (public)
router.get('/config/currency-rates', getCurrencyRates);

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

