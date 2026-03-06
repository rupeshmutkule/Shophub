import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import LoadingSpinner from "./components/LoadingSpinner";
import API_BASE_URL from "./config/api";
import { 
  loadCartFromStorage, 
  saveCartToStorage, 
  clearCartFromStorage, 
  getUniqueProductsCount 
} from "./utils/cartUtils";

// Eager load critical pages
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";

// Lazy load non-critical pages for better performance
const Carts = lazy(() => import("./Pages/Carts"));
const Contact = lazy(() => import("./Pages/Contact"));
const Terms = lazy(() => import("./Pages/Terms"));
const Products = lazy(() => import("./Pages/Products"));
const AddProduct = lazy(() => import("./Pages/AddProduct"));
const PlaceOrder = lazy(() => import("./Pages/PlaceOrder"));
const Proceed = lazy(() => import("./Pages/Proceed"));
const AdminProducts = lazy(() => import("./Pages/AdminProducts"));
const AdminOrders = lazy(() => import("./Pages/AdminOrders"));
const AdminDashboard = lazy(() => import("./Pages/AdminDashboard"));
const CategoryPage = lazy(() => import("./Pages/CategoryPage"));
const ProductDetails = lazy(() => import("./Pages/ProductDetails"));
const Customize = lazy(() => import("./Pages/Customize"));
const EditProduct = lazy(() => import("./Pages/EditProduct"));
const YourOrders = lazy(() => import("./Pages/YourOrders"));
const About = lazy(() => import("./Pages/About"));
const Mission = lazy(() => import("./Pages/Mission"));

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

  // Load cart from localStorage on mount (guest or user-specific)
  useEffect(() => {
    setCart(loadCartFromStorage(user));
    isInitialLoad.current = true;
  }, [user]);

  // Persist cart when it changes
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    saveCartToStorage(cart, user);
  }, [cart, user]);

  const handleAddToCart = (product) => {
    setCart(prevCart => [...prevCart, product]);
    // Show green alert instead of toast
    alert('✅ Added to cart!');
  };
  
  const handleAddOneToCart = (product) => {
    // Add one more of the same product to cart (used in Carts page)
    setCart(prevCart => [...prevCart, product]);
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
    setCart([]);
    clearCartFromStorage(user);
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
      <Navbar cartCount={getUniqueProductsCount(cart)} user={user} onLogout={handleLogout} />
      <ScrollToTop />

      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Home products={products} onAddToCart={handleAddToCart} user={user} onProductUpdate={refreshProducts} />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/products" element={<Products />} />
          <Route path="/carts" element={<Carts cartItems={cart} onRemoveFromCart={handleRemoveFromCart} onAddOneToCart={handleAddOneToCart} onBuyNow={handleBuyNow} />} />
          <Route path="/cart" element={<Carts cartItems={cart} onRemoveFromCart={handleRemoveFromCart} onAddOneToCart={handleAddOneToCart} onBuyNow={handleBuyNow} />} />
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
          <Route path="/admin/products/edit/:id" element={<EditProduct />} />
          <Route path="/yourorders" element={<YourOrders user={user} />} />
          <Route path="/account/orders" element={<YourOrders user={user} />} />
        </Routes>
      </Suspense>

      <Footer />
    </>
  );
}

export default App;
