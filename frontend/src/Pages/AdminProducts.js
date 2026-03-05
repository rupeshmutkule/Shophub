import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import SuccessToast from '../components/SuccessToast';
import API_BASE_URL from "../config/api";
function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const fetchProducts = () => {
    fetch(`${API_BASE_URL}/api/products`)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Error:", err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSeed = () => {
    fetch(`${API_BASE_URL}/api/seed`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        alert(data.message);
        fetchProducts();
      })
      .catch(err => alert("Seed Failed: " + err.message));
  };

  const handleDelete = (id) => {
    setProductToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!productToDelete) return;

    fetch(`${API_BASE_URL}/api/products/${productToDelete}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) {
            setProducts(products.filter(p => p._id !== productToDelete));
            setShowSuccessToast(true);
        } else {
            alert("Delete failed");
        }
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <button 
            onClick={handleSeed}
            className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm sm:text-base"
          >
            Seed Database
          </button>
        </div>

        <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[640px]">
                    <thead className="bg-gray-100 uppercase text-gray-600 text-xs sm:text-sm font-semibold">
                        <tr>
                            <th className="p-3 sm:p-4 border-b">Image</th>
                            <th className="p-3 sm:p-4 border-b">Name</th>
                            <th className="p-3 sm:p-4 border-b">Price</th>
                            <th className="p-3 sm:p-4 border-b">Rating</th>
                            <th className="p-3 sm:p-4 border-b text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {products.map(product => (
                            <tr key={product._id} className="hover:bg-gray-50 transition">
                                <td className="p-3 sm:p-4 text-center">
                                    <img 
                                        src={
                                          product.photo || 
                                          (product.images && product.images.length > 0 ? product.images[0].url : null) ||
                                          'https://via.placeholder.com/48?text=No+Image'
                                        }
                                        alt={product.name || 'Product image'}
                                        width="48"
                                        height="48"
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-md mx-auto bg-gray-200"
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/48?text=Error'; }}
                                    />
                                </td>
                                <td className="p-3 sm:p-4 font-medium text-gray-900 text-xs sm:text-sm">
                                  <div className="line-clamp-2 max-w-[150px] sm:max-w-xs" title={product.name}>{product.name}</div>
                                </td>
                                <td className="p-3 sm:p-4 text-green-600 font-bold text-xs sm:text-sm whitespace-nowrap">₹{Number(product.price).toFixed(2)}</td>
                                <td className="p-3 sm:p-4 text-yellow-500 font-bold text-xs sm:text-sm">{product.rating} ★</td>
                                <td className="p-3 sm:p-4 text-center">
                                  <div className="flex flex-col sm:flex-row justify-center gap-2">
                                    <NavLink 
                                        to={`/editproduct/${product._id}`}
                                        className="bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200 transition text-xs sm:text-sm font-bold whitespace-nowrap"
                                    >
                                        Edit
                                    </NavLink>
                                    <button 
                                        onClick={() => handleDelete(product._id)}
                                        className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 transition text-xs sm:text-sm font-bold whitespace-nowrap"
                                    >
                                        Delete
                                    </button>
                                  </div>
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-gray-500 text-sm">
                                    No products found. Click "Seed Database" to load sample data.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Product?"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Success Toast */}
      <SuccessToast
        message="Product deleted successfully!"
        isOpen={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
        duration={2000}
      />
    </div>
  );
}

export default AdminProducts;