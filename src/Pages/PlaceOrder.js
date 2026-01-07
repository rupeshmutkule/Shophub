import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function PlaceOrder() {
  const location = useLocation();
  const { orderItems, orderTotal, customerName } = location.state || { orderItems: [], orderTotal: 0 };
  const orderRef = Math.floor(Math.random() * 1000000);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900">Order Confirmed!</h2>
          <p className="text-lg text-gray-600">
            Thank you {customerName}, your order has been received.
          </p>
          <div className="inline-block bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 font-mono">
            Order ID: #{orderRef}
          </div>
        </div>

        {/* Receipt Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-700">Order Summary</h3>
            <span className="text-sm text-gray-500">{new Date().toLocaleDateString()}</span>
          </div>
          
          <div className="p-8">
            {orderItems.length > 0 ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <img 
                        src={item.photo || 'https://via.placeholder.com/60?text=Product'} 
                        alt={item.name} 
                        className="w-16 h-16 rounded-md object-cover bg-gray-100 border border-gray-100"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                      </div>
                      <span className="font-bold text-gray-900">${Number(item.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${orderTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between text-2xl font-bold text-gray-900 pt-4 border-t border-gray-100 mt-2">
                    <span>Total Paid</span>
                    <span>${orderTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500">No details available for this order.</p>
            )}
          </div>
          
          <div className="bg-gray-50 px-8 py-6 text-center text-sm text-gray-500">
            A confirmation email has been sent to your inbox.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/" 
            className="flex-1 max-w-xs bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition shadow-md text-center"
          >
            Continue Shopping
          </Link>
          <button 
            onClick={() => window.print()}
            className="flex-1 max-w-xs bg-white text-gray-700 font-bold py-3 px-8 rounded-xl hover:bg-gray-50 border border-gray-300 transition text-center"
          >
            Print Receipt
          </button>
        </div>

      </div>
    </div>
  );
}

export default PlaceOrder;