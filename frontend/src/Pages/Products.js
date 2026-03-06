import React from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';

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

const Products = () => {
  const navigate = useNavigate();
  const [fakeStoreProducts, setFakeStoreProducts] = React.useState([]);
  const [mongoProducts, setMongoProducts] = React.useState([]);
  const [loadingFake, setLoadingFake] = React.useState(true);
  const [loadingMongo, setLoadingMongo] = React.useState(true);
  const [selectedCategory, setSelectedCategory] = React.useState('all');

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
  }, []);

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
      // MongoDB products use their actual category
      if (p.isMongoProduct) {
        const category = (p.category || 'others').toLowerCase();
        if (grouped[category]) {
          grouped[category].push(p);
        } else {
          grouped.others.push(p);
        }
      } else {
        // FakeStore products use mapped categories
        const key = mapApiCategoryToStore(p.category);
        if (grouped[key]) grouped[key].push(p);
      }
    });
    return grouped;
  }, [allProducts]);

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
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Our <span className="text-indigo-600">Products</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Browse our complete collection of customizable products
          </p>
        </div>

        {/* Category Filter Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Shop by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div 
                  key={product.id || product._id} 
                  onClick={() => navigate(`/product/${product._id || product.id}`)}
                  className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer transform hover:-translate-y-2"
                >
                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500 z-10 pointer-events-none"></div>
                  
                  {/* Product Image Container */}
                  <div className="relative h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    <img
                      src={product.image || 'https://via.placeholder.com/300?text=No+Image'}
                      alt={product.title || 'Product image'}
                      loading="lazy"
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
                      <span>{product.rating?.rate ?? 0}</span>
                    </div>

                    {/* Quick View Badge */}
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md text-gray-800 px-3 py-1 rounded-full text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      👁️ Quick View
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-5 flex flex-col">
                    {/* Product Name */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors duration-300" title={product.title}>
                      {product.title}
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
                      
                      {/* View Details Button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${product._id || product.id}`);
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
          )}
        </section>

      </div>
    </div>
  );
};

export default Products;
