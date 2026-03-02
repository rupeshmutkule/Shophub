# 🛍️ ShopHub - E-Commerce Platform

A full-stack e-commerce application built with React and Node.js, featuring MVC architecture and session-based authentication.

## ✨ Features

- 🛒 **Guest Checkout** - Purchase without creating an account
- 👤 **User Accounts** - Register and track orders
- 📦 **Order Management** - Track order status and history
- 🔐 **Session-Based Auth** - Secure session management
- 👨‍💼 **Admin Panel** - Manage products and orders
- 🎨 **Modern UI** - Built with Tailwind CSS
- 📱 **Responsive Design** - Works on all devices

## 🏗️ Architecture

This project follows the **MVC (Model-View-Controller)** pattern:

```
┌─────────────────────────────────────────┐
│         Frontend (React)                │
│              View Layer                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Backend (Express)               │
│  ┌────────────────────────────────┐    │
│  │  Routes (API Endpoints)        │    │
│  └──────────┬─────────────────────┘    │
│  ┌──────────▼─────────────────────┐    │
│  │  Controllers (Business Logic)  │    │
│  └──────────┬─────────────────────┘    │
│  ┌──────────▼─────────────────────┐    │
│  │  Models (Data Layer)           │    │
│  └──────────┬─────────────────────┘    │
└─────────────┼──────────────────────────┘
              │
┌─────────────▼──────────────────────────┐
│         MongoDB Database                │
└─────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd Shop-hub
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Configure environment variables**

Create/update `backend/.env`:
```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
SESSION_SECRET=your_secret_key_change_in_production
FRONTEND_URL=http://localhost:3000
```

4. **Start the backend**
```bash
npm start
```

5. **Install frontend dependencies** (in a new terminal)
```bash
cd frontend
npm install
```

6. **Start the frontend**
```bash
npm start
```

7. **Open your browser**
```
http://localhost:3000
```

## 📁 Project Structure

```
Shop-hub/
├── backend/                 # Backend (Node.js + Express)
│   ├── config/             # Configuration files
│   ├── controllers/        # Business logic
│   ├── middleware/         # Custom middleware
│   ├── models/             # Database schemas
│   ├── routes/             # API endpoints
│   └── server.js           # Entry point
│
├── frontend/               # Frontend (React)
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── Pages/         # Page components
│   │   └── config/        # Configuration
│   └── public/            # Static files
│
└── docs/                  # Documentation
    ├── QUICK_START.md
    ├── SETUP_GUIDE.md
    └── ...
```

## 🔌 API Endpoints

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Users
- `POST /api/users/signup` - Register user
- `POST /api/users/login` - Login user
- `POST /api/users/logout` - Logout user
- `GET /api/users/current` - Get current user

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get orders (session-based)
- `DELETE /api/orders/:id` - Cancel order
- `PATCH /api/orders/:id/status` - Update status (admin)

### Contact
- `POST /api/contact` - Submit contact form

## 🎯 Key Features Explained

### Guest Checkout
Users can purchase products without creating an account. Orders are tracked using session IDs.

### Session Management
- Secure session cookies (httpOnly)
- 24-hour session expiry
- Automatic session creation
- Orders linked to sessions

### Admin Features
- View all orders
- Accept/reject orders
- Manage products
- View statistics

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Get started in 2 minutes
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed setup instructions
- **[MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)** - Architecture migration details
- **[FILE_STRUCTURE.md](FILE_STRUCTURE.md)** - Complete file structure
- **[backend/README.md](backend/README.md)** - Backend API documentation
- **[backend/ARCHITECTURE.md](backend/ARCHITECTURE.md)** - Architecture diagrams

## 🧪 Testing

### Manual Testing

**Guest User Flow:**
1. Browse products
2. Add to cart
3. Checkout without login
4. View order confirmation

**Logged-In User Flow:**
1. Register/Login
2. Place order
3. View order history

**Admin Flow:**
1. Login as admin
2. Manage orders
3. Manage products

## 🔒 Security

- Session-based authentication
- httpOnly cookies
- CORS configuration
- Admin access control
- Environment variables for secrets

## 🛠️ Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- express-session
- CORS

### Frontend
- React
- React Router
- Tailwind CSS
- Fetch API

## 📝 Environment Variables

```env
# Backend (.env)
MONGO_URI=mongodb://...
PORT=5000
SESSION_SECRET=your_secret_key
FRONTEND_URL=http://localhost:3000
```

## 🚀 Deployment

### Backend
1. Update environment variables
2. Set `NODE_ENV=production`
3. Use Redis for session store
4. Enable secure cookies (HTTPS)

### Frontend
1. Build: `npm run build`
2. Deploy build folder
3. Update API URL in config

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- FakeStore API for sample products
- Tailwind CSS for styling
- MongoDB for database

## 📞 Support

For issues and questions:
- Check the documentation files
- Review the troubleshooting section in SETUP_GUIDE.md
- Open an issue on GitHub

## 🎉 Version History

### v2.0.0 (Current)
- ✅ MVC architecture implemented
- ✅ Session management added
- ✅ Guest checkout enabled
- ✅ Comprehensive documentation

### v1.0.0
- Initial release
- Basic e-commerce functionality

---

**Built with ❤️ using React and Node.js**

**Ready to start?** Check out [QUICK_START.md](QUICK_START.md)!
