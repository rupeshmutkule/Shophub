import { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import API_BASE_URL from "./config/api";

import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Carts from "./Pages/Carts";  
import Contact from "./Pages/Contact";
import Terms from "./Pages/Terms";
import Products from "./Pages/Products";
import AddProduct from "./Pages/AddProduct";
import PlaceOrder from "./Pages/PlaceOrder";
import Proceed from "./Pages/Proceed";
import AdminProducts from "./Pages/AdminProducts";
import AdminOrders from "./Pages/AdminOrders";
import EditProduct from "./Pages/EditProduct";
import YourOrders from "./Pages/YourOrders";

function App() {
  const [user, setUser] = useState(() => {
    try { 
      return JSON.parse(localStorage.getItem('user'));
    } catch (e) {
      return null;
    }
  });

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/current`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            // Update user from session
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error('Session check failed:', err);
      }
    };
    checkSession();
  }, []);

  // Listen for storage changes (multi-tab sync)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        const newUser = e.newValue ? JSON.parse(e.newValue) : null;
        setUser(newUser);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  const handleLogin = (userData, token) => {
    // Store user data and JWT token
    localStorage.setItem('user', JSON.stringify(userData));
    if (token) {
      localStorage.setItem('token', token);
    }
    setUser(userData);
    navigate('/');
  };

  const handleLogout = async () => {
    try {
      // Call backend logout to destroy session
      await fetch(`${API_BASE_URL}/api/users/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    clearAllCarts(); // Optional: clear from state
    navigate('/login');
  };

  const clearAllCarts = () => {
    setCart([]);
  };

  // Fetch products from backend on mount
  useEffect(() => {
     fetch(`${API_BASE_URL}/api/products`)
       .then(res => res.json())
       .then(data => setProducts(data))
       .catch(err => console.error("Error fetching products:", err));
  }, []);

  const handleAddProduct = (newProduct) => {
     
     setProducts([...products, { ...newProduct, _id: newProduct._id || Date.now() }]); 
    
     navigate("/"); 
  };

  const [cart, setCart] = useState([]);
  const isInitialLoad = useRef(true);

  // Load cart from localStorage on mount (guest or user-specific)
  useEffect(() => {
    const cartKey = user && user.email ? `cart_${user.email}` : 'cart_guest';
    const savedCart = localStorage.getItem(cartKey);
    setCart(savedCart ? JSON.parse(savedCart) : []);
    isInitialLoad.current = true;
  }, [user]);

  // Persist cart when it changes
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    const cartKey = user && user.email ? `cart_${user.email}` : 'cart_guest';
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart, user]);

  const handleAddToCart = (product) => {
    setCart(prevCart => [...prevCart, product]);
    alert(`${product.name} added to cart!`);
  };

  const handlePlaceOrder = () => {
    setCart([]); // Clear cart after order
    const cartKey = user && user.email ? `cart_${user.email}` : 'cart_guest';
    localStorage.removeItem(cartKey);
  };

  const refreshProducts = () => {
    fetch(`${API_BASE_URL}/api/products`)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Error fetching products:", err));
  };

  return (
    <>
      <Navbar cartCount={cart.length} user={user} onLogout={handleLogout} />

      <Routes>
        <Route path="/" element={<Home products={products} onAddToCart={handleAddToCart} user={user} onProductUpdate={refreshProducts} />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/products" element={<Products />} />
        <Route path="/carts" element={<Carts cartItems={cart} />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/addproduct" element={<AddProduct onAddProduct={handleAddProduct} />} />
        <Route path="/proceed" element={<Proceed cartItems={cart} onPlaceOrder={handlePlaceOrder} user={user} />} />
        <Route path="/placeorder" element={<PlaceOrder />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/editproduct/:id" element={<EditProduct />} />
        <Route path="/yourorders" element={<YourOrders user={user} />} />
      </Routes>
    </>
  );
}

export default App;
