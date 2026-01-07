import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_BASE_URL from "../config/api";

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    rating: '',
    photo: '',
    description: ''
  });

  // Fetch product data on load
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products`)
      .then(res => res.json())
      .then(products => {
        const product = products.find(p => p._id === id);
        if (product) {
          setFormData({
            name: product.name,
            price: product.price,
            rating: product.rating,
            photo: product.photo,
            description: product.description
          });
        }
      })
      .catch(err => console.error("Error fetching product:", err));
  }, [id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Product updated successfully!');
        navigate('/admin/products');
      } else {
        const data = await response.json();
        alert(`Failed to update: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Edit Product</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
           {/* Reusing form structure from AddProduct roughly */}
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg" />
           </div>
           
           <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <input name="rating" type="number" step="0.1" value={formData.rating} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg" />
               </div>
           </div>

           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
              <input name="photo" value={formData.photo} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg" />
           </div>

           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} required rows="4" className="w-full px-4 py-2 border rounded-lg" />
           </div>

           <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">
             Update Product
           </button>
        </form>
      </div>
    </div>
  );
}

export default EditProduct;
