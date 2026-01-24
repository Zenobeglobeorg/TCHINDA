import express from 'express';
import {
  listCategories,
  getCategoryById,
  listProducts,
  getProductById,
  getProductReviews,
} from '../controllers/catalog.controller.js';

const router = express.Router();

// Categories (public)
router.get('/categories', listCategories);
router.get('/categories/:id', getCategoryById);

// Products (public)
router.get('/products', listProducts);
router.get('/products/:id', getProductById);
router.get('/products/:id/reviews', getProductReviews);

export default router;

