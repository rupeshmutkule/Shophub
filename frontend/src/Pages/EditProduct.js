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
    description: '',
    category: '',
    images: []
  });
  const [frontImageFile, setFrontImageFile] = useState(null);
  const [backImageFile, setBackImageFile] = useState(null);
  const [frontImagePreview, setFrontImagePreview] = useState(null);
  const [backImagePreview, setBackImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch product data on load
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products/${id}`)
      .then(res => res.json())
      .then(product => {
        if (product) {
          console.log('📦 Loaded product:', product);
          console.log('📸 Product images:', product.images);
          
          setFormData({
            name: product.name,
            price: product.price,
            rating: product.rating,
            photo: product.photo || '',
            description: product.description,
            category: product.category || '',
            images: product.images || []
          });
          
          // Set existing image previews
          if (product.images && product.images.length > 0) {
            const frontImg = typeof product.images[0] === 'string' 
              ? product.images[0] 
              : product.images[0]?.url;
            
            console.log('🖼️ Setting front image preview:', frontImg);
            setFrontImagePreview(frontImg);
            
            if (product.images.length > 1) {
              const backImg = typeof product.images[1] === 'string' 
                ? product.images[1] 
                : product.images[1]?.url;
              
              console.log('🖼️ Setting back image preview:', backImg);
              setBackImagePreview(backImg);
            }
          } else if (product.photo) {
            console.log('🖼️ Using photo field as fallback:', product.photo);
            setFrontImagePreview(product.photo);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("❌ Error fetching product:", err);
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFrontImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFrontImageFile(file);
      setFrontImagePreview(URL.createObjectURL(file));
    }
  };

  const handleBackImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBackImageFile(file);
      setBackImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImageToCloudinary = async (file) => {
    try {
      console.log('📤 Starting image upload...');
      console.log('   File name:', file.name);
      console.log('   File size:', file.size, 'bytes');
      console.log('   File type:', file.type);
      
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onloadend = () => {
          console.log('✅ File converted to base64');
          resolve(reader.result);
        };
        reader.onerror = (error) => {
          console.error('❌ FileReader error:', error);
          reject(error);
        };
        reader.readAsDataURL(file);
      });
      
      const base64Data = await base64Promise;
      console.log('   Base64 length:', base64Data.length);
      
      // Upload via backend endpoint
      console.log('📡 Sending to:', `${API_BASE_URL}/api/uploads/custom-design`);
      const response = await fetch(`${API_BASE_URL}/api/uploads/custom-design`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: base64Data })
      });
      
      console.log('📥 Upload response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Upload failed:', errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Upload successful:', data);
      
      if (!data.url) {
        throw new Error('No URL returned from upload');
      }
      
      return data.url;
    } catch (error) {
      console.error('❌ Upload error details:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let updatedImages = [...formData.images];

      // Upload front image if changed
      if (frontImageFile) {
        console.log('📤 Uploading front image...');
        try {
          const frontUrl = await uploadImageToCloudinary(frontImageFile);
          console.log('✅ Front image uploaded:', frontUrl);
          
          if (updatedImages.length > 0) {
            updatedImages[0] = { url: frontUrl, side: 'front', alt: 'Front view' };
          } else {
            updatedImages.push({ url: frontUrl, side: 'front', alt: 'Front view' });
          }
        } catch (error) {
          console.error('❌ Front image upload failed:', error);
          alert('Failed to upload front image: ' + error.message);
          setUploading(false);
          return;
        }
      }

      // Upload back image if changed
      if (backImageFile) {
        console.log('📤 Uploading back image...');
        try {
          const backUrl = await uploadImageToCloudinary(backImageFile);
          console.log('✅ Back image uploaded:', backUrl);
          
          if (updatedImages.length > 1) {
            updatedImages[1] = { url: backUrl, side: 'back', alt: 'Back view' };
          } else {
            updatedImages.push({ url: backUrl, side: 'back', alt: 'Back view' });
          }
        } catch (error) {
          console.error('❌ Back image upload failed:', error);
          alert('Failed to upload back image: ' + error.message);
          setUploading(false);
          return;
        }
      }

      // Ensure we have at least the existing images if no new uploads
      if (!frontImageFile && !backImageFile && updatedImages.length === 0) {
        console.log('⚠️ No images to update');
      }

      // Update photo field with front image URL
      const photoUrl = updatedImages.length > 0 
        ? (typeof updatedImages[0] === 'string' ? updatedImages[0] : updatedImages[0].url)
        : formData.photo;

      const updateData = {
        name: formData.name,
        price: parseFloat(formData.price),
        rating: parseFloat(formData.rating),
        description: formData.description,
        category: formData.category,
        photo: photoUrl,
        images: updatedImages
      };

      console.log('📦 Sending update data:', JSON.stringify(updateData, null, 2));
      console.log('🌐 API URL:', `${API_BASE_URL}/api/products/${id}`);

      const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include', // Include cookies for session
        body: JSON.stringify(updateData)
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      let responseData;
      try {
        responseData = await response.json();
        console.log('📥 Server response:', JSON.stringify(responseData, null, 2));
      } catch (parseError) {
        console.error('❌ Failed to parse response:', parseError);
        const responseText = await response.text();
        console.error('❌ Response text:', responseText);
        throw new Error('Server returned invalid JSON: ' + responseText);
      }

      if (response.ok) {
        console.log('✅ Update successful!');
        alert('✅ Product updated successfully! Changes are now live on the website.');
        
        // Clear any cached data
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }
        
        // Navigate back to products list to see changes
        navigate('/admin/products');
      } else {
        console.error('❌ Update failed:', responseData);
        alert(`❌ Failed to update: ${responseData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('❌ Error updating product:', err);
      console.error('   Error name:', err.name);
      console.error('   Error message:', err.message);
      console.error('   Error stack:', err.stack);
      
      let errorMessage = 'Error updating product: ' + err.message;
      
      if (err.message.includes('Failed to fetch')) {
        errorMessage = '❌ Network error: Cannot connect to server. Please ensure:\n' +
                      '1. Backend server is running on http://localhost:5000\n' +
                      '2. No firewall is blocking the connection\n' +
                      '3. CORS is properly configured';
      }
      
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Edit Product</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Images Section */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border-2 border-indigo-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Product Images</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Front Image */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Front Image
                  </label>
                  <div className="relative">
                    {frontImagePreview ? (
                      <div className="relative group">
                        <img 
                          src={frontImagePreview} 
                          alt="Front" 
                          className="w-full h-64 object-contain bg-white rounded-lg border-2 border-gray-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                          <label className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-indigo-600 hover:text-white transition">
                              Change Image
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFrontImageChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 transition bg-white">
                        <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-sm text-gray-500">Upload Front Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFrontImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Recommended: 800x800px</p>
                </div>

                {/* Back Image */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Back Image (Optional)
                  </label>
                  <div className="relative">
                    {backImagePreview ? (
                      <div className="relative group">
                        <img 
                          src={backImagePreview} 
                          alt="Back" 
                          className="w-full h-64 object-contain bg-white rounded-lg border-2 border-gray-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                          <label className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-indigo-600 hover:text-white transition">
                              Change Image
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleBackImageChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 transition bg-white">
                        <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-sm text-gray-500">Upload Back Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBackImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Recommended: 800x800px</p>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                <input 
                  name="price" 
                  type="number" 
                  step="0.01" 
                  value={formData.price} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <input 
                  name="rating" 
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="5" 
                  value={formData.rating} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  name="category" 
                  value={formData.category} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Select Category</option>
                  <option value="t-shirts">T-Shirts</option>
                  <option value="tumblers">Tumblers</option>
                  <option value="glassware">Glassware</option>
                  <option value="crockery">Crockery</option>
                  <option value="cups">Cups</option>
                  <option value="others">Others</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                required 
                rows="4" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>

            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => navigate('/admin/products')}
                className="flex-1 bg-gray-200 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={uploading}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Update Product'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditProduct;
