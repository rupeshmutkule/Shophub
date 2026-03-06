import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import authFetch from "../utils/authFetch";
import API_BASE_URL from "../config/api";

const FAKESTORE_URL = "https://fakestoreapi.com/products";

function ProductDetails({ onAddToCart, user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewMeta, setReviewMeta] = useState({ averageRating: 0, count: 0 });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [modalAction, setModalAction] = useState('addToCart'); // 'addToCart' or 'buyNow'

  const isAdminOrHost = user && (user.userType === 'admin' || user.userType === 'host');

  // Get all available images for the product
  const getProductImages = () => {
    if (!product) return [];
    
    // If product has images array (MongoDB products with front/back)
    if (product.images && product.images.length > 0) {
      // Handle both formats: array of strings or array of objects with url property
      return product.images.map(img => typeof img === 'string' ? img : img.url);
    }
    
    // Fallback to single photo field or image field
    const singleImage = product.photo || product.image;
    return singleImage ? [singleImage] : [];
  };

  const productImages = getProductImages();
  const hasMultipleImages = productImages.length > 1;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        // First try to fetch from MongoDB
        try {
          const mongoRes = await fetch(`${API_BASE_URL}/api/products/${id}`);
          if (mongoRes.ok) {
            const p = await mongoRes.json();
            if (!cancelled) {
              setProduct(p);
              return;
            }
          }
        } catch (e) {
          // MongoDB fetch failed, try FakeStore
        }

        // Fallback to FakeStore API
        const res = await fetch(`${FAKESTORE_URL}/${id}`);
        const p = await res.json();
        if (!cancelled) setProduct(p);
      } catch {
        if (!cancelled) setProduct(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!product?._id) return;
    let cancelled = false;
    const loadReviews = async () => {
      try {
        const res = await authFetch(`/api/reviews/product/${product._id}`);
        const body = await res.json();
        if (!cancelled && res.ok) {
          setReviews(body.reviews || []);
          setReviewMeta({
            averageRating: body.averageRating ?? 0,
            count: body.count ?? 0,
          });
        }
      } catch {
        // ignore
      }
    };
    loadReviews();
    return () => {
      cancelled = true;
    };
  }, [product?._id]);

  const handleCustomize = () => {
    navigate(`/customize/${id}`, { state: { product } });
  };

  const handleEdit = () => {
    // For MongoDB products, navigate to edit page
    if (product._id) {
      navigate(`/editproduct/${product._id}`);
    } else {
      alert('This product cannot be edited as it is from an external source.');
    }
  };

  const handleAddToCartClick = () => {
    setModalAction('addToCart');
    setShowSizeModal(true);
  };

  const handleBuyNowClick = () => {
    setModalAction('buyNow');
    setShowSizeModal(true);
  };

  const confirmAddToCart = () => {
    if (!product || !onAddToCart) return;
    const isClothing = product.category === "men's clothing" || product.category === "women's clothing" || product.category === "t-shirts";
    const normalized = {
      name: product.title,
      price: product.price,
      rating: product.rating?.rate ?? 0,
      photo: product.image,
      description: product.description,
      fakestoreId: product.id,
      ...(isClothing && { size: selectedSize }), // Only add size for clothing
      quantity: selectedQuantity,
    };
    onAddToCart(normalized);
    setShowSizeModal(false);
    alert('✅ Added to cart!');
  };

  const confirmBuyNow = () => {
    if (!product) return;
    const isClothing = product.category === "men's clothing" || product.category === "women's clothing" || product.category === "t-shirts";
    const normalized = {
      name: product.title,
      price: product.price,
      rating: product.rating?.rate ?? 0,
      photo: product.image,
      description: product.description,
      fakestoreId: product.id,
      ...(isClothing && { size: selectedSize }), // Only add size for clothing
      quantity: selectedQuantity,
    };
    setShowSizeModal(false);
    navigate('/proceed', { state: { singleItem: normalized } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Image Slider Section */}
        <div className="md:w-1/2 bg-gray-50 flex flex-col items-center justify-center p-10 relative">
          {/* Main Image */}
          <div className="w-full max-w-md relative">
            <img
              src={productImages[currentImageIndex] || product.image}
              alt={product.title}
              className="w-full h-auto object-contain"
              loading="lazy"
            />
            
            {/* Image Counter Badge */}
            {hasMultipleImages && (
              <div className="absolute top-4 right-4 bg-black/70 text-white text-sm font-bold px-3 py-1 rounded-full">
                {currentImageIndex + 1} / {productImages.length}
              </div>
            )}

            {/* Navigation Arrows */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg transition-all hover:scale-110"
                  aria-label="Previous image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg transition-all hover:scale-110"
                  aria-label="Next image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Navigation */}
          {hasMultipleImages && (
            <div className="flex gap-3 mt-6">
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    currentImageIndex === idx
                      ? 'border-indigo-600 ring-2 ring-indigo-300'
                      : 'border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  <img
                    src={img}
                    alt={`View ${idx + 1}`}
                    className="w-full h-full object-contain bg-white"
                  />
                  {idx === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-xs font-bold py-0.5 text-center">
                      FRONT
                    </div>
                  )}
                  {idx === 1 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-purple-600 text-white text-xs font-bold py-0.5 text-center">
                      BACK
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="md:w-1/2 p-8 flex flex-col">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">{product.title}</h1>
          <p className="text-sm text-gray-500 mb-4 capitalize">{product.category}</p>
          <p className="text-gray-700 mb-6 leading-relaxed">{product.description}</p>

          <div className="flex items-center gap-6 mb-6">
            <div>
              <p className="text-xs text-gray-500 mb-1">Price</p>
              <p className="text-3xl font-extrabold text-indigo-700">
                ₹{Number(product.price).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Rating</p>
              <p className="text-lg font-bold text-yellow-600 flex items-center gap-1">
                ★ {product.rating?.rate ?? 0}
              </p>
            </div>
            {reviewMeta.count > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Reviews</p>
                <p className="text-sm font-semibold text-gray-800">
                  {reviewMeta.averageRating.toFixed(1)} / 5 • {reviewMeta.count} reviews
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {isAdminOrHost ? (
              // Admin/Host sees Edit button only
              <button
                onClick={handleEdit}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 rounded-xl font-bold shadow-md hover:shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Product
              </button>
            ) : (
              // Regular users and agents
              <>
                {/* All buttons with equal width in grid */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={handleCustomize}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-bold shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
                  >
                    ✨ Customize
                  </button>
                  <button
                    onClick={handleAddToCartClick}
                    className="bg-white border-2 border-gray-300 text-gray-900 py-3 px-4 rounded-xl font-bold shadow-sm hover:shadow-md hover:border-indigo-500 hover:text-indigo-600 transition-all"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={handleBuyNowClick}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-bold shadow-md hover:shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all"
                  >
                    Buy Now
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="mt-auto">
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">Customer Reviews</h2>
            {reviewMeta.count === 0 ? (
              <p className="text-sm text-gray-500">
                No reviews yet. Reviews will appear here once approved by admin.
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {reviews.map((r, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-800">
                        ★ {r.rating} / 5
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Size and Quantity Selection Modal */}
      {showSizeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowSizeModal(false)}>
          <div className="relative max-w-md w-full bg-white rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowSizeModal(false)}
              className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-2 shadow-lg hover:bg-red-700 transition z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {(product.category === "men's clothing" || product.category === "women's clothing" || product.category === "t-shirts") 
                ? 'Select Size & Quantity' 
                : 'Select Quantity'}
            </h3>
            
            {/* Size Selection - Only for clothing categories */}
            {(product.category === "men's clothing" || product.category === "women's clothing" || product.category === "t-shirts") && (
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">Select Size</label>
                <div className="flex gap-2 justify-center">
                  {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 rounded-lg font-bold text-sm transition-all duration-200 ${
                        selectedSize === size
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-110'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quantity Selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-3 text-center">Select Quantity</label>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                  disabled={selectedQuantity === 1}
                  className={`w-10 h-10 rounded-lg font-bold text-xl transition-colors ${
                    selectedQuantity === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  −
                </button>
                <span className="text-2xl font-bold text-gray-900 min-w-[60px] text-center">
                  {selectedQuantity}
                </span>
                <button
                  onClick={() => setSelectedQuantity(Math.min(99, selectedQuantity + 1))}
                  disabled={selectedQuantity === 99}
                  className={`w-10 h-10 rounded-lg font-bold text-xl transition-colors ${
                    selectedQuantity === 99
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Confirm Button */}
            <button
              onClick={modalAction === 'addToCart' ? confirmAddToCart : confirmBuyNow}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {modalAction === 'addToCart' ? 'Add to Cart' : 'Buy Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetails;

