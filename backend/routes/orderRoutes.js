import express from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  cancelOrderByUser,
  cancelOrderByAdmin,
} from '../controllers/orderController.js';
import { authenticateToken } from '../utils/jwt.js';

const router = express.Router();

router.post('/', createOrder);
router.get('/', authenticateToken, getOrders);
router.get('/:id', getOrderById);
router.delete('/:id', authenticateToken, cancelOrder);
router.patch('/:id/status', authenticateToken, updateOrderStatus); // Add JWT auth
router.patch('/:id/cancel', cancelOrderByUser);
router.patch('/:id/admin-cancel', authenticateToken, cancelOrderByAdmin);

export default router;
