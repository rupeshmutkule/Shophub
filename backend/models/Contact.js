import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  name: String,
  query: String,
  address: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Contact', contactSchema);
