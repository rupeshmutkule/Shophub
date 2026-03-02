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

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// ------------------ MIDDLEWARE ------------------
// CORS must be configured BEFORE session middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Session middleware - CRITICAL: Must be after CORS
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: true, // Create session for all users (guest and logged-in)
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 7 * 24 * 60 * 60, // 7 days in seconds
  }),
  cookie: {
    secure: false, // Set to false for development (http://localhost)
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    sameSite: 'lax', // 'lax' works for same-site requests in development
  },
  name: 'shophub.sid', // Custom session cookie name
  rolling: true, // Reset maxAge on every request
}));

app.use(requestLogger);

// Session debug middleware (helps track session issues)
app.use((req, res, next) => {
  console.log(`\n🔐 [${req.method}] ${req.path}`);
  console.log(`   Session ID: ${req.sessionID}`);
  console.log(`   User: ${req.session.user ? req.session.user.email : 'Guest'}`);
  console.log(`   Cookie: ${req.headers.cookie || 'No cookie'}`);
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
    sessionData: req.session
  });
});

app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contact', contactRoutes);

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
