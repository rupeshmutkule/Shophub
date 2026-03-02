import React, { useState, useEffect } from 'react';
import API_BASE_URL from "../config/api";
import Toast from '../components/Toast';

function YourOrders({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  useEffect(() => {
    console.log('=== YOUR ORDERS DEBUG ===');
    console.log('User prop:', user);
    
    setLoading(true);
    
    // Build URL with email query param if user is logged in
    let url = `${API_BASE_URL}/api/orders`;
    if (user && user.email) {
      url += `?email=${encodeURIComponent(user.email)}`;
      console.log('Logged-in user, fetching by email:', user.email);
    } else {
      console.log('Guest user, fetching by session');
    }
    
    console.log('Fetching orders from:', url);
    
    // Fetch orders - backend will use email or session to determine which orders to show
    fetch(url, {
      credentials: 'include' // Include session cookies
    })
      .then(res => {
        console.log('Response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Orders received:', data);
        console.log('Number of orders:', data.length);
        if (data.length > 0) {
          console.log('First order:', data[0]);
        }
        console.log('========================\n');
        setOrders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching orders:", err);
        setLoading(false);
      });
  }, [user]);

  const handleCancel = (id) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    fetch(`${API_BASE_URL}/api/orders/${id}`, { 
      method: 'DELETE',
      credentials: 'include' // Include session cookies
    })
      .then(res => {
        if (res.ok) {
           setOrders(orders.filter(o => o._id !== id));
           showToast("Order cancelled successfully", "success");
        } else {
           return res.json().then(data => {
             showToast(data.error || "Failed to cancel order", "error");
           });
        }
      })
      .catch(err => {
        console.error(err);
        showToast("Error cancelling order", "error");
      });
  };

  if (loading) return <div className="text-center py-20">Loading orders...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Orders</h1>
        
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            <p className="mb-4">You haven't placed any orders yet.</p>
            <a href="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              Start Shopping
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Order ID: <span className="font-mono">{order._id}</span></p>
                    <p className="text-sm text-gray-500">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm font-medium text-gray-700 mt-1">
                      Status: <span className={`px-2 py-1 rounded text-xs font-bold ${
                        order.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {order.status ? order.status.toUpperCase() : 'PENDING'}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-bold text-green-600">${Number(order.total || 0).toFixed(2)}</p>
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => handleCancel(order._id)}
                        className="text-sm text-red-600 hover:text-red-800 font-medium border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-6">
                   <h4 className="font-medium text-gray-900 mb-2">Shipping Details:</h4>
                   <p className="text-gray-600 mb-4">{order.customerName} — {order.address}, {order.city}, {order.zip}</p>

                   {order.items && order.items.length > 0 && (
                     <div>
                       <h4 className="font-medium text-gray-900 mb-3">Items:</h4>
                       <div className="space-y-3">
                         {order.items.map((item, idx) => (
                           <div key={idx} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                             <img 
                               src={item.photo || 'https://via.placeholder.com/50?text=?'} 
                               alt={item.name} 
                               className="w-12 h-12 object-cover rounded bg-gray-200"
                               onError={(e) => { e.target.src = 'https://via.placeholder.com/50?text=?'; }}
                             />
                             <div className="flex-1">
                               <p className="font-medium text-gray-900">{item.name}</p>
                               <p className="text-sm text-gray-500">${Number(item.price).toFixed(2)}</p>
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
    </div>
  );
}

export default YourOrders;
