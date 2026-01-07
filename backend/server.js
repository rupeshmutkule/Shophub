// server.js
import 'dotenv/config'; // Load environment variables from .env
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import fetch from 'node-fetch'; // For seeding products

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

console.log('🔥🔥🔥 BACKEND VERSION 2.2 - PRODUCTION READY (ES MODULE) 🔥🔥🔥');

// ------------------ MIDDLEWARE ------------------
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON request bodies

// Request Logger
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📦 Body:`, req.body);
  }
  next();
});

// ------------------ DATABASE ------------------
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// ------------------ SCHEMAS ------------------
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  rating: Number,
  photo: String,
  description: String,
  createdAt: { type: Date, default: Date.now },
});
const Product = mongoose.model('Product', productSchema);

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  password: String,
  userType: String,
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model('User', userSchema);

const contactSchema = new mongoose.Schema({
  name: String,
  query: String,
  address: String,
  createdAt: { type: Date, default: Date.now },
});
const Contact = mongoose.model('Contact', contactSchema);

const orderSchema = new mongoose.Schema({
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
const Order = mongoose.model('Order', orderSchema);

// ------------------ ROUTES ------------------

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

// Seed products
app.post('/api/seed', async (req, res) => {
  try {
    const count = await Product.countDocuments();
    if (count >= 25) return res.json({ message: 'Database already seeded (>=25 products).' });

    const response = await fetch('https://fakestoreapi.com/products?limit=25');
    const externalProducts = await response.json();

    const formattedProducts = externalProducts.map(p => ({
      name: p.title,
      price: p.price,
      rating: p.rating?.rate || 0,
      photo: p.image,
      description: p.description,
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
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Product
app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Signup
app.post('/api/signup', async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      message: 'Login successful',
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
      },
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Contact form
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

// Get Orders
app.get('/api/orders', async (req, res) => {
  try {
    const { email } = req.query;
    const query = email ? { email } : {};
    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel Order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order cancelled successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Order Status
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (status === 'rejected') {
      await Order.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Order rejected and removed' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(updatedOrder);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------ START SERVER ------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
