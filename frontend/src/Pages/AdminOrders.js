import React, { useState, useEffect } from 'react';
import Toast from '../components/Toast';
import authFetch from '../utils/authFetch';

const STATUS_OPTIONS = [
  'order_received',
  'payment_verified',
  'design_converted',
  'pre_flight_approval',
  'in_production',
  'printed',
  'quality_check',
  'shipped',
  'delivered',
  'cancelled',
  'rejected',
  'refunded'
];

const normalizeStatus = (s) => {
  if (!s) return 'order_received';
  // Legacy statuses (older UI/backend)
  if (s === 'pending') return 'order_received';
  if (s === 'accepted') return 'payment_verified';
  return s;
};

const statusLabel = (s) => normalizeStatus(s).replaceAll('_', ' ').toUpperCase();

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [toast, setToast] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [imageModal, setImageModal] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
    authFetch(`/api/orders`)
      .then(res => res.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error fetching orders:", err);
        }
        setLoading(false);
      });
  };

  const handlePermanentDelete = (id) => {
    if (!window.confirm("PERMANENTLY DELETE this order from the database? This cannot be undone.")) return;

    authFetch(`/api/orders/${id}`, {
      method: 'DELETE',
    })
      .then(res => {
        if (res.ok) {
          setOrders(orders.filter(o => o._id !== id));
          showToast("Order permanently deleted", "success");
        } else {
          return res.json().then(data => {
            showToast(data.error || "Failed to delete order", "error");
          });
        }
      })
      .catch(err => {
        showToast("Error deleting order", "error");
      });
  };

  const handleCancelOrder = (id) => {
    setCancelModal(id);
    setCancelReason('');
  };

  const submitCancellation = () => {
    if (!cancelModal) return;
    
    if (!cancelReason.trim()) {
      showToast("Please provide a reason for cancellation", "error");
      return;
    }

    authFetch(`/api/orders/${cancelModal}/admin-cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        cancellationReason: cancelReason,
        cancelledBy: 'admin'
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          showToast(data.error || "Failed to cancel order", "error");
        } else {
          showToast("Order cancelled successfully", "success");
          setCancelModal(null);
          setCancelReason('');
          fetchOrders(); // Refresh orders
        }
      })
      .catch(err => {
        console.error('Cancel error:', err);
        showToast("Error cancelling order", "error");
      });
  };

  const handleUpdateStatus = (id, status) => {
    authFetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          showToast(`Order status updated to ${statusLabel(status)}`, "success");
          fetchOrders();
        } else {
          showToast(data.error || "Failed to update status", "error");
        }
      })
      .catch(() => showToast("Error updating status", "error"));
  };

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(order => normalizeStatus(order.status) === filterStatus);

  const stats = {
    total: orders.length,
    order_received: orders.filter(o => normalizeStatus(o.status) === 'order_received').length,
    in_production: orders.filter(o => normalizeStatus(o.status) === 'in_production').length,
    shipped: orders.filter(o => normalizeStatus(o.status) === 'shipped').length,
    delivered: orders.filter(o => normalizeStatus(o.status) === 'delivered').length,
    totalRevenue: orders
      .filter(o => (o.payment?.status === 'paid' || o.payment?.status === 'partially_refunded'))
      .reduce((sum, o) => sum + Number(o.payment?.amount ?? o.total ?? 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900">Order Management</h1>
              <p className="text-gray-600 text-lg">Manage and track all customer orders</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-indigo-600 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Orders</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Order Received</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats.order_received}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-600 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">In Production</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats.in_production}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h2M7 7h10M7 11h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-indigo-100 uppercase tracking-wide">Revenue</p>
                <p className="text-3xl font-extrabold text-white mt-2">₹{stats.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-8 inline-flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
              filterStatus === 'all'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setFilterStatus('order_received')}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
              filterStatus === 'order_received'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Order Received ({stats.order_received})
          </button>
          <button
            onClick={() => setFilterStatus('in_production')}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
              filterStatus === 'in_production'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            In Production ({stats.in_production})
          </button>
          <button
            onClick={() => setFilterStatus('shipped')}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
              filterStatus === 'shipped'
                ? 'bg-gradient-to-r from-violet-600 to-purple-700 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Shipped ({stats.shipped})
          </button>
          <button
            onClick={() => setFilterStatus('cancelled')}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
              filterStatus === 'cancelled'
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Cancelled ({orders.filter(o => normalizeStatus(o.status) === 'cancelled').length})
          </button>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-16 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500 text-lg">
              {filterStatus === 'all' 
                ? "No orders have been placed yet." 
                : `No ${filterStatus} orders at the moment.`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div 
                key={order._id} 
                className={`bg-white rounded-3xl shadow-xl overflow-hidden border-2 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${
                  order.status === 'cancelled' ? 'border-red-300 opacity-75' : 'border-gray-100'
                }`}
              >
                {/* Order Header */}
                <div className={`px-8 py-6 ${
                  order.status === 'cancelled' 
                    ? 'bg-gradient-to-r from-red-600 to-red-700' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600'
                }`}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <div className="text-white">
                        <p className="text-sm font-semibold text-indigo-100">Order ID</p>
                        <p className="text-lg font-mono font-bold">{order._id}</p>
                        <p className="text-sm text-indigo-100 mt-1">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col md:items-end gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-indigo-100">Total Amount</p>
                        <p className="text-4xl font-extrabold text-white">${Number(order.total || 0).toFixed(2)}</p>
                      </div>
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-lg bg-white/20 text-white">
                        {order.status === 'cancelled' && '❌ '}
                        {statusLabel(order.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  {/* Customer Details */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <h4 className="text-xl font-bold text-gray-900">Customer Information</h4>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border-2 border-indigo-100">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">Name</p>
                          <p className="text-lg font-bold text-gray-900">{order.customerName}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">Email</p>
                          <p className="text-lg font-bold text-gray-900">{order.email}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm font-semibold text-gray-600 mb-1">Shipping Address</p>
                          <p className="text-lg font-bold text-gray-900">
                            {order.address}, {order.city}, {order.zip}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cancellation Reason (if cancelled) */}
                  {order.status === 'cancelled' && order.cancellationReason && (
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h4 className="text-xl font-bold text-gray-900">Cancellation Reason</h4>
                      </div>
                      <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-2xl border-2 border-red-200">
                        <p className="text-gray-800 font-medium italic">"{order.cancellationReason}"</p>
                        {order.cancelledAt && (
                          <p className="text-sm text-gray-600 mt-2">
                            Cancelled on: {new Date(order.cancelledAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  {order.items && order.items.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <h4 className="text-xl font-bold text-gray-900">Ordered Products</h4>
                      </div>
                      <div className="space-y-4">
                        {order.items.map((item, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center gap-6 bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-2xl border-2 border-gray-200 hover:shadow-lg transition-all duration-300"
                          >
                            <div className="relative">
                              <img 
                                src={item.customizationPreview || item.customDesignUrl || item.photo || item.image || 'https://via.placeholder.com/100?text=Product'} 
                                alt={item.name || item.title || 'Product image'}
                                width="96"
                                height="96"
                                className="w-24 h-24 object-contain rounded-xl shadow-md bg-white cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => {
                                  const imageUrl = item.customizationPreview || item.customDesignUrl || item.photo || item.image;
                                  console.log('🖼️ Image clicked:', {
                                    isCustomized: item.isCustomized,
                                    hasCustomizationPreview: !!item.customizationPreview,
                                    hasCustomDesignUrl: !!item.customDesignUrl,
                                    imageUrl: imageUrl
                                  });
                                  if (imageUrl) {
                                    setImageModal(imageUrl);
                                  }
                                }}
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=?'; }}
                              />
                              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
                                {idx + 1}
                              </div>
                              {item.isCustomized && (
                                <div className="absolute -bottom-2 -left-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                  CUSTOM
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h5 className="text-lg font-bold text-gray-900">{item.name || item.title || 'Product'}</h5>
                                {item.isCustomized && (
                                  <span className="inline-flex items-center bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full border border-purple-200">
                                    ✨ Customized Product
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {item.description || 'No description available'}
                              </p>
                              {item.isCustomized && (item.customizationPreview || item.customDesignUrl) && (
                                <div className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                  <p className="text-xs font-bold text-purple-700 mb-1">🎨 Customer Design Preview:</p>
                                  <button
                                    onClick={() => setImageModal(item.customizationPreview || item.customDesignUrl)}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 underline font-semibold"
                                  >
                                    Click to View Full Design →
                                  </button>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                  ${Number(item.price || 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status update */}
                  <div className="pt-6 border-t-2 border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="w-full sm:w-auto">
                      <p className="text-sm font-bold text-gray-700 mb-2">Update workflow status</p>
                      <select
                        value={normalizeStatus(order.status)}
                        onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                        className="w-full sm:w-[320px] px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {statusLabel(s)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:w-auto text-sm font-bold text-gray-600">
                      Payment:{" "}
                      <span className="text-indigo-700">
                        {(order.payment?.status || "n/a").toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex gap-3">
                      {order.status !== 'cancelled' && (
                        <button 
                          onClick={() => handleCancelOrder(order._id)}
                          className="text-orange-600 hover:text-orange-800 font-bold text-sm flex items-center gap-1 transition-colors px-4 py-2 bg-orange-50 rounded-lg hover:bg-orange-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel Order
                        </button>
                      )}
                    </div>
                    <button 
                      onClick={() => handlePermanentDelete(order._id)}
                      className="text-red-500 hover:text-red-700 font-bold text-sm flex items-center gap-1 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Permanently
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
              alt="Customization Preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-4 text-center">
              <a 
                href={imageModal} 
                download="customization-design.png"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition"
              >
                Download for Printing
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setCancelModal(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">Cancel Order (Admin)</h2>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for cancelling this order. The customer will see this reason.
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
                placeholder="e.g., Out of stock, Unable to fulfill customization, Quality issues..."
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
                className="flex-1 px-4 py-2 text-sm font-bold rounded-xl bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 transition shadow-md hover:shadow-lg"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
