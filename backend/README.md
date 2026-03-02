# Backend - MVC Architecture

This backend follows the **Model-View-Controller (MVC)** architectural pattern for better code organization, maintainability, and scalability.

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # Database connection configuration
├── controllers/
│   ├── contactController.js # Contact form logic
│   ├── orderController.js   # Order management logic
│   ├── productController.js # Product CRUD operations
│   └── userController.js    # User authentication logic
├── middleware/
│   └── logger.js            # Request logging middleware
├── models/
│   ├── Contact.js           # Contact schema
│   ├── Order.js             # Order schema
│   ├── Product.js           # Product schema
│   └── User.js              # User schema
├── routes/
│   ├── contactRoutes.js     # Contact endpoints
│   ├── orderRoutes.js       # Order endpoints
│   ├── productRoutes.js     # Product endpoints
│   └── userRoutes.js        # User endpoints
├── .env                     # Environment variables
├── package.json
├── README.md
└── server.js                # Application entry point
```

## 🏗️ MVC Components

### Models (Data Layer)
Located in `models/` directory. Define database schemas using Mongoose.

- **Product.js**: Product information (name, price, rating, photo, description)
- **User.js**: User accounts (firstName, lastName, email, phone, password, userType)
- **Order.js**: Customer orders (sessionId, customerName, email, address, items, total, status)
- **Contact.js**: Contact form submissions (name, query, address)

### Controllers (Business Logic Layer)
Located in `controllers/` directory. Handle request processing and business logic.

- **productController.js**: Product CRUD operations, seeding
- **userController.js**: Signup, login, logout, session management
- **orderController.js**: Order creation, retrieval, cancellation, status updates
- **contactController.js**: Contact form submission handling

### Routes (API Layer)
Located in `routes/` directory. Define API endpoints and map them to controllers.

- **productRoutes.js**: `/api/products/*`
- **userRoutes.js**: `/api/users/*`
- **orderRoutes.js**: `/api/orders/*`
- **contactRoutes.js**: `/api/contact/*`

## 🔐 Session Management

The application uses **express-session** to manage user sessions:

- Sessions are stored server-side with a unique session ID
- Session cookies are sent to the client (httpOnly for security)
- Users can place orders without logging in (guest checkout)
- Orders are associated with session IDs for guest users
- Logged-in users have orders associated with their email

### Session Features:
- **Guest Checkout**: Users can order without creating an account
- **Order Tracking**: Orders are tracked by session ID or user email
- **Persistent Cart**: Cart data can be stored in session
- **Admin Access Control**: Admin routes check session for user type

## 🚀 API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/seed` - Seed database with sample products

### Users
- `POST /api/users/signup` - Register new user
- `POST /api/users/login` - Login user (creates session)
- `POST /api/users/logout` - Logout user (destroys session)
- `GET /api/users/current` - Get current logged-in user

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get orders (filtered by session/email)
- `GET /api/orders/:id` - Get specific order
- `DELETE /api/orders/:id` - Cancel order
- `PATCH /api/orders/:id/status` - Update order status (admin only)

### Contact
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - Get all contacts (admin only)

## 🔧 Installation & Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
SESSION_SECRET=your_secret_key_change_in_production
FRONTEND_URL=http://localhost:3000
```

3. Start the server:
```bash
npm start
```

## 🌟 Key Features

1. **Clean Separation of Concerns**: Models, Controllers, and Routes are separated
2. **Session-Based Authentication**: Secure session management with express-session
3. **Guest Checkout**: Users can order without creating an account
4. **Role-Based Access**: Admin-only routes for order management
5. **RESTful API Design**: Standard HTTP methods and status codes
6. **Error Handling**: Centralized error handling middleware
7. **Request Logging**: All requests are logged with timestamps
8. **CORS Support**: Cross-origin requests enabled for frontend

## 🔒 Security Features

- Session cookies with httpOnly flag
- Secure cookies in production (HTTPS)
- CORS configured for specific frontend origin
- Session secret for signing cookies
- Admin access control for sensitive operations

## 📝 Notes

- Legacy routes (`/api/login`, `/api/signup`, `/api/seed`) are maintained for backward compatibility
- All API requests from frontend should include `credentials: 'include'` to send session cookies
- Session expires after 24 hours of inactivity
- Orders without user accounts are tracked by session ID
