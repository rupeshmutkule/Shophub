import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  password: String,
  userType: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', userSchema);
