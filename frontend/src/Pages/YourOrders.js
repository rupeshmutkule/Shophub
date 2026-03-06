import React, { useState, useEffect } from 'react';
import API_BASE_URL from "../config/api";
import Toast from '../components/Toast';
import authFetch from '../utils/authFetch';

function YourOrders({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [imageModal, setImageModal] = useState(null);
  const [designModal, setDesignModal] = useState(null);
  const [designIndex, setDesignIndex] = useState(0);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  useEffect(() => {
    setLoading(true);
    
    // Build URL with email query param if user is logged in
    let url = `${API_BASE_URL}/api/orders`;
    if (user && user.email) {
      url += `?email=${encodeURIComponent(user.email)}`;
    }
    
    // Fetch orders - backend will use email or session to determine which orders to show
    fetch(url, {
      credentials: 'include' // Include session cookies
    })
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(err => {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error fetching orders:", err);
        }
        setLoading(false);
      });
  }, [user]);

  const handleCancel = (id) => {
    setCancelModal(id);
    setCancelReason('');
  };

  const submitCancellation = () => {
    if (!cancelModal) return;
    
    if (!cancelReason.trim()) {
      showToast("Please provide a reason for cancellation", "error");
      return;
    }

    console.log('Cancelling order:', cancelModal);
    console.log('Reason:', cancelReason);

    fetch(`${API_BASE_URL}/api/orders/${cancelModal}/cancel`, { 
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        cancellationReason: cancelReason 
      })
    })
      .then(res => {
        console.log('Response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Response data:', data);
        if (data.error) {
          showToast(data.error || "Failed to cancel order", "error");
          if (data.debug) {
            console.error('Debug info:', data.debug);
          }
        } else {
          // Update the order status in the local state
          setOrders(orders.map(o => o._id === cancelModal ? { ...o, status: 'cancelled', cancellationReason: cancelReason } : o));
          showToast("Order cancelled successfully", "success");
          setCancelModal(null);
          setCancelReason('');
        }
      })
      .catch(err => {
        console.error('Cancel error:', err);
        showToast("Error cancelling order. Please try again.", "error");
      });
  };

  const canReviewOrder = (order) => {
    return order.status === 'delivered';
  };

  const openReviewModal = (orderId, product) => {
    setReviewModal({ orderId, product });
    setReviewRating(5);
    setReviewComment('');
  };

  const submitReview = async () => {
    if (!reviewModal?.orderId || !reviewModal?.product?._id) {
      setToast({ message: 'Unable to submit review', type: 'error' });
      return;
    }
    if (reviewRating < 1 || reviewRating > 5) {
      setToast({ message: 'Rating must be between 1 and 5', type: 'error' });
      return;
    }

    try {
      const res = await authFetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: reviewModal.product._id,
          orderId: reviewModal.orderId,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: 'Review submitted and awaiting approval', type: 'success' });
        setReviewModal(null);
      } else {
        setToast({ message: data.error || 'Failed to submit review', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Failed to submit review', type: 'error' });
    }
  };

  if (loading) return <div className="text-center py-20">Loading orders...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10 px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Your Orders</h1>
        
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 sm:p-8 text-center text-gray-500">
            <p className="mb-4">You haven't placed any orders yet.</p>
            <a href="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              Start Shopping
            </a>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {orders.map(order => (
              <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-500 truncate">Order ID: <span className="font-mono">{order._id}</span></p>
                      <p className="text-xs sm:text-sm text-gray-500">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-700 mt-1">
                        Status: <span className={`px-2 py-1 rounded text-xs font-bold ${
                          order.status === 'cancelled' 
                            ? 'bg-red-100 text-red-700' 
                            : order.status === 'delivered' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {order.status ? order.status.toUpperCase().replace(/_/g, ' ') : 'PENDING'}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 sm:gap-3">
                      <p className="text-lg sm:text-xl font-bold text-green-600">₹{Number(order.total || 0).toFixed(2)}</p>
                      {(order.status === 'pending' || order.status === 'order_received' || order.status === 'payment_verified') && (
                        <button 
                          onClick={() => handleCancel(order._id)}
                          className="text-xs sm:text-sm text-white bg-red-600 hover:bg-red-700 font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:shadow-md transition whitespace-nowrap"
                        >
                          Cancel
                        </button>
                      )}
                      {order.status === 'cancelled' && (
                        <span className="text-xs sm:text-sm text-red-600 font-bold px-3 sm:px-4 py-1.5 sm:py-2 bg-red-50 rounded-lg border border-red-200 whitespace-nowrap">
                          ❌ Cancelled
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                   <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Shipping Details:</h4>
                   <p className="text-gray-600 mb-4 text-xs sm:text-sm break-words">{order.customerName} — {order.address}, {order.city}, {order.zip}</p>

                   {order.status === 'cancelled' && order.cancellationReason && (
                     <div className="mb-4 p-4 bg-red-50 rounded-lg border-2 border-red-200">
                       <div className="flex items-start gap-2">
                         <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                         <div className="flex-1">
                           <p className="font-bold text-red-800 text-sm mb-1">
                             {order.cancelledBy === 'admin' || order.cancelledBy === 'host' || order.cancelledBy === 'agent' 
                               ? '❌ Order Cancelled by Admin/Host' 
                               : '❌ Order Cancelled'}
                           </p>
                           <p className="text-red-700 text-sm italic">"{order.cancellationReason}"</p>
                           {order.cancelledAt && (
                             <p className="text-red-600 text-xs mt-1">
                               Cancelled on: {new Date(order.cancelledAt).toLocaleDateString()}
                             </p>
                           )}
                         </div>
                       </div>
                     </div>
                   )}

                   {order.items && order.items.length > 0 && (
                     <div>
                       <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Items:</h4>
                       <div className="space-y-3">
                         {order.items.map((item, idx) => (
                           <div key={idx} className="flex items-start sm:items-center gap-3 sm:gap-4 bg-gray-50 p-3 rounded-lg">
                             <div className="relative flex-shrink-0">
                               <img 
                                 src={item.customizationPreview || item.customDesignUrl || item.photo || item.image || 'https://via.placeholder.com/50?text=?'} 
                                 alt={item.name || item.title || 'Product image'}
                                 width="48"
                                 height="48"
                                 className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded bg-white border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                                 onClick={() => {
                                   console.log('🖼️ Item clicked:', {
                                     name: item.name,
                                     isCustomized: item.isCustomized,
                                     frontDesignUrl: item.frontDesignUrl,
                                     backDesignUrl: item.backDesignUrl,
                                     customizationPreview: item.customizationPreview,
                                     customDesignUrl: item.customDesignUrl
                                   });
                                   if (item.isCustomized && (item.frontDesignUrl || item.backDesignUrl)) {
                                     setDesignModal(item);
                                     setDesignIndex(0);
                                   } else {
                                     const imageUrl = item.customizationPreview || item.customDesignUrl || item.photo || item.image;
                                     if (imageUrl) {
                                       setImageModal(imageUrl);
                                     }
                                   }
                                 }}
                                 onError={(e) => { e.target.src = 'https://via.placeholder.com/50?text=?'; }}
                               />
                               {item.isCustomized && (
                                 <div className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[8px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full shadow-md">
                                   CUSTOM
                                 </div>
                               )}
                               {item.isCustomized && (item.frontDesignUrl || item.backDesignUrl) && (
                                 <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[8px] sm:text-[10px] font-bold px-1 py-0.5 rounded-full shadow-md">
                                   👀
                                 </div>
                               )}
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.name || item.title || 'Product'}</p>
                               {item.isCustomized && (
                                 <div className="mb-1">
                                   <span className="inline-block bg-purple-100 text-purple-700 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                                     ✨ Customized
                                   </span>
                                   {(item.frontDesignUrl || item.backDesignUrl || item.customizationPreview || item.customDesignUrl) && (
                                     <button
                                       onClick={() => {
                                         console.log('📋 View Design button clicked:', {
                                           name: item.name,
                                           hasFrontDesign: !!item.frontDesignUrl,
                                           hasBackDesign: !!item.backDesignUrl,
                                           frontDesignUrl: item.frontDesignUrl,
                                           backDesignUrl: item.backDesignUrl
                                         });
                                         if (item.frontDesignUrl || item.backDesignUrl) {
                                           setDesignModal(item);
                                           setDesignIndex(0);
                                         } else {
                                           setImageModal(item.customizationPreview || item.customDesignUrl);
                                         }
                                       }}
                                       className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-indigo-600 hover:text-indigo-800 underline font-semibold"
                                     >
                                       {item.frontDesignUrl || item.backDesignUrl ? 'View' : 'View'}
                                     </button>
                                   )}
                                 </div>
                               )}
                               <div className="flex items-center gap-2 flex-wrap">
                                 <p className="text-xs sm:text-sm text-gray-500">₹{Number(item.price || 0).toFixed(2)}</p>
                                 {item.size && (
                                   <span className="inline-block bg-purple-100 text-purple-700 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                                     Size: {item.size}
                                   </span>
                                 )}
                                 <span className="inline-block bg-indigo-100 text-indigo-700 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                                   Qty: {item.quantity || 1}
                                 </span>
                               </div>
                               {canReviewOrder(order) && (
                                 <button
                                   onClick={() => openReviewModal(order._id, item)}
                                   className="mt-1 sm:mt-2 inline-flex items-center px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                 >
                                   Write Review
                                 </button>
                               )}
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setCancelModal(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">Cancel Order</h2>
            <p className="text-sm text-gray-600 mb-4">
              Please tell us why you're cancelling this order. This helps us improve our service.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Cancellation Reason *
              </label>
              <textarea
                rows="4"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="e.g., Found a better price elsewhere, Changed my mind, Ordered by mistake..."
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelModal(null)}
                className="flex-1 px-4 py-2 text-sm font-bold rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              >
                Keep Order
              </button>
              <button
                onClick={submitCancellation}
                className="flex-1 px-4 py-2 text-sm font-bold rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition shadow-md hover:shadow-lg"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
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
              alt="Your Customization Design" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-4 text-center">
              <p className="text-white text-sm mb-2">Your custom design</p>
              <a 
                href={imageModal} 
                download="my-custom-design.png"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition"
              >
                Download Design
              </a>
            </div>
          </div>
        </div>
      )}

      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setReviewModal(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">Write a Review</h2>
            <p className="text-sm text-gray-600 mb-4">
              {reviewModal.product?.name}
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Rating (1–5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                step="1"
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Comment
              </label>
              <textarea
                rows="4"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Share your experience with this product"
              />
            </div>
            <button
              onClick={submitReview}
              className="w-full px-4 py-2 text-sm font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition shadow-md hover:shadow-lg"
            >
              Submit Review
            </button>
          </div>
        </div>
      )}

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
              {designIndex === 0 && designModal.frontDesignUrl ? '👕 FRONT DESIGN' : 
               designIndex === 1 && designModal.backDesignUrl ? '🔄 BACK DESIGN' : 
               designModal.frontDesignUrl ? '👕 FRONT DESIGN' : '🔄 BACK DESIGN'}
            </p>
            
            <div className="bg-gray-100 p-4 rounded-xl mb-4 flex items-center justify-center" style={{ minHeight: '500px' }}>
              <div className="relative" style={{ width: '400px', aspectRatio: '520/620' }}>
                {/* Design composite (already includes product image) */}
                <img 
                  src={(designIndex === 0 ? designModal.frontDesignUrl : designModal.backDesignUrl) || designModal.frontDesignUrl || designModal.backDesignUrl} 
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
                href={(designIndex === 0 ? designModal.frontDesignUrl : designModal.backDesignUrl) || designModal.frontDesignUrl || designModal.backDesignUrl} 
                download={designIndex === 0 && designModal.frontDesignUrl ? `${designModal.name}-front-design.png` : `${designModal.name}-back-design.png`}
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

export default YourOrders;
