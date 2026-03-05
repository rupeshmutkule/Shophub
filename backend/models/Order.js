import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', index: true },
    productName: { type: String }, // snapshot
    quantity: { type: Number, min: 1 },

    // Legacy fields (for backward compatibility with frontend)
    name: { type: String },
    title: { type: String },
    price: { type: Number },
    photo: { type: String },
    image: { type: String },
    description: { type: String },
    isCustomized: { type: Boolean, default: false },
    customizationPreview: { type: String },
    customDesignUrl: { type: String },
    
    // Front and Back Design URLs (for customized products)
    frontDesignUrl: { type: String },
    backDesignUrl: { type: String },

    // Variant snapshot (size/color/material)
    variant: {
      sku: { type: String },
      size: { type: String },
      color: { type: String },
      material: { type: String },
    },

    // Pricing snapshot
    pricing: {
      retailUnitPrice: { type: Number, default: 0 },
      agentUnitPrice: { type: Number, default: 0 },
      bulkDiscountApplied: { type: Boolean, default: false },
      bulkRule: {
        minQty: Number,
        unitPrice: Number,
        percentOff: Number,
      },
      lineTotal: { type: Number, default: 0 },
    },

    // Custom design data (preview + high-res)
    customization: {
      designPreviewUrl: { type: String },
      designSourceJsonUrl: { type: String }, // editor JSON/state for re-rendering
      printableFiles: [
        {
          areaName: String,
          fileUrl: String,
          mimeType: String,
          widthPx: Number,
          heightPx: Number,
        },
      ],
    },

    reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    from: { type: String },
    to: { type: String, required: true },
    at: { type: Date, default: Date.now },
    byUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // --- Ownership / session (legacy + v2) ---
    sessionId: { type: String, index: true }, // legacy guest flow
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    placedByType: { type: String, enum: ['user', 'agent', 'guest'], default: 'guest', index: true },

    // --- Customer / shipping ---
    customerName: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, index: true },
    phone: { type: String, trim: true },
    shipping: {
      address1: { type: String },
      address2: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
      country: { type: String, default: 'IN' },
    },

    // Keep old fields (so existing frontend payloads still work)
    address: String,
    city: String,
    zip: String,

    // --- Items ---
    items: { type: [orderItemSchema], default: [] }, // replaces untyped Array

    // --- Totals ---
    subtotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    shippingTotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 }, // legacy + final total

    // --- Payment (dashboard revenue uses ONLY successful payments) ---
    payment: {
      provider: { type: String }, // e.g. razorpay/stripe/cod
      status: { type: String, enum: ['pending', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded'], default: 'pending', index: true },
      paidAt: { type: Date, index: true },
      currency: { type: String, default: 'INR' },
      amount: { type: Number, default: 0 }, // amount actually paid
      providerOrderId: { type: String },
      providerPaymentId: { type: String },
      refund: {
        status: { type: String, enum: ['none', 'requested', 'processing', 'refunded', 'failed'], default: 'none' },
        amount: { type: Number, default: 0 },
        reason: { type: String },
        requestedAt: { type: Date },
        refundedAt: { type: Date },
      },
      splitPayments: [
        {
          amount: Number,
          status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
          paidAt: Date,
          providerPaymentId: String,
        },
      ],
    },

    // --- Production / workflow ---
    status: {
      type: String,
      enum: [
        'order_received',
        'payment_verified',
        'design_converted',
        'pre_flight_approval',
        'in_production',
        'printed',
        'quality_check',
        'shipped',
        'delivered',
        'cancelled',
        'rejected',
        'refunded',
      ],
      default: 'order_received',
      index: true,
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
    cancellationReason: { type: String },
    cancelledAt: { type: Date },
    cancelledBy: { type: String, enum: ['user', 'admin', 'host', 'agent'], default: 'user' },
    preFlight: {
      decision: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
      decidedAt: { type: Date },
      decidedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      note: { type: String },
    },
    production: {
      printJobId: { type: String },
      printableFilesReady: { type: Boolean, default: false },
      printableFilesGeneratedAt: { type: Date },
    },

    // --- Fulfillment ---
    tracking: {
      carrier: { type: String },
      trackingId: { type: String, index: true },
      trackingUrl: { type: String },
      shippedAt: { type: Date },
      deliveredAt: { type: Date },
    },

    // --- Agent specific ---
    agent: {
      agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
      whiteLabelShipping: { type: Boolean, default: false },
      hidePlatformBrandingOnInvoice: { type: Boolean, default: false },
      bulkOrder: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.status': 1, 'payment.paidAt': -1 });

export default mongoose.model('Order', orderSchema);
