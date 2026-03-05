import express from 'express';
import {
  getAllProducts,
  getProductsByCategory,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  seedProducts,
} from '../controllers/productController.js';

const router = express.Router();

router.get('/', getAllProducts);
router.get('/category/:category', getProductsByCategory); // Must be before /:id
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.post('/seed', seedProducts);

export default router;
