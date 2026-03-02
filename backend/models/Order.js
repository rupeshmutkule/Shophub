import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  sessionId: String,
  customerName: String,
  email: String,
  address: String,
  city: String,
  zip: String,
  items: Array,
  total: Number,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Order', orderSchema);
