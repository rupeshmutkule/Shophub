import mongoose from 'mongoose';

const categoryDiscountRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    percentOff: { type: Number, default: 0 },
    startsAt: { type: Date },
    endsAt: { type: Date },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, index: true },
    description: { type: String },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },

    // Category-level agent overrides / rules
    agentMarginPercent: { type: Number, default: 0 },
    discountRules: { type: [categoryDiscountRuleSchema], default: [] },

    isEnabled: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parentId: 1, isEnabled: 1 });

export default mongoose.model('Category', categorySchema);

