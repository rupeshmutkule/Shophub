# Shop-hub Setup Guide

## Initial Setup

### 1. Clone the Repository
```bash
git clone https://github.com/rupeshmutkule/Shophub.git
cd Shophub
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in `backend/` directory (copy from `.env.example`):
```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
SESSION_SECRET=your-session-secret
JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

BREVO_API_KEY=your-brevo-api-key
EMAIL_APP_NAME=Shop-hub
EMAIL_FROM_ADDRESS=your-email@example.com
```

Start backend server:
```bash
npm start
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` file in `frontend/` directory:
```env
REACT_APP_API_URL=http://localhost:5000
```

Start frontend:
```bash
npm start
```

## Features

- User authentication with JWT and bcrypt
- OTP email verification using Brevo
- Guest checkout (no login required)
- Admin/Host order management
- Session persistence with MongoDB
- Product management
- Shopping cart
- Order tracking

## Admin Access

To access admin features, register with userType: 'host' or 'admin'

## Tech Stack

- Frontend: React, Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB
- Authentication: JWT, bcrypt
- Email: Brevo API
- Session: express-session with MongoStore
