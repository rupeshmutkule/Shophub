import React from 'react'
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from "../config/api";

function Home({ products = [], onAddToCart, user, onProductUpdate }) {
  const navigate = useNavigate();
  const [showBuyModal, setShowBuyModal] = React.useState(false);
  const [showDetailsModal, setShowDetailsModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState(null);
  
  // Edit Form State
  const [editFormData, setEditFormData] = React.useState({
    name: '', price: '', rating: '', photo: '', description: ''
  });

  const handleBuyClick = (product, e) => {
    e.stopPropagation();
    if (!user) {
      alert("Please login to buy products.");
      navigate('/login');
      return;
    }
    setSelectedProduct(product);
    setShowBuyModal(true);
  };

  React.useEffect(() => {
    if (user) {
      setBuyFormData(prev => ({
        ...prev,
        fullName: `${user.firstName} ${user.lastName}`
      }));
    }
  }, [user]);

  const handleCartClick = (product, e) => {
    e.stopPropagation();
    if (!user) {
      alert("Please login to add items to cart.");
      navigate('/login');
      return;
    }
    onAddToCart(product);
  };

  const handleCardClick = (product) => {
    if (user && user.userType === 'host') {
       setSelectedProduct(product);
       setShowDetailsModal(true);
    } else {
       setSelectedProduct(product);
       setShowDetailsModal(true);
    }
  };

  const handleEditClick = (product, e) => {
    e.stopPropagation();
    setSelectedProduct(product);
    setEditFormData({
        name: product.name,
        price: product.price,
        rating: product.rating,
        photo: product.photo,
        description: product.description
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch(`${API_BASE_URL}/api/products/${selectedProduct._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editFormData)
        });

        if (response.ok) {
            alert("Product updated successfully!");
            setShowEditModal(false);
            if (onProductUpdate) onProductUpdate();
        } else {
            const data = await response.json();
            alert("Update failed: " + data.error);
        }
    } catch (err) {
        console.error(err);
        alert("Error connecting to server");
    }
  };

  const closeBuyModal = () => {
    setShowBuyModal(false);
    if (!showDetailsModal) setSelectedProduct(null);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedProduct(null);
  };

  const closeEditModal = () => {
      setShowEditModal(false);
      setSelectedProduct(null);
  };

  // Buy Form State
  const [buyFormData, setBuyFormData] = React.useState({
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
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
        email: user.email, // Use account email for isolation
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

        {/* Section Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Latest Products</h2>
          <div className="h-1 w-24 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"></div>
        </div>
        
        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-lg border border-gray-100">
            <div className="text-7xl mb-6 animate-bounce">🛍️</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No products yet</h3>
            <p className="text-gray-500 mb-8 text-lg">Start by adding some new products to your store.</p>
            <a href="/addproduct" className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-full hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 font-semibold">
              Add Your First Product
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
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
                    src={product.photo || 'https://via.placeholder.com/300?text=No+Image'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Error'; }}
                  />
                  
                  {/* Gradient Overlay on Image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Rating Badge */}
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 transform group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                    </svg>
                    <span>{product.rating}</span>
                  </div>

                  {/* Quick View Badge */}
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md text-gray-800 px-3 py-1 rounded-full text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    👁️ Quick View
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5 flex flex-col">
                  {/* Product Name */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors duration-300" title={product.name}>
                    {product.name}
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
                          ${Number(product.price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    {user && user.userType === 'host' ? (
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
                 src={selectedProduct.photo || 'https://via.placeholder.com/300?text=No+Image'} 
                 alt={selectedProduct.name}
                 className="w-full h-full object-contain p-8"
                 onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Error'; }}
               />
            </div>

            {/* Info Section */}
            <div className="w-full md:w-1/2 p-8 flex flex-col overflow-y-auto">
               <h2 className="text-3xl font-bold text-gray-900 mb-3">{selectedProduct.name}</h2>
               
               <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                 <span className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                   ${Number(selectedProduct.price).toFixed(2)}
                 </span>
                 <div className="flex items-center bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full font-bold text-sm shadow-md">
                   <svg className="w-4 h-4 fill-current mr-1" viewBox="0 0 20 20">
                     <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                   </svg>
                   {selectedProduct.rating}
                 </div>
               </div>

               <div className="prose text-gray-600 mb-8 flex-1">
                 <h4 className="font-bold text-gray-900 mb-3 text-lg">Description</h4>
                 <p className="leading-relaxed">{selectedProduct.description}</p>
               </div>

               {user && user.userType !== 'host' && (
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

      {/* Edit Product Modal (Admin Only) */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative animate-slideUp">
            
            {/* Close Button */}
            <button 
              onClick={closeEditModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-all z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl hover:rotate-90 duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Edit Product</h2>
              
              <form onSubmit={handleUpdateProduct} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
                  <input 
                    type="text" 
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditChange}
                    required 
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all duration-300" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($)</label>
                    <input 
                      type="number" 
                      name="price"
                      value={editFormData.price}
                      onChange={handleEditChange}
                      step="0.01"
                      required 
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all duration-300" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                    <input 
                      type="number" 
                      name="rating"
                      value={editFormData.rating}
                      onChange={handleEditChange}
                      step="0.1"
                      min="0"
                      max="5"
                      required 
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all duration-300" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Photo URL</label>
                  <input 
                    type="url" 
                    name="photo"
                    value={editFormData.photo}
                    onChange={handleEditChange}
                    required 
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all duration-300" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea 
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditChange}
                    required 
                    rows="4" 
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none transition-all duration-300"
                  ></textarea>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={closeEditModal}
                    className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    Update Product
                  </button>
                </div>
              </form>
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
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Buy {selectedProduct.name}</h3>
              <p className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold text-2xl mb-6">
                ${Number(selectedProduct.price).toFixed(2)}
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
    </div>
  );
}

export default Home
