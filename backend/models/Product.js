import mongoose from 'mongoose';

const bulkPricingRuleSchema = new mongoose.Schema(
  {
    minQty: { type: Number, required: true },
    unitPrice: { type: Number }, // fixed unit price
    percentOff: { type: Number }, // or % off base price
  },
  { _id: false }
);

const printableAreaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Front", "Back", "Wrap"
    // Boundaries in product template coordinate space (e.g. pixels for base mock image)
    bounds: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true },
    },
    rotationAllowed: { type: Boolean, default: true },
    maxLayers: { type: Number, default: 50 },
  },
  { _id: false }
);

const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, trim: true },
    size: { type: String, trim: true },
    color: { type: String, trim: true },
    material: { type: String, trim: true },
    stockQty: { type: Number, default: 0 }, // inventory per size/color/material
    lowStockThreshold: { type: Number, default: 5 },
    isEnabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    // --- Core (backward compatible fields kept) ---
    name: { type: String, required: true, trim: true, index: true },
    price: { type: Number, default: 0 }, // base retail price (legacy)
    rating: { type: Number, default: 0 }, // legacy; computed via reviews in v2
    photo: { type: String }, // legacy single photo
    description: { type: String },

    // --- Admin controls ---
    isEnabled: { type: Boolean, default: true, index: true },

    // --- Categorization ---
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },

    // --- Media ---
    images: [{ url: String, alt: String }],

    // --- Attributes / Variants ---
    attributes: {
      sizes: [{ type: String }],
      colors: [{ type: String }],
      materials: [{ type: String }],
    },
    variants: { type: [variantSchema], default: [] },

    // --- Customization / Printing ---
    customizer: {
      behaviorType: {
        type: String,
        enum: ['flat_print', 'wrap_around', 'circular_mask', 'glass_transparency'],
        default: 'flat_print',
      },
      tools: {
        text: { type: Boolean, default: true },
        imageUpload: { type: Boolean, default: true },
        freeDrawing: { type: Boolean, default: false },
        layers: { type: Boolean, default: true },
      },
      printableAreas: { type: [printableAreaSchema], default: [] },
    },

    // --- Pricing ---
    pricing: {
      basePrice: { type: Number, default: 0 }, // preferred over legacy `price`
      agentMarginPercent: { type: Number, default: 0 }, // product-level override
      bulkRules: { type: [bulkPricingRuleSchema], default: [] },
    },

    // --- Analytics snapshot ---
    reviewSummary: {
      avgRating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

productSchema.index({ categoryId: 1, isEnabled: 1 });
productSchema.index({ 'variants.sku': 1 }, { sparse: true });

export default mongoose.model('Product', productSchema);
