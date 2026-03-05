import React, { useState } from 'react';
import API_BASE_URL from "../config/api";

function AddProduct({ onAddProduct }) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    rating: '',
    photo: '',
    description: '',
    category: '',
    isCustomizable: true
  });
  const [frontImageFile, setFrontImageFile] = useState(null);
  const [backImageFile, setBackImageFile] = useState(null);
  const [frontImagePreview, setFrontImagePreview] = useState('');
  const [backImagePreview, setBackImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);

  const categories = [
    { value: 't-shirts', label: 'T-Shirts' },
    { value: 'tumblers', label: 'Tumblers' },
    { value: 'glassware', label: 'Glassware' },
    { value: 'crockery', label: 'Crockery' },
    { value: 'cups', label: 'Cups' },
    { value: 'others', label: 'Others' }
  ];

  const handleImageChange = (e, side) => {
    const file = e.target.files[0];
    if (file) {
      if (side === 'front') {
        setFrontImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setFrontImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setBackImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setBackImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const uploadImageToCloudinary = async (file) => {
    if (!file) return null;

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Image = await base64Promise;

      // Upload to Cloudinary via backend
      const response = await fetch(`${API_BASE_URL}/api/uploads/custom-design`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: base64Image }),
      });

      const data = await response.json();
      
      if (data?.url) {
        return data.url;
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!frontImageFile) {
      alert('Please upload at least a front image');
      return;
    }

    setUploading(true);

    try {
      // Upload front image
      const frontImageUrl = await uploadImageToCloudinary(frontImageFile);
      if (!frontImageUrl) {
        alert('Front image upload failed. Please try again.');
        setUploading(false);
        return;
      }

      // Upload back image if provided
      let backImageUrl = null;
      if (backImageFile) {
        backImageUrl = await uploadImageToCloudinary(backImageFile);
      }

      const payload = {
        ...formData,
        photo: frontImageUrl, // Legacy field for backward compatibility
        images: [
          { url: frontImageUrl, alt: 'Front view' },
          ...(backImageUrl ? [{ url: backImageUrl, alt: 'Back view' }] : [])
        ],
        price: Number(formData.price),
        rating: Number(formData.rating)
      };

      console.log('\n=== FRONTEND: CREATING PRODUCT ===');
      console.log('📦 Payload being sent:', JSON.stringify(payload, null, 2));
      console.log('📂 Category:', payload.category);
      console.log('==========================\n');

      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        onAddProduct(data);
        alert('Product added successfully!');
        // Reset form
        setFormData({
          name: '',
          price: '',
          rating: '',
          photo: '',
          description: '',
          category: '',
          isCustomizable: true
        });
        setFrontImageFile(null);
        setBackImageFile(null);
        setFrontImagePreview('');
        setBackImagePreview('');
      } else {
        console.error('Server Error:', data);
        alert(`Failed to save product: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      alert('Error connecting to backend server. Make sure the backend is running.');
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Add New Product
          </h2>
          <p className="text-gray-600">Enter product details below</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Product Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none"
                placeholder="e.g. Wireless Headphones"
              />
            </div>

            {/* Category Dropdown */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none bg-white"
              >
                <option value="">Select product category</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price and Rating Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="99.99"
                />
              </div>
              <div>
                <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                  Rating (0-5) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="rating"
                  name="rating"
                  value={formData.rating}
                  onChange={handleChange}
                  required
                  min="0"
                  max="5"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="4.5"
                />
              </div>
            </div>

            {/* Product Images Upload - Front and Back */}
            <div className="space-y-4">
              {/* Front Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Front Image <span className="text-red-500">*</span>
                </label>
                
                {frontImagePreview && (
                  <div className="mb-3 relative">
                    <img 
                      src={frontImagePreview} 
                      alt="Front Preview" 
                      className="w-full h-48 object-contain bg-gray-50 rounded-lg border-2 border-blue-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFrontImageFile(null);
                        setFrontImagePreview('');
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      FRONT
                    </div>
                  </div>
                )}

                {!frontImagePreview && (
                  <div className="relative">
                    <input
                      type="file"
                      id="frontImageFile"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'front')}
                      className="hidden"
                    />
                    <label
                      htmlFor="frontImageFile"
                      className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                    >
                      <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-blue-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-1 text-sm text-gray-600 font-medium">
                          Click to upload front image
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* Back Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Back Image <span className="text-gray-400">(Optional)</span>
                </label>
                
                {backImagePreview && (
                  <div className="mb-3 relative">
                    <img 
                      src={backImagePreview} 
                      alt="Back Preview" 
                      className="w-full h-48 object-contain bg-gray-50 rounded-lg border-2 border-purple-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setBackImageFile(null);
                        setBackImagePreview('');
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="absolute bottom-2 left-2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      BACK
                    </div>
                  </div>
                )}

                {!backImagePreview && (
                  <div className="relative">
                    <input
                      type="file"
                      id="backImageFile"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'back')}
                      className="hidden"
                    />
                    <label
                      htmlFor="backImageFile"
                      className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all duration-200"
                    >
                      <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-purple-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-1 text-sm text-gray-600 font-medium">
                          Click to upload back image
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Customizable Toggle */}
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
              <input
                type="checkbox"
                id="isCustomizable"
                name="isCustomizable"
                checked={formData.isCustomizable}
                onChange={(e) => setFormData({ ...formData, isCustomizable: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="isCustomizable" className="flex-1 cursor-pointer">
                <p className="text-sm font-semibold text-gray-800">Is this item customizable?</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {formData.isCustomizable 
                    ? '✓ Users can customize this product with text, images, and designs' 
                    : '✗ Users can only add to cart or buy directly'}
                </p>
              </label>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none resize-none"
                placeholder="Enter product description..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition duration-200 shadow-lg hover:shadow-xl mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading Image...
                </span>
              ) : (
                'Add Product'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddProduct;