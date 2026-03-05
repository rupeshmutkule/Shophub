import { Link } from "react-router-dom";
import { useState } from "react";
import ConfirmModal from "../components/ConfirmModal";
import SuccessToast from "../components/SuccessToast";

function Carts({ cartItems = [], onRemoveFromCart, onBuyNow }) {
  const total = cartItems.reduce((sum, item) => sum + Number(item.price), 0);
  
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [designModal, setDesignModal] = useState(null);
  const [designIndex, setDesignIndex] = useState(0);

  const handleRemove = (index) => {
    setItemToRemove(index);
    setShowRemoveModal(true);
  };

  const confirmRemove = () => {
    onRemoveFromCart(itemToRemove);
    setShowSuccessToast(true);
  };

  const handleBuyNow = (item, index) => {
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
              {cartItems.map((item, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="relative flex-shrink-0">
                      <img 
                        src={item.customizationPreview || item.customDesignUrl || item.photo || 'https://via.placeholder.com/100?text=Product'} 
                        alt={item.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-lg bg-gray-100 cursor-pointer hover:opacity-80 transition"
                        onClick={() => {
                          if (item.isCustomized && (item.frontDesignUrl || item.backDesignUrl)) {
                            setDesignModal(item);
                            setDesignIndex(0);
                          }
                        }}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=Error'; }}
                      />
                      {item.isCustomized && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full shadow-lg">
                          CUSTOM
                        </div>
                      )}
                      {item.isCustomized && (item.frontDesignUrl || item.backDesignUrl) && (
                        <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full shadow-lg cursor-pointer hover:bg-indigo-700">
                          👀
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
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          ₹{Number(item.price).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleRemove(index)}
                      className="flex-shrink-0 p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove from cart"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 flex gap-2 sm:gap-3">
                    <button
                      onClick={() => handleBuyNow(item, index)}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-2 sm:py-3 px-3 sm:px-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm sm:text-base"
                    >
                      Buy This Item
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 sticky bottom-4 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <span className="text-sm sm:text-base text-gray-600">Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</span>
                <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">₹{total.toFixed(2)}</span>
              </div>
              <Link to="/proceed" className="block w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 sm:py-4 rounded-xl hover:shadow-lg transform hover:scale-[1.01] transition duration-200 text-sm sm:text-base">
                Proceed to Checkout (All Items)
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Remove Item Confirmation Modal */}
      <ConfirmModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={confirmRemove}
        title="Remove from Cart?"
        message="Are you sure you want to remove this item from your cart?"
        confirmText="Remove"
        cancelText="Keep Item"
        type="danger"
      />

      {/* Success Toast */}
      <SuccessToast
        message="Item removed from cart!"
        isOpen={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
        duration={2000}
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
                {/* Design composite (already includes product image) */}
                <img 
                  src={designIndex === 0 ? designModal.frontDesignUrl : designModal.backDesignUrl} 
                  alt={designIndex === 0 ? 'Front Design' : 'Back Design'} 
                  className="w-full h-full object-contain rounded-lg shadow-xl"
                />
              </div>
            </div>
            
            <div className="flex gap-3 justify-center mb-4">
              {/* Left Arrow */}
              <button
                onClick={() => {
                  if (designIndex === 0 && designModal.backDesignUrl) {
                    setDesignIndex(1);
                  } else if (designIndex === 1) {
                    setDesignIndex(0);
                  }
                }}
                disabled={designIndex === 0 && !designModal.backDesignUrl}
                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              {/* Download Button */}
              <a 
                href={designIndex === 0 ? designModal.frontDesignUrl : designModal.backDesignUrl} 
                download={designIndex === 0 ? `${designModal.name}-front-design.png` : `${designModal.name}-back-design.png`}
                className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download {designIndex === 0 ? 'Front' : 'Back'}
              </a>

              {/* Right Arrow */}
              <button
                onClick={() => {
                  if (designIndex === 0 && designModal.backDesignUrl) {
                    setDesignIndex(1);
                  } else if (designIndex === 1 && designModal.frontDesignUrl) {
                    setDesignIndex(0);
                  }
                }}
                disabled={designIndex === 1 && !designModal.frontDesignUrl}
                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Next
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
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
    </div>
  );
}

export default Carts