import mongoose from 'mongoose';

const agentTierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. Bronze/Silver/Gold
    marginPercent: { type: Number, default: 0 }, // overrides base agent margin when present
    minMonthlyRevenue: { type: Number, default: 0 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // --- Identity (backward compatible fields kept) ---
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true }, // bcrypt hash

    // --- Roles / Access ---
    // NOTE: existing code uses userType; keep it but enforce a finite set.
    userType: {
      type: String,
      enum: ['user', 'agent', 'admin', 'host'],
      default: 'user',
      index: true,
    },
    isBanned: { type: Boolean, default: false, index: true },
    bannedAt: { type: Date },
    bannedReason: { type: String },

    // --- Agent profile (only meaningful when userType === 'agent') ---
    agent: {
      approved: { type: Boolean, default: false, index: true },
      approvedAt: { type: Date },
      marginPercent: { type: Number, default: 0 }, // agent pricing overrides retail
      tier: { type: agentTierSchema, default: undefined },
      tieredPricingEnabled: { type: Boolean, default: false },
      bulkPurchaseEnabled: { type: Boolean, default: false },
      whiteLabelShippingEnabled: { type: Boolean, default: false },
      companyName: { type: String, trim: true },
      taxId: { type: String, trim: true },
    },

    // --- Audit ---
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

// Uniqueness (sparse so phone can be absent)
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });

export default mongoose.model('User', userSchema);
