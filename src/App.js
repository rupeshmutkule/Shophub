import { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import API_BASE_URL from "./config/api";

import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Products from "./Pages/Products";
import Carts from "./Pages/Carts";
import Contact from "./Pages/Contact";
import Terms from "./Pages/Terms";
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

  const handleLogin = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
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
     // NOTE: We now assume AddProduct page handles the API POST. 
     // We can just refresh state or optimize by appending.
     // For now, let's append loosely, but ideally we re-fetch or the AddProduct page redirects to Home which re-fetches if logic was moved there.
     // Let's just append:
     setProducts([...products, { ...newProduct, id: Date.now() }]); 
     // The better way is to refetch, but let's keep it snappy.
     navigate("/"); 
  };

  const [cart, setCart] = useState([]);
  const isInitialLoad = useRef(true);

  // Load user-specific cart when user changes
  useEffect(() => {
    if (user && user.email) {
      const savedCart = localStorage.getItem(`cart_${user.email}`);
      setCart(savedCart ? JSON.parse(savedCart) : []);
    } else {
      setCart([]);
    }
    // Set flag to allow saving after the load is configured
    isInitialLoad.current = true; 
  }, [user]);

  // Persist cart when it changes
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    if (user && user.email) {
      localStorage.setItem(`cart_${user.email}`, JSON.stringify(cart));
    }
  }, [cart, user]);

  const handleAddToCart = (product) => {
    if (!user) {
      alert("Please login to add items to cart.");
      navigate('/login');
      return;
    }
    setCart(prevCart => [...prevCart, product]);
    alert(`${product.name} added to cart!`);
  };

  const handlePlaceOrder = () => {
    setCart([]); // Clear cart after order
    if (user && user.email) {
      localStorage.removeItem(`cart_${user.email}`);
    }
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
