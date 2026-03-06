import React from 'react'
import { useNavigate } from 'react-router-dom';
import SuccessToast from '../components/SuccessToast';
import API_BASE_URL from "../config/api";

const FAKESTORE_URL = "https://fakestoreapi.com/products?limit=50";

const mapApiCategoryToStore = (apiCategory) => {
  if (apiCategory === "men's clothing" || apiCategory === "women's clothing") return "t-shirts";
  if (apiCategory === "electronics") return "tumblers";
  if (apiCategory === "jewelery") return "glassware";
  return "crockery";
};

const storeCategoryLabel = (name) => {
  switch (name) {
    case "t-shirts": return "T-Shirts";
    case "tumblers": return "Tumblers";
    case "glassware": return "Glassware";
    case "crockery": return "Crockery";
    case "cups": return "Cups";
    default: return name;
  }
};

function Home({ products = [], onAddToCart, user, onProductUpdate }) {
  const navigate = useNavigate();
  const [fakeStoreProducts, setFakeStoreProducts] = React.useState([]);
  const [mongoProducts, setMongoProducts] = React.useState([]);
  const [loadingFake, setLoadingFake] = React.useState(true);
  const [loadingMongo, setLoadingMongo] = React.useState(true);
  const [showBuyModal, setShowBuyModal] = React.useState(false);
  const [showDetailsModal, setShowDetailsModal] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState(null);
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [showUpdateToast, setShowUpdateToast] = React.useState(false);

  const handleBuyClick = (product, e) => {
    e.stopPropagation();
    // For FakeStore products, go to customize page
    if (product && product.id && !product._id) {
      navigate(`/customize/${product.id}`, { state: { product } });
      return;
    }
    setSelectedProduct(product);
    setShowBuyModal(true);
  };

  React.useEffect(() => {
    if (user) {
      setBuyFormData(prev => ({
        ...prev,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email
      }));
    }
  }, [user]);

  const handleCartClick = (product, e) => {
    e.stopPropagation();
    if (!onAddToCart) return;
    if (product && product.id && !product._id) {
      onAddToCart({
        name: product.title,
        price: product.price,
        rating: product.rating?.rate ?? 0,
        photo: product.image,
        description: product.description,
        fakestoreId: product.id,
      });
    } else {
      onAddToCart(product);
    }
  };

  const handleCardClick = (product) => {
    // Navigate to product details page for all products (both FakeStore and MongoDB)
    const productId = product._id || product.id;
    navigate(`/product/${productId}`);
  };

  const handleEditClick = (product, e) => {
    e.stopPropagation();
    // Navigate to edit page instead of showing modal
    navigate(`/admin/products/edit/${product._id || product.id}`);
  };

  const closeBuyModal = () => {
    setShowBuyModal(false);
    if (!showDetailsModal) setSelectedProduct(null);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedProduct(null);
  };

  // Buy Form State
  const [buyFormData, setBuyFormData] = React.useState({
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
    email: user ? user.email : '',
    address: '', city: '', zip: ''
  });

  const handleBuyChange = (e) => {
    setBuyFormData({ ...buyFormData, [e.target.name]: e.target.value });
  };

  const handleBuySubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const orderData = {
        customerName: buyFormData.fullName,
        email: buyFormData.email,
        address: buyFormData.address,
        city: buyFormData.city,
        zip: buyFormData.zip,
        items: [selectedProduct],
        total: selectedProduct.price
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Include session cookies
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            alert(`Order placed successfully for ${selectedProduct.name}!`);
            closeBuyModal();
            navigate('/placeorder', { 
                state: { 
                    orderItems: [selectedProduct], 
                    orderTotal: Number(selectedProduct.price),
                    customerName: buyFormData.fullName
                } 
            });
        } else {
            const data = await response.json();
            alert("Order failed: " + data.error);
        }
    } catch (err) {
        console.error(err);
        alert("Error connecting to server");
    }
  };

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingFake(true);
      try {
        const res = await fetch(FAKESTORE_URL);
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) {
          setFakeStoreProducts(data);
        }
      } catch {
        if (!cancelled) setFakeStoreProducts([]);
      } finally {
        if (!cancelled) setLoadingFake(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch MongoDB products
  React.useEffect(() => {
    let cancelled = false;
    const loadMongoProducts = async () => {
      setLoadingMongo(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) {
          // Transform MongoDB products to match FakeStore format
          const transformed = data.map(p => {
            // Get image from multiple possible sources
            const imageUrl = p.photo || 
                           (p.images && p.images.length > 0 ? p.images[0].url : null) ||
                           'https://via.placeholder.com/300?text=No+Image';
            
            return {
              id: p._id,
              _id: p._id,
              title: p.name,
              name: p.name,
              price: p.price,
              description: p.description,
              image: imageUrl,
              photo: imageUrl,
              images: p.images || [],
              rating: { rate: p.rating, count: 0 },
              category: p.category || 'others', // Use actual product category
              isCustomizable: p.isCustomizable !== false, // Default to true if not specified
              isMongoProduct: true
            };
          });
          setMongoProducts(transformed);
        }
      } catch (err) {
        console.error('Error loading MongoDB products:', err);
        if (!cancelled) setMongoProducts([]);
      } finally {
        if (!cancelled) setLoadingMongo(false);
      }
    };
    loadMongoProducts();
    return () => {
      cancelled = true;
    };
  }, [onProductUpdate]);

  // Combine all products
  const allProducts = React.useMemo(() => {
    return [...fakeStoreProducts, ...mongoProducts];
  }, [fakeStoreProducts, mongoProducts]);

  const byStoreCategory = React.useMemo(() => {
    const grouped = {
      "t-shirts": [],
      tumblers: [],
      glassware: [],
      crockery: [],
      cups: [],
      others: [],
    };
    allProducts.forEach((p) => {
      // MongoDB products use their category field
      if (p.isMongoProduct) {
        const category = p.category || 'others';
        if (grouped[category]) {
          grouped[category].push(p);
        } else {
          grouped.others.push(p);
        }
      } else {
        // FakeStore API products use mapped categories
        const key = mapApiCategoryToStore(p.category);
        if (grouped[key]) grouped[key].push(p);
      }
    });
    return grouped;
  }, [allProducts]);

  // Filtered products based on selected category
  const filteredProducts = React.useMemo(() => {
    if (selectedCategory === 'all') {
      return allProducts;
    }
    return byStoreCategory[selectedCategory] || [];
  }, [selectedCategory, allProducts, byStoreCategory]);

  const categories = [
    { id: 'all', name: 'All Products', icon: '🛍️' },
    { id: 't-shirts', name: 'T-Shirts', icon: '👕' },
    { id: 'tumblers', name: 'Tumblers', icon: '🥤' },
    { id: 'glassware', name: 'Glassware', icon: '🍷' },
    { id: 'crockery', name: 'Crockery', icon: '🍽️' },
    { id: 'cups', name: 'Cups', icon: '☕' },
    { id: 'others', name: 'Others', icon: '📦' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Banner Section */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 mb-10 text-white text-center shadow-2xl overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-white opacity-10 rounded-full -translate-x-20 -translate-y-20"></div>
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-white opacity-10 rounded-full translate-x-20 translate-y-20"></div>
          
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
              Welcome to <span className="text-yellow-300">ShopHub</span>
            </h1>
            <p className="text-lg md:text-xl text-purple-100 max-w-2xl mx-auto font-light">
              Discover amazing products at unbeatable prices. Shop the latest trends today!
            </p>
          </div>
        </div>

        {/* Category Filter Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Shop by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  if (category.id === 'all') {
                    setSelectedCategory('all');
                  } else {
                    navigate(`/category/${category.id}`);
                  }
                }}
                className={`
                  relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-xl
                  ${selectedCategory === category.id 
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg scale-105' 
                    : 'bg-white text-gray-800 shadow-md hover:shadow-lg'
                  }
                `}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">{category.icon}</div>
                  <p className="font-bold text-sm">{category.name}</p>
                  {selectedCategory === category.id && (
                    <div className="absolute top-2 right-2">
                      <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">
                {selectedCategory === 'all' ? 'All Products' : storeCategoryLabel(selectedCategory)}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
              </p>
            </div>
          </div>

          {loadingFake || loadingMongo ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl shadow animate-pulse p-4 h-80 flex flex-col"
                >
                  <div className="bg-gray-200 rounded-xl h-48 mb-3" />
                  <div className="bg-gray-200 h-4 mb-2 rounded" />
                  <div className="bg-gray-200 h-4 mb-2 rounded w-2/3" />
                  <div className="mt-auto flex gap-2">
                    <div className="bg-gray-200 h-10 rounded flex-1" />
                    <div className="bg-gray-200 h-10 rounded flex-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Products Found</h3>
              <p className="text-gray-500">Try selecting a different category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">{filteredProducts.map((product) => (
                    <div 
                      key={product.id} 
                      onClick={() => handleCardClick(product)}
                      className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer transform hover:-translate-y-2"
                    >
                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500 z-10 pointer-events-none"></div>
                
                {/* Product Image Container */}
                <div className="relative h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                  <img
                    src={product.image || product.photo || 'https://via.placeholder.com/300?text=No+Image'}
                    loading="lazy"
                    alt={product.title || product.name || 'Product image'}
                    width="300"
                    height="224"
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 p-4"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Error'; }}
                  />
                  
                  {/* Gradient Overlay on Image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Rating Badge */}
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 transform group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                    </svg>
                    <span>{typeof product.rating === 'object' ? (product.rating?.rate ?? 0) : (product.rating ?? 0)}</span>
                  </div>

                  {/* Quick View Badge */}
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md text-gray-800 px-3 py-1 rounded-full text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    👁️ Quick View
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5 flex flex-col">
                  {/* Product Name */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors duration-300" title={product.title || product.name}>
                    {product.title || product.name}
                  </h3>
                  
                  {/* Product Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem] leading-relaxed">
                    {product.description}
                  </p>
                  
                  <div className="mt-auto space-y-3">
                    {/* Price Section */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Price</p>
                        <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          ₹{Number(product.price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    {user && (user.userType === 'admin' || user.userType === 'host') ? (
                      <button 
                        onClick={(e) => handleEditClick(product, e)}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 text-sm font-bold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Product
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={(e) => handleCartClick(product, e)}
                          className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 py-3 px-3 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300 text-sm font-bold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Cart
                        </button>
                        <button 
                          onClick={(e) => handleBuyClick(product, e)}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 text-sm font-bold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          Buy Now
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
                  ))}
                </div>
              )}
        </section>
      </div>

      {/* Product Details Modal */}
      {showDetailsModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden relative animate-slideUp flex flex-col md:flex-row max-h-[90vh]">
            
            {/* Close Button */}
            <button 
              onClick={closeDetailsModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-all z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl hover:rotate-90 duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image Section */}
            <div className="w-full md:w-1/2 h-64 md:h-auto bg-gradient-to-br from-gray-50 to-gray-100 relative flex items-center justify-center">
               <img 
                 src={selectedProduct.image || selectedProduct.photo || 'https://via.placeholder.com/300?text=No+Image'} 
                 loading="lazy"
                 alt={selectedProduct.title || selectedProduct.name}
                 className="w-full h-full object-contain p-8"
                 onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Error'; }}
               />
            </div>

            {/* Info Section */}
            <div className="w-full md:w-1/2 p-8 flex flex-col overflow-y-auto">
               <h2 className="text-3xl font-bold text-gray-900 mb-3">{selectedProduct.title || selectedProduct.name}</h2>
               
               <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                 <span className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                   ₹{Number(selectedProduct.price).toFixed(2)}
                 </span>
                 <div className="flex items-center bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full font-bold text-sm shadow-md">
                   <svg className="w-4 h-4 fill-current mr-1" viewBox="0 0 20 20">
                     <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                   </svg>
                   {typeof selectedProduct.rating === 'object' ? (selectedProduct.rating?.rate ?? 0) : (selectedProduct.rating ?? 0)}
                 </div>
               </div>

               <div className="prose text-gray-600 mb-8 flex-1">
                 <h4 className="font-bold text-gray-900 mb-3 text-lg">Description</h4>
                 <p className="leading-relaxed">{selectedProduct.description}</p>
               </div>

               {(!user || (user.userType !== 'admin' && user.userType !== 'host')) && (
                 <div className="grid grid-cols-2 gap-4 mt-auto">
                   <button 
                      onClick={(e) => handleCartClick(selectedProduct, e)}
                      className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-900 font-bold py-4 px-6 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                   >
                     Add to Cart
                   </button>
                   <button 
                      onClick={(e) => handleBuyClick(selectedProduct, e)}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                   >
                     Buy Now
                   </button>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Buy Now Modal */}
      {showBuyModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-slideUp">
            {/* Close Button */}
            <button 
              onClick={closeBuyModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-all hover:rotate-90 duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Buy {selectedProduct.title || selectedProduct.name}</h3>
              <p className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold text-2xl mb-6">
                ₹{Number(selectedProduct.price).toFixed(2)}
              </p>
              
              <form onSubmit={handleBuySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    name="fullName"
                    value={buyFormData.fullName}
                    onChange={handleBuyChange}
                    required 
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    value={buyFormData.email}
                    onChange={handleBuyChange}
                    required 
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Shipping Address</label>
                  <textarea 
                    name="address"
                    value={buyFormData.address}
                    onChange={handleBuyChange}
                    required 
                    rows="3" 
                    placeholder="123 Main Street"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all duration-300"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                    <input 
                      type="text" 
                      name="city"
                      value={buyFormData.city}
                      onChange={handleBuyChange}
                      required 
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Zip Code</label>
                    <input 
                      type="text" 
                      name="zip"
                      value={buyFormData.zip}
                      onChange={handleBuyChange}
                      required 
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300" 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl mt-4 transform hover:-translate-y-1"
                >
                  Confirm Purchase
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>

      {/* Product Update Success Toast */}
      <SuccessToast
        message="Product updated successfully!"
        isOpen={showUpdateToast}
        onClose={() => setShowUpdateToast(false)}
        duration={2000}
      />
    </div>
  );
}

export default Home
