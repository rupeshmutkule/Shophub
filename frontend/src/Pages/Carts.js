import { Link } from "react-router-dom";
import { useState } from "react";
import ConfirmModal from "../components/ConfirmModal";
import SuccessToast from "../components/SuccessToast";

function Carts({ cartItems = [], onRemoveFromCart, onBuyNow }) {
  const total = cartItems.reduce((sum, item) => sum + Number(item.price), 0);
  
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Your Shopping Cart</h2>

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
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <img 
                        src={item.customizationPreview || item.customDesignUrl || item.photo || 'https://via.placeholder.com/100?text=Product'} 
                        alt={item.name}
                        className="w-24 h-24 object-contain rounded-lg bg-gray-100"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=Error'; }}
                      />
                      {item.isCustomized && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                          CUSTOM
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
                      {item.isCustomized && (
                        <span className="inline-block bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-full mb-2">
                          ✨ Custom Design
                        </span>
                      )}
                      <p className="text-gray-500 text-sm line-clamp-2 mb-2">{item.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          ₹{Number(item.price).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleRemove(index)}
                      className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove from cart"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                    <button
                      onClick={() => handleBuyNow(item, index)}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      Buy This Item
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 sticky bottom-4 border-t border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Subtotal ({cartItems.length} items)</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">₹{total.toFixed(2)}</span>
              </div>
              <Link to="/proceed" className="block w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-xl hover:shadow-lg transform hover:scale-[1.01] transition duration-200">
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
    </div>
  );
}

export default Carts