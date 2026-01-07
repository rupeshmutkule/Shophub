import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

function AdminProducts() {
  const [products, setProducts] = useState([]);

  const fetchProducts = () => {
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Error:", err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSeed = () => {
    fetch('http://localhost:5000/api/seed', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        alert(data.message);
        fetchProducts();
      })
      .catch(err => alert("Seed Failed: " + err.message));
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    fetch(`http://127.0.0.1:5000/api/products/${id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) {
            setProducts(products.filter(p => p._id !== id));
            // Ideally notify Home to refetch, but if Home refetches on mount it's fine.
        } else {
            alert("Delete failed");
        }
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <button 
            onClick={handleSeed}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Seed Database (Load 25 Products)
          </button>
        </div>

        <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 uppercase text-gray-600 text-sm font-semibold">
                        <tr>
                            <th className="p-4 border-b">Image</th>
                            <th className="p-4 border-b">Name</th>
                            <th className="p-4 border-b">Price</th>
                            <th className="p-4 border-b">Rating</th>
                            <th className="p-4 border-b text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {products.map(product => (
                            <tr key={product._id} className="hover:bg-gray-50 transition">
                                <td className="p-4 text-center">
                                    <img src={product.photo} alt={product.name} className="w-12 h-12 object-cover rounded-md mx-auto bg-gray-200" />
                                </td>
                                <td className="p-4 font-medium text-gray-900 line-clamp-2 max-w-xs" title={product.name}>{product.name}</td>
                                <td className="p-4 text-green-600 font-bold">${Number(product.price).toFixed(2)}</td>
                                <td className="p-4 text-yellow-500 font-bold">{product.rating} ★</td>
                                <td className="p-4 text-center space-x-2 flex justify-center">
                                    <NavLink 
                                        to={`/editproduct/${product._id}`}
                                        className="bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200 transition text-sm font-bold"
                                    >
                                        Edit
                                    </NavLink>
                                    <button 
                                        onClick={() => handleDelete(product._id)}
                                        className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 transition text-sm font-bold"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-gray-500">
                                    No products found. Click "Seed Database" to load sample data.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}

export default AdminProducts;