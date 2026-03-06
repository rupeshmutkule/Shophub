import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import ConfirmModal from "../components/ConfirmModal";

function Carts({ cartItems = [], onRemoveFromCart, onAddOneToCart, onBuyNow }) {
  // Group cart items by product (name + price + photo + size)
  const groupedItems = useMemo(() => {
    const groups = {};
    cartItems.forEach((item, index) => {
      const key = `${item.name}-${item.price}-${item.photo || item.image}-${item.size || 'M'}`;
      if (!groups[key]) {
        groups[key] = {
          ...item,
          quantity: item.quantity || 1,
          size: item.size || 'M',
          indices: [index]
        };
      } else {
        groups[key].quantity += (item.quantity || 1);
        groups[key].indices.push(index);
      }
    });
    return Object.values(groups);
  }, [cartItems]);

  const total = cartItems.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);
  
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [designModal, setDesignModal] = useState(null);
  const [designIndex, setDesignIndex] = useState(0);
  const [imageModal, setImageModal] = useState(null); // For regular product images
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [tempSize, setTempSize] = useState('M');
  const [tempQuantity, setTempQuantity] = useState(1);

  const handleRemoveOne = (groupedItem) => {
    // Remove one instance of this item
    const indexToRemove = groupedItem.indices[0];
    onRemoveFromCart(indexToRemove);
    alert('✅ Quantity decreased!');
  };

  const handleRemoveAll = (groupedItem) => {
    setItemToRemove(groupedItem);
    setShowRemoveModal(true);
  };

  const confirmRemove = () => {
    // Remove all instances of this item (in reverse order to maintain indices)
    const indices = [...itemToRemove.indices].sort((a, b) => b - a);
    indices.forEach(index => onRemoveFromCart(index));
    alert('✅ Item removed from cart!');
    setShowRemoveModal(false);
  };

  const handleAddOne = (groupedItem) => {
    // Add one more of this item to cart
    const itemToAdd = { ...groupedItem };
    delete itemToAdd.indices;
    itemToAdd.quantity = 1; // Add just 1 more
    onAddOneToCart(itemToAdd);
    alert('✅ Quantity increased!');
  };

  const handleEditSizeQuantity = (groupedItem) => {
    setEditingItem(groupedItem);
    setTempSize(groupedItem.size || 'M');
    setTempQuantity(groupedItem.quantity || 1);
    setShowSizeModal(true);
  };

  const confirmSizeQuantityChange = () => {
    if (!editingItem) return;
    
    // Remove all old instances
    const indices = [...editingItem.indices].sort((a, b) => b - a);
    indices.forEach(index => onRemoveFromCart(index));
    
    // Add new item with updated size and quantity
    const updatedItem = { ...editingItem };
    delete updatedItem.indices;
    updatedItem.size = tempSize;
    updatedItem.quantity = tempQuantity;
    
    onAddOneToCart(updatedItem);
    
    setShowSizeModal(false);
    setEditingItem(null);
    alert('✅ Size and quantity updated!');
  };

  const handleBuyNow = (item) => {
    onBuyNow(item);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Your Shopping Cart</h2>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">Looks like you haven't added any products yet.</p>
            <a href="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition">
              Start Shopping
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {groupedItems.map((item, groupIndex) => (
                <div key={groupIndex} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="relative flex-shrink-0">
                      <img 
                        src={item.customizationPreview || item.customDesignUrl || item.photo || item.image || 'https://via.placeholder.com/100?text=Product'} 
                        alt={item.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-lg bg-gray-100 cursor-pointer hover:opacity-80 transition"
                        onClick={() => {
                          if (item.isCustomized && (item.frontDesignUrl || item.backDesignUrl)) {
                            setDesignModal(item);
                            setDesignIndex(0);
                          } else {
                            // Show regular product image
                            const imageUrl = item.photo || item.image || item.customizationPreview;
                            if (imageUrl && !imageUrl.includes('placeholder')) {
                              setImageModal(imageUrl);
                            }
                          }
                        }}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=Error'; }}
                      />
                      {item.isCustomized && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full shadow-lg">
                          CUSTOM
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate">{item.name}</h3>
                      {item.isCustomized && (
                        <span className="inline-block bg-purple-100 text-purple-700 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full mb-2">
                          ✨ Custom Design
                        </span>
                      )}
                      <p className="text-gray-500 text-xs sm:text-sm line-clamp-2 mb-2">{item.description}</p>
                      
                      {/* Size Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-lg">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          Size: {item.size || 'M'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSizeQuantity(item);
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline"
                        >
                          Change
                        </button>
                      </div>
                      
                      {/* Price and Quantity */}
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          ₹{Number(item.price).toFixed(2)}
                        </span>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-600">Qty:</span>
                          <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                            <button
                              onClick={() => handleRemoveOne(item)}
                              disabled={item.quantity === 1}
                              className={`px-2 sm:px-3 py-1 font-bold transition-colors text-sm sm:text-base ${
                                item.quantity === 1 
                                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              }`}
                              title={item.quantity === 1 ? "Can't go below 1 (use delete button to remove)" : "Remove one"}
                            >
                              −
                            </button>
                            <span className="px-3 sm:px-4 py-1 bg-white text-gray-900 font-bold min-w-[35px] sm:min-w-[40px] text-center text-sm sm:text-base">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleAddOne(item)}
                              disabled={item.quantity >= 99}
                              className={`px-2 sm:px-3 py-1 font-bold transition-colors text-sm sm:text-base ${
                                item.quantity >= 99
                                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              }`}
                              title={item.quantity >= 99 ? "Maximum quantity reached" : "Add one more"}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Subtotal for this item */}
                      <div className="mt-2 text-sm text-gray-600">
                        Subtotal: <span className="font-bold text-gray-900">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleRemoveAll(item)}
                      className="flex-shrink-0 p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove all from cart"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 flex gap-2 sm:gap-3">
                    <button
                      onClick={() => handleBuyNow(item)}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-2 sm:py-3 px-3 sm:px-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm sm:text-base"
                    >
                      Buy This Item
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Only show "Proceed to Checkout (All Items)" if there's more than one DIFFERENT product */}
            {groupedItems.length > 1 && (
              <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 sticky bottom-4 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                  <span className="text-sm sm:text-base text-gray-600">
                    Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                  </span>
                  <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    ₹{total.toFixed(2)}
                  </span>
                </div>
                <Link to="/proceed" className="block w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 sm:py-4 rounded-xl hover:shadow-lg transform hover:scale-[1.01] transition duration-200 text-sm sm:text-base">
                  Proceed to Checkout (All Items)
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Size and Quantity Edit Modal */}
      {showSizeModal && editingItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowSizeModal(false)}>
          <div className="relative max-w-md w-full bg-white rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowSizeModal(false)}
              className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-2 shadow-lg hover:bg-red-700 transition z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Edit Size & Quantity</h3>
            
            {/* Size Selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-3">Select Size</label>
              <div className="flex gap-2 justify-center">
                {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setTempSize(size)}
                    className={`w-12 h-12 rounded-lg font-bold text-sm transition-all duration-200 ${
                      tempSize === size
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-110'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Quantity Selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-3 text-center">Select Quantity</label>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setTempQuantity(Math.max(1, tempQuantity - 1))}
                  disabled={tempQuantity === 1}
                  className={`w-10 h-10 rounded-lg font-bold text-xl transition-colors ${
                    tempQuantity === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  −
                </button>
                <span className="text-2xl font-bold text-gray-900 min-w-[60px] text-center">
                  {tempQuantity}
                </span>
                <button
                  onClick={() => setTempQuantity(Math.min(99, tempQuantity + 1))}
                  disabled={tempQuantity === 99}
                  className={`w-10 h-10 rounded-lg font-bold text-xl transition-colors ${
                    tempQuantity === 99
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Confirm Button */}
            <button
              onClick={confirmSizeQuantityChange}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Update Cart
            </button>
          </div>
        </div>
      )}

      {/* Remove Item Confirmation Modal */}
      <ConfirmModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={confirmRemove}
        title="Remove from Cart?"
        message={`Are you sure you want to remove all ${itemToRemove?.quantity || 0} of this item from your cart?`}
        confirmText="Remove All"
        cancelText="Keep Item"
        type="danger"
      />

      {/* Design Modal */}
      {designModal && (designModal.frontDesignUrl || designModal.backDesignUrl) && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setDesignModal(null)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setDesignModal(null)}
              className="absolute -top-4 -right-4 bg-red-600 text-white rounded-full p-3 shadow-lg hover:bg-red-700 transition z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{designModal.name} - Your Designs</h3>
            <p className="text-sm text-gray-600 mb-4">
              {designIndex === 0 && designModal.frontDesignUrl ? '👕 FRONT DESIGN' : designIndex === 1 && designModal.backDesignUrl ? '🔄 BACK DESIGN' : 'Design'}
            </p>
            
            <div className="bg-gray-100 p-4 rounded-xl mb-4 flex items-center justify-center" style={{ minHeight: '500px' }}>
              <div className="relative" style={{ width: '400px', aspectRatio: '520/620' }}>
                <img 
                  src={designIndex === 0 ? designModal.frontDesignUrl : designModal.backDesignUrl} 
                  alt={designIndex === 0 ? 'Front Design' : 'Back Design'} 
                  className="w-full h-full object-contain rounded-lg shadow-xl"
                />
              </div>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDesignModal(null)}
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-bold hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regular Image Modal */}
      {imageModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setImageModal(null)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setImageModal(null)}
              className="absolute -top-4 -right-4 bg-white text-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-100 transition z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={imageModal} 
              alt="Product" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Carts;
