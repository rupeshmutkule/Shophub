import { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';

// Custom hook for fetching products
export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      const data = await res.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return { products, loading, error, refetch: fetchProducts };
};

// Custom hook for fetching single product
export const useProduct = (id) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        // Try MongoDB first
        const mongoRes = await fetch(`${API_BASE_URL}/api/products/${id}`);
        if (mongoRes.ok) {
          const data = await mongoRes.json();
          setProduct(data);
          setError(null);
          return;
        }

        // Fallback to FakeStore
        const fakeRes = await fetch(`https://fakestoreapi.com/products/${id}`);
        const data = await fakeRes.json();
        setProduct(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return { product, loading, error };
};
