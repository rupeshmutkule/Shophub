import React, { useState, useEffect } from 'react';
import API_BASE_URL from "../config/api";
function YourOrders({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${API_BASE_URL}/api/orders?email=${user.email}`)
      .then(res => res.json())
      .then(data => {
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

    fetch(`${API_BASE_URL}/api/orders/${id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) {
           setOrders(orders.filter(o => o._id !== id));
           alert("Order cancelled successfully.");
        } else {
           alert("Failed to cancel order.");
        }
      })
      .catch(err => console.error(err));
  };

  if (loading) return <div className="text-center py-20">Loading orders...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Orders</h1>
        
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            You haven't placed any orders yet.
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
                    {order.status !== 'accepted' && (
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
