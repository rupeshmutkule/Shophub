import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "https://fakestoreapi.com/products?limit=50";

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
        const res = await fetch(API_URL);
        const data = await res.json();
        if (!cancelled) {
          const mapped = (data || []).filter(
            (p) => mapApiCategoryToStore(p.category) === (name || "").toLowerCase()
          );
          setItems(mapped);
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

  const handleProductClick = (id) => {
    navigate(`/product/${id}`);
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
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-8 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Min Price
            </label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Max Price
            </label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Min Rating
            </label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Sort By
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Rating: High to Low</option>
            </select>
          </div>
        </div>

        {/* Product grid */}
        {paged.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center text-gray-500">
            No products match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paged.map((p) => (
              <div
                key={p.id}
                className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
                onClick={() => handleProductClick(p.id)}
              >
                <div className="relative h-56 bg-gray-50 overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">
                    {p.title}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">{p.description}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-lg font-extrabold text-indigo-700">
                      ₹{Number(p.price).toFixed(2)}
                    </span>
                    <span className="text-xs font-semibold text-yellow-600 flex items-center gap-1">
                      ★ {p.rating?.rate ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-sm font-semibold text-gray-700">
              Page {page} of {pageCount}
            </span>
            <button
              disabled={page === pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoryPage;

