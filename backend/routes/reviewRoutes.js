import express from 'express';
import { createReviewHandler, getProductReviews } from '../controllers/reviewController.js';

const router = express.Router();

router.post('/', ...createReviewHandler);
router.get('/product/:productId', getProductReviews);

export default router;

