import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
    case "t-shirts":
      return "T-Shirts";
    case "tumblers":
      return "Tumblers";
    case "glassware":
      return "Glassware";
    case "crockery":
      return "Crockery";
    case "cups":
      return "Cups";
    case "others":
      return "Others";
    default:
      return name;
  }
};

function CategoryPage() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("price_asc");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch from FakeStore API
        const fakeRes = await fetch(FAKESTORE_URL);
        const fakeData = await fakeRes.json();
        const fakeFiltered = (fakeData || []).filter(
          (p) => mapApiCategoryToStore(p.category) === (name || "").toLowerCase()
        );

        // Fetch from MongoDB
        let mongoFiltered = [];
        try {
          const mongoRes = await fetch(`${API_BASE_URL}/api/products`);
          const mongoData = await mongoRes.json();
          const filtered = (mongoData || []).filter(
            (p) => (p.category || "").toLowerCase() === (name || "").toLowerCase()
          );
          
          // Transform MongoDB products to ensure images are accessible
          mongoFiltered = filtered.map(p => {
            // Get image from multiple possible sources
            const imageUrl = p.photo || 
                           (p.images && p.images.length > 0 ? p.images[0].url : null) ||
                           'https://via.placeholder.com/300?text=No+Image';
            
            return {
              ...p,
              id: p._id,
              title: p.name,
              image: imageUrl,
              photo: imageUrl,
              rating: { rate: p.rating || 0, count: 0 }
            };
          });
        } catch (e) {
          // MongoDB fetch failed, continue with FakeStore only
        }

        if (!cancelled) {
          setItems([...fakeFiltered, ...mongoFiltered]);
        }
      } catch (e) {
        if (!cancelled) setError("Failed to load products");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [name]);

  const filteredSorted = useMemo(() => {
    let list = [...items];
    const minP = minPrice ? Number(minPrice) : null;
    const maxP = maxPrice ? Number(maxPrice) : null;
    const minR = minRating ? Number(minRating) : null;

    list = list.filter((p) => {
      const priceOk =
        (minP === null || p.price >= minP) && (maxP === null || p.price <= maxP);
      const ratingValue = p.rating?.rate ?? 0;
      const ratingOk = minR === null || ratingValue >= minR;
      return priceOk && ratingOk;
    });

    list.sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      if (sort === "rating_desc") return (b.rating?.rate ?? 0) - (a.rating?.rate ?? 0);
      return 0;
    });

    return list;
  }, [items, sort, minPrice, maxPrice, minRating]);

  const [page, setPage] = useState(1);
  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const paged = filteredSorted.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [filteredSorted.length]);

  const handleProductClick = (product) => {
    const productId = product._id || product.id;
    navigate(`/product/${productId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Loading {storeCategoryLabel(name)}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            {storeCategoryLabel(name)}
          </h1>
          <p className="text-gray-600">
            Explore curated {storeCategoryLabel(name).toLowerCase()} from our catalog.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {/* Filters & Sorting */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Filters & Sorting</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Min Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Min Price (₹)
              </label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Max Price (₹)
              </label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="1000"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            {/* Min Rating */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Min Rating (0-5)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300 bg-white cursor-pointer"
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating_desc">Rating: High to Low</option>
              </select>
            </div>

          </div>

          {/* Clear Filters Button */}
          {(minPrice || maxPrice || minRating) && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setMinPrice('');
                  setMaxPrice('');
                  setMinRating('');
                }}
                className="px-4 py-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Product grid */}
        {paged.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Products Found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Showing {paged.length} of {filteredSorted.length} products
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {paged.map((p) => (
                <div
                  key={p.id || p._id}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer transform hover:-translate-y-2"
                  onClick={() => handleProductClick(p)}
                >
                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500 z-10 pointer-events-none"></div>
                  
                  {/* Product Image */}
                  <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 p-4"
                      loading="lazy"
                    />
                    
                    {/* Gradient Overlay on Image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Rating Badge */}
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 transform group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                      </svg>
                      <span>{p.rating?.rate ?? 0}</span>
                    </div>

                    {/* Quick View Badge */}
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md text-gray-800 px-3 py-1 rounded-full text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      👁️ Quick View
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-5 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors duration-300" title={p.title}>
                      {p.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem] leading-relaxed">
                      {p.description}
                    </p>
                    
                    <div className="mt-auto space-y-3">
                      {/* Price Section */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1">Price</p>
                          <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            ₹{Number(p.price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      {/* View Details Button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductClick(p.id);
                        }}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 text-sm font-bold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="mt-10 flex justify-center items-center gap-3">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-5 py-3 text-sm font-bold rounded-xl bg-white border-2 border-gray-200 text-gray-800 hover:border-indigo-500 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg"
            >
              ← Previous
            </button>
            <span className="px-6 py-3 text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg">
              Page {page} of {pageCount}
            </span>
            <button
              disabled={page === pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="px-5 py-3 text-sm font-bold rounded-xl bg-white border-2 border-gray-200 text-gray-800 hover:border-indigo-500 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoryPage;

