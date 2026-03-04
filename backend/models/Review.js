import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true },
    comment: { type: String, trim: true },

    // Moderation
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    moderatedAt: { type: Date },
    moderatedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    moderationNote: { type: String },
  },
  { timestamps: true }
);

// One review per user per order per product (prevents spam)
reviewSchema.index({ productId: 1, orderId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, status: 1, createdAt: -1 });

export default mongoose.model('Review', reviewSchema);

