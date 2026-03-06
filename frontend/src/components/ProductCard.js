import { memo } from 'react';
import { useNavigate } from 'react-router-dom';

// Memoized product card to prevent unnecessary re-renders
const ProductCard = memo(({ product, showActions = true }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/product/${product._id || product.id}`);
  };

  // Extract image URL
  const getImageUrl = () => {
    if (product.photo) return product.photo;
    if (product.images && product.images.length > 0) {
      return typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url;
    }
    if (product.image) return product.image;
    return 'https://via.placeholder.com/400x400?text=No+Image';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
      <div className="relative h-64 bg-gray-100 overflow-hidden group">
        <img
          src={getImageUrl()}
          alt={product.title || product.name}
          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {product.title || product.name}
        </h3>
        <p className="text-sm text-gray-500 mb-2 capitalize">
          {product.category}
        </p>
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-extrabold text-indigo-700">
            ₹{Number(product.price).toFixed(2)}
          </span>
          {product.rating?.rate && (
            <span className="text-sm font-bold text-yellow-600">
              ★ {product.rating.rate}
            </span>
          )}
        </div>
        {showActions && (
          <button
            onClick={handleViewDetails}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
