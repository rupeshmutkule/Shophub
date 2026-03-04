import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { requireAuth } from '../utils/jwt.js';

const getAuthenticatedUserId = (req) => {
  if (req.user?.id) return req.user.id;
  if (req.session?.user?.id) return req.session.user.id;
  return null;
};

export const createReviewHandler = [
  requireAuth,
  async (req, res) => {
    try {
      const userId = getAuthenticatedUserId(req);
      if (!userId) return res.status(401).json({ error: 'Authentication required' });

      const { productId, orderId, rating, comment } = req.body || {};
      if (!productId || !orderId || !rating) {
        return res.status(400).json({ error: 'productId, orderId and rating are required' });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });

      const isDelivered = order.status === 'delivered';
      if (!isDelivered) {
        return res.status(400).json({ error: 'You can review only delivered orders' });
      }

      const ownsOrder =
        String(order.userId) === String(userId) ||
        (order.email && req.session?.user?.email && order.email === req.session.user.email);

      if (!ownsOrder) {
        return res.status(403).json({ error: 'You can review only your own orders' });
      }

      const already = await Review.findOne({ productId, orderId, userId });
      if (already) {
        return res.status(400).json({ error: 'You have already reviewed this product in this order' });
      }

      const review = await Review.create({
        productId,
        orderId,
        userId,
        rating,
        comment,
        status: 'pending',
      });

      res.status(201).json({ message: 'Review submitted for approval', reviewId: review._id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
];

export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ productId, status: 'approved' })
      .sort({ createdAt: -1 })
      .select('rating comment createdAt');

    const summary = await Review.aggregate([
      { $match: { productId: Review.db.castObjectId(productId), status: 'approved' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    const meta = summary?.[0] || { avgRating: 0, count: 0 };

    res.json({
      averageRating: meta.avgRating,
      count: meta.count,
      reviews,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

