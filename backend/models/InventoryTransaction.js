import mongoose from 'mongoose';

const inventoryTransactionSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },

    // Variant identity (matches Product.variants)
    sku: { type: String, index: true },
    size: { type: String },
    color: { type: String },
    material: { type: String },

    type: { type: String, enum: ['reserve', 'release', 'deduct', 'restock', 'adjust'], required: true, index: true },
    qtyDelta: { type: Number, required: true }, // negative deduct, positive restock
    reason: { type: String },

    // Link to order when stock changes due to orders
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
    byUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin/agent/system
  },
  { timestamps: true }
);

inventoryTransactionSchema.index({ productId: 1, sku: 1, createdAt: -1 });
inventoryTransactionSchema.index({ orderId: 1, createdAt: -1 });

export default mongoose.model('InventoryTransaction', inventoryTransactionSchema);

