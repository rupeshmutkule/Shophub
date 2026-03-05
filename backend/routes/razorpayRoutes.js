import express from 'express';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentDetails,
} from '../controllers/razorpayController.js';

const router = express.Router();

// Create Razorpay order
router.post('/create-order', createRazorpayOrder);

// Verify Razorpay payment
router.post('/verify-payment', verifyRazorpayPayment);

// Get payment details
router.get('/payment/:paymentId', getPaymentDetails);

export default router;
