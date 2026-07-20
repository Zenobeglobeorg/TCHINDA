import express from 'express';
import { inventoryController } from '../controllers/inventory.controller.js';
import { authenticate, requireAccountType, requireSellerVerified } from '../middleware/auth.middleware.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.use(authenticate);
router.use(requireAccountType('SELLER'));
router.use(requireSellerVerified);

// ========== ENTREPÔTS ==========
router.post('/warehouses', inventoryController.createWarehouse);
router.get('/warehouses', inventoryController.getWarehouses);
router.put('/warehouses/:id', inventoryController.updateWarehouse);

// ========== MOUVEMENTS DE STOCK ==========
router.post('/movements', inventoryController.recordMovement);
router.get('/movements', inventoryController.getMovements);

// ========== ALERTES ==========
router.get('/alerts', inventoryController.getAlerts);

// ========== IMPORT ==========
router.post('/import', upload.single('file'), inventoryController.importProducts);

export default router;
