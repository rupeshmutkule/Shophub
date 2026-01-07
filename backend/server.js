const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 5000;

console.log('🔥🔥🔥 DATABASE BACKEND VERSION 2.0 - DEBUG READY 🔥🔥🔥');

// Middleware
app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📦 Body:`, req.body);
  }
  next();
});

// MongoDB Connection
// User provided URI: mongodb+srv://Rupesh:Mutkule%401@rupesh.lyhyirl.mongodb.net/airbnbRupesh
const MONGO_URI = "mongodb+srv://Rupesh:Mutkule%401@rupesh.lyhyirl.mongodb.net/airbnbRupesh";

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- Schemas & Models ---

// Product Schema
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  rating: Number,
  photo: String,
  description: String,
  createdAt: { type: Date, default: Date.now }
});
const Product = mongoose.model('Product', productSchema);

// User Schema (for Signup)
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String, // Mobile number for OTP
  password: String, // Note: In production, hash this!
  userType: String,
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Contact Schema
const contactSchema = new mongoose.Schema({
  name: String,
  query: String,
  address: String,
  createdAt: { type: Date, default: Date.now }
});
const Contact = mongoose.model('Contact', contactSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
  customerName: String,
  email: String,
  address: String,
  city: String,
  zip: String,
  items: Array, // simplified for demo
  total: Number,
  status: { type: String, default: 'pending' }, // pending, accepted, rejected
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// --- API Routes ---

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a product
app.post('/api/products', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.json(newProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seed Data
app.post('/api/seed', async (req, res) => {
  try {
    const count = await Product.countDocuments();
    if (count >= 25) {
      return res.json({ message: 'Database already has sufficient data (>= 25). Skipping seed.' });
    }

    // Use native fetch (Node 18+)
    const response = await fetch('https://fakestoreapi.com/products?limit=25');
    const externalProducts = await response.json();

    const formattedProducts = externalProducts.map(p => ({
       name: p.title,
       price: p.price,
       rating: p.rating ? p.rating.rate : 0,
       photo: p.image,
       description: p.description
    }));

    await Product.insertMany(formattedProducts);
    res.json({ message: 'Database seeded successfully with 25 products!' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Product
app.put('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updatedProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Product
app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Product.findByIdAndDelete(id);
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Signup User
app.post('/api/signup', async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login User (email or phone + password)
app.post('/api/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    console.log(`🔑 Login Attempt: Identifier="${identifier}", Password="${password}"`);
    
    // Find user by email OR phone
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });
    
    if (user) {
        console.log(`👤 User Found: Email="${user.email}", Phone="${user.phone}", StorePassword="${user.password}"`);
    } else {
        console.log(`❌ No user found for identifier: ${identifier}`);
    }

    if (!user || user.password !== password) {
       console.log('❌ Invalid credentials - Passwords do not match or user not found');
       return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Login Successful');
    res.json({ 
        message: 'Login successful',
        user: { 
            firstName: user.firstName, 
            lastName: user.lastName, 
            email: user.email,
            phone: user.phone,
            userType: user.userType 
        } 
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Direct Reset Password (No OTP - as requested)
app.post('/api/direct-reset-password', async (req, res) => {
  try {
    const { identifier, newPassword } = req.body;
    console.log(`🔄 Reset Attempt for: ${identifier}`);

    // Update user password
    const user = await User.findOneAndUpdate(
      { $or: [{ email: identifier }, { phone: identifier }] },
      { password: newPassword },
      { new: true }
    );

    if (!user) {
      console.log(`❌ Reset Failed: User not found for ${identifier}`);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`✅ Password Reset Successful for: ${user.email || user.phone}`);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error("❌ Reset Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// OTP Storage (In-memory for demo - use Redis in production)
const otpStore = new Map();

// Send OTP (Demo - just generates and returns OTP)
app.post('/api/send-otp', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or phone
    
    // Find user by email OR phone
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found with this email/phone' });
    }

    // Verify password first
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    if (!user.phone) {
      return res.status(400).json({ error: 'No phone number registered for this account' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with 5-minute expiry using phone as key
    otpStore.set(user.phone, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      userId: user._id
    });

    // In production, send OTP via SMS service (Twilio, AWS SNS, etc.)
    console.log(`📱 OTP for ${user.phone}: ${otp}`);
    
    // For demo: return OTP in response (NEVER do this in production!)
    res.json({ 
      message: 'OTP sent successfully',
      phone: user.phone, // Return phone so frontend knows where OTP was sent
      otp: otp, // Remove this in production
      demo: true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify OTP
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    const otpData = otpStore.get(phone);
    
    if (!otpData) {
      return res.status(400).json({ error: 'OTP not found or expired' });
    }

    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({ error: 'OTP expired' });
    }

    if (otpData.otp !== otp) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    // OTP is valid - fetch user and clear OTP
    otpStore.delete(phone);
    const user = await User.findById(otpData.userId);

    res.json({
      message: 'Login successful',
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        userType: user.userType
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Contact Form
app.post('/api/contact', async (req, res) => {
  try {
    const newContact = new Contact(req.body);
    await newContact.save();
    res.json({ message: 'Message received' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Place Order
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    res.json({ message: 'Order placed successfully', orderId: newOrder._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel Order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Order.findByIdAndDelete(id);
    res.json({ message: 'Order cancelled successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Order Status (Admin)
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'
    
    if (status === 'rejected') {
      // If rejected, delete the order
      await Order.findByIdAndDelete(id);
      res.json({ message: 'Order rejected and removed' });
    } else {
      // Update status to accepted
      const updatedOrder = await Order.findByIdAndUpdate(
        id, 
        { status }, 
        { new: true }
      );
      res.json(updatedOrder);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const { email } = req.query;
    console.log(`[DEBUG] Fetching orders. Email param: "${email}"`);
    let query = {};
    if (email) {
      query.email = { $regex: new RegExp('^' + email.replace(/[-\/^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') };
    }
    console.log(`[DEBUG] MongoDB Query:`, JSON.stringify(query));
    const orders = await Order.find(query).sort({ createdAt: -1 });
    console.log(`[DEBUG] Found ${orders.length} orders.`);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
