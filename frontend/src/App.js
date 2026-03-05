import { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import SuccessToast from "./components/SuccessToast";
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
import AdminDashboard from "./Pages/AdminDashboard";
import CategoryPage from "./Pages/CategoryPage";
import ProductDetails from "./Pages/ProductDetails";
import Customize from "./Pages/Customize";
import EditProduct from "./Pages/EditProduct";
import YourOrders from "./Pages/YourOrders";
import About from "./Pages/About";
import Mission from "./Pages/Mission";

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
        if (process.env.NODE_ENV === 'development') {
          console.error('Session check failed:', err);
        }
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
      if (process.env.NODE_ENV === 'development') {
        console.error('Logout error:', err);
      }
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
       .catch(err => {
         if (process.env.NODE_ENV === 'development') {
           console.error("Error fetching products:", err);
         }
       });
  }, []);

  const handleAddProduct = (newProduct) => {
     
     setProducts([...products, { ...newProduct, _id: newProduct._id || Date.now() }]); 
    
     navigate("/"); 
  };

  const [cart, setCart] = useState([]);
  const isInitialLoad = useRef(true);
  const [showAddToCartToast, setShowAddToCartToast] = useState(false);

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
    setShowAddToCartToast(true);
  };

  const handleRemoveFromCart = (index) => {
    setCart(prevCart => prevCart.filter((_, i) => i !== index));
  };

  const handleRemoveItemFromCart = (item) => {
    // Remove the first matching item from cart
    setCart(prevCart => {
      const index = prevCart.findIndex(cartItem => 
        cartItem.name === item.name && 
        cartItem.price === item.price &&
        cartItem.photo === item.photo
      );
      if (index !== -1) {
        return prevCart.filter((_, i) => i !== index);
      }
      return prevCart;
    });
  };

  const handleBuyNow = (item) => {
    // Navigate to checkout with single item
    navigate('/proceed', { state: { singleItem: item } });
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
      .catch(err => {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error fetching products:", err);
        }
      });
  };

  return (
    <>
      <Navbar cartCount={cart.length} user={user} onLogout={handleLogout} />
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<Home products={products} onAddToCart={handleAddToCart} user={user} onProductUpdate={refreshProducts} />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/products" element={<Products />} />
        <Route path="/carts" element={<Carts cartItems={cart} onRemoveFromCart={handleRemoveFromCart} onBuyNow={handleBuyNow} />} />
        <Route path="/cart" element={<Carts cartItems={cart} onRemoveFromCart={handleRemoveFromCart} onBuyNow={handleBuyNow} />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/about" element={<About />} />
        <Route path="/mission" element={<Mission />} />
        <Route path="/addproduct" element={<AddProduct onAddProduct={handleAddProduct} />} />
        <Route path="/proceed" element={<Proceed cartItems={cart} onPlaceOrder={handlePlaceOrder} onRemoveSingleItem={handleRemoveItemFromCart} user={user} />} />
        <Route path="/checkout" element={<Proceed cartItems={cart} onPlaceOrder={handlePlaceOrder} onRemoveSingleItem={handleRemoveItemFromCart} user={user} />} />
        <Route path="/placeorder" element={<PlaceOrder />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/category/:name" element={<CategoryPage />} />
        <Route path="/product/:id" element={<ProductDetails onAddToCart={handleAddToCart} user={user} />} />
        <Route path="/customize/:id" element={<Customize onAddToCart={handleAddToCart} />} />
        <Route path="/editproduct/:id" element={<EditProduct />} />
        <Route path="/yourorders" element={<YourOrders user={user} />} />
        <Route path="/account/orders" element={<YourOrders user={user} />} />
      </Routes>

      <Footer />

      {/* Add to Cart Success Toast */}
      <SuccessToast
        message="Added to cart!"
        isOpen={showAddToCartToast}
        onClose={() => setShowAddToCartToast(false)}
        duration={2000}
      />
    </>
  );
}

export default App;
