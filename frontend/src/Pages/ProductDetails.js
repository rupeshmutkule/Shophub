import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import authFetch from "../utils/authFetch";

const FAKESTORE_URL = "https://fakestoreapi.com/products";

function ProductDetails({ onAddToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewMeta, setReviewMeta] = useState({ averageRating: 0, count: 0 });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
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

  const handleAddToCartClick = () => {
    if (!product || !onAddToCart) return;
    const normalized = {
      name: product.title,
      price: product.price,
      rating: product.rating?.rate ?? 0,
      photo: product.image,
      description: product.description,
      fakestoreId: product.id,
    };
    onAddToCart(normalized);
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
        <div className="md:w-1/2 bg-gray-50 flex items-center justify-center p-10">
          <img
            src={product.image}
            alt={product.title}
            className="w-full max-w-md h-auto object-contain"
            loading="lazy"
          />
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
            <button
              onClick={handleCustomize}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-bold shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              Customize
            </button>
            <button
              onClick={handleAddToCartClick}
              className="flex-1 bg-white border-2 border-gray-200 text-gray-900 py-3 px-4 rounded-xl font-bold shadow-sm hover:shadow-md hover:border-indigo-500 hover:text-indigo-600 transition-all"
            >
              Add to Cart
            </button>
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
    </div>
  );
}

export default ProductDetails;

