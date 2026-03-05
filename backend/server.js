import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cors from 'cors';
import connectDB from './config/database.js';
import { requestLogger } from './middleware/logger.js';

// Import routes
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import adminDashboardRoutes from './routes/adminDashboardRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import razorpayRoutes from './routes/razorpayRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Trust proxy - CRITICAL for Render/Heroku to work with secure cookies
app.set('trust proxy', 1);

// ------------------ MIDDLEWARE ------------------
// CORS must be configured BEFORE session middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://shophub-chi-rose.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Increase payload limit for base64 images (composite customizations)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Session middleware - CRITICAL: Must be after CORS
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false, // Don't create session until something stored (changed from true)
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 7 * 24 * 60 * 60, // 7 days in seconds
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true for HTTPS in production
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-site in production
    domain: process.env.NODE_ENV === 'production' ? undefined : undefined, // Let browser set domain
  },
  name: 'shophub.sid', // Custom session cookie name
  rolling: true, // Reset maxAge on every request
  proxy: true, // Trust the reverse proxy for secure cookies
}));

app.use(requestLogger);

// Session debug middleware (helps track session issues)
app.use((req, res, next) => {
  console.log(`\n🔐 [${req.method}] ${req.path}`);
  console.log(`   Session ID: ${req.sessionID}`);
  console.log(`   User: ${req.session.user ? req.session.user.email : 'Guest'}`);
  console.log(`   UserType: ${req.session.user ? req.session.user.userType : 'N/A'}`);
  console.log(`   Cookie: ${req.headers.cookie || 'No cookie'}`);
  console.log(`   Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

// ------------------ DATABASE ------------------
connectDB(MONGO_URI);

// ------------------ ROUTES ------------------
app.get('/', (req, res) => {
  res.json({ 
    message: 'ShopHub API - MVC Architecture',
    session: req.sessionID,
    user: req.session.user || null,
  });
});

// Debug endpoint to check session
app.get('/api/debug/session', (req, res) => {
  res.json({
    sessionID: req.sessionID,
    user: req.session.user || null,
    cookie: req.session.cookie,
    sessionData: req.session,
    headers: {
      cookie: req.headers.cookie,
      origin: req.headers.origin,
      referer: req.headers.referer
    },
    env: {
      NODE_ENV: process.env.NODE_ENV,
      FRONTEND_URL: process.env.FRONTEND_URL
    }
  });
});

// Debug endpoint to check all orders (no auth required for debugging)
app.get('/api/debug/all-orders', async (req, res) => {
  try {
    const Order = (await import('./models/Order.js')).default;
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({
      total: orders.length,
      orders: orders.map(o => ({
        id: o._id,
        customer: o.customerName,
        email: o.email,
        total: o.total,
        status: o.status,
        createdAt: o.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/razorpay', razorpayRoutes);

// Legacy route for seeding (keeping for backward compatibility)
app.post('/api/seed', async (req, res) => {
  const { seedProducts } = await import('./controllers/productController.js');
  seedProducts(req, res);
});

// Legacy login route (keeping for backward compatibility)
app.post('/api/login', async (req, res) => {
  const { login } = await import('./controllers/userController.js');
  login(req, res);
});

// Legacy signup route (keeping for backward compatibility)
app.post('/api/signup', async (req, res) => {
  const { signup } = await import('./controllers/userController.js');
  signup(req, res);
});

// Legacy reset password route (keeping for backward compatibility)
app.post('/api/direct-reset-password', async (req, res) => {
  const { resetPassword } = await import('./controllers/userController.js');
  resetPassword(req, res);
});

// ------------------ ERROR HANDLING ------------------
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ------------------ START SERVER ------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 MVC Architecture implemented`);
  console.log(`🔐 Session management enabled`);
});
