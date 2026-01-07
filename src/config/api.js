// src/config/api.js
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://shophub-6ua7.onrender.com" // Render backend URL
    : "http://127.0.0.1:5000"; // Local backend

export default API_BASE_URL;