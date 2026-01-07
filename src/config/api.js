// src/config/api.js or wherever you keep API_BASE_URL
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://<>" // <-- replace this with your live backend URL
    : "http://127.0.0.1:5000"; // local backend

export default API_BASE_URL;