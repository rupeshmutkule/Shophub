import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API_BASE_URL from "../config/api";

function Proceed({ cartItems = [], onPlaceOrder, onRemoveSingleItem, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if single item purchase
  const singleItem = location.state?.singleItem;
  const itemsToPurchase = singleItem ? [singleItem] : cartItems;
  const total = itemsToPurchase.reduce((sum, item) => sum + Number(item.price), 0);
  
  const [formData, setFormData] = useState({
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
    email: user ? user.email : '',
    address: '',
    city: '',
    zip: '',
    phone: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // razorpay, cod, card

  // Update form if user switches without page reload
  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (itemsToPurchase.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    // Validate based on payment method
    if (paymentMethod === 'razorpay' && (!formData.phone || formData.phone.length < 10)) {
      alert("Please enter a valid phone number (minimum 10 digits) for Razorpay payment");
      return;
    }

    if (paymentMethod === 'card') {
      if (!formData.cardNumber || !formData.expiry || !formData.cvv) {
        alert("Please fill in all card details");
        return;
      }
    }

    setProcessing(true);

    try {
      // Handle different payment methods
      if (paymentMethod === 'razorpay') {
        await handleRazorpayPayment();
      } else if (paymentMethod === 'cod') {
        await handleCODOrder();
      } else if (paymentMethod === 'card') {
        await handleCardPayment();
      }
    } catch (err) {
      console.error('❌ Error:', err);
      alert(err.message || "Error processing order. Please try again.");
      setProcessing(false);
    }
  };

  // Razorpay Payment Handler
  const handleRazorpayPayment = async () => {
    try {
      // Step 1: Create Razorpay order
      console.log('💳 Creating Razorpay order...');
      const razorpayOrderResponse = await fetch(`${API_BASE_URL}/api/razorpay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`
        })
      });

      const razorpayOrderData = await razorpayOrderResponse.json();

      if (!razorpayOrderData.success) {
        throw new Error(razorpayOrderData.error || 'Failed to create Razorpay order');
      }

      console.log('✅ Razorpay order created:', razorpayOrderData.order.id);

      // Step 2: Open Razorpay checkout
      const options = {
        key: razorpayOrderData.key,
        amount: razorpayOrderData.order.amount,
        currency: razorpayOrderData.order.currency,
        name: 'ShopHub',
        description: `Order for ${itemsToPurchase.length} item(s)`,
        order_id: razorpayOrderData.order.id,
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: '#4F46E5'
        },
        handler: async function (response) {
          console.log('💰 Payment successful!', response);
          
          try {
            // Step 3: Verify payment
            console.log('🔐 Verifying payment...');
            const verifyResponse = await fetch(`${API_BASE_URL}/api/razorpay/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyResponse.json();

            if (!verifyData.success) {
              throw new Error('Payment verification failed');
            }

            console.log('✅ Payment verified successfully!');

            // Step 4: Create order in database
            await createOrder({
              payment: {
                provider: 'razorpay',
                status: 'paid',
                paidAt: new Date(),
                currency: 'INR',
                amount: total,
                providerOrderId: response.razorpay_order_id,
                providerPaymentId: response.razorpay_payment_id
              }
            });
          } catch (error) {
            console.error('❌ Error after payment:', error);
            alert('Payment successful but order creation failed. Please contact support with payment ID: ' + response.razorpay_payment_id);
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: function() {
            console.log('❌ Payment cancelled by user');
            setProcessing(false);
            alert('Payment cancelled. Your order was not placed.');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      throw error;
    }
  };

  // Cash on Delivery Handler
  const handleCODOrder = async () => {
    try {
      console.log('💵 Processing Cash on Delivery order...');
      
      await createOrder({
        payment: {
          provider: 'cod',
          status: 'pending',
          currency: 'INR',
          amount: total
        }
      });
    } catch (error) {
      throw error;
    }
  };

  // Card Payment Handler (Manual Entry)
  const handleCardPayment = async () => {
    try {
      console.log('💳 Processing card payment...');
      
      // In a real scenario, you would integrate with a payment processor here
      // For now, we'll create the order with pending payment status
      await createOrder({
        payment: {
          provider: 'card',
          status: 'pending',
          currency: 'INR',
          amount: total,
          cardLast4: formData.cardNumber.slice(-4)
        }
      });
    } catch (error) {
      throw error;
    }
  };

  // Common order creation function
  const createOrder = async (paymentData) => {
    const orderData = {
      customerName: formData.fullName,
      email: formData.email,
      phone: formData.phone || 'N/A',
      address: formData.address,
      city: formData.city,
      zip: formData.zip,
      items: itemsToPurchase,
      total: total,
      ...paymentData
    };

    const orderResponse = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(orderData)
    });

    const orderResponseData = await orderResponse.json();

    if (orderResponse.ok) {
      // Clear cart
      if (singleItem && onRemoveSingleItem) {
        onRemoveSingleItem(singleItem);
      } else if (onPlaceOrder) {
        onPlaceOrder();
      }

      // Navigate to success page
      navigate('/placeorder', {
        state: {
          orderItems: itemsToPurchase,
          orderTotal: total,
          customerName: formData.fullName,
          paymentMethod: paymentData.payment.provider,
          orderId: orderResponseData.orderId
        }
      });
    } else {
      throw new Error(orderResponseData.error || 'Failed to create order');
    }
    
    setProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Checkout</h2>
          {singleItem && (
            <p className="text-sm text-indigo-600 font-semibold mt-2">
              🛒 Purchasing Single Item
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column: Shipping & Payment */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                Shipping Information
              </h3>
              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input 
                      name="fullName" 
                      value={formData.fullName}
                      required 
                      onChange={handleChange} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                      placeholder="John Doe" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number {paymentMethod === 'razorpay' && <span className="text-red-500">*</span>}</label>
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required={paymentMethod === 'razorpay'}
                    minLength="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="+91 9876543210"
                  />
                  {paymentMethod === 'razorpay' && (
                    <p className="text-xs text-gray-500 mt-1">Required for Razorpay payment</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input name="address" required onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="123 Main St" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input name="city" required onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="New York" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                    <input name="zip" required onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="10001" />
                  </div>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                Payment Method
              </h3>
              
              <div className="space-y-4">
                {/* Payment Option 1: Razorpay */}
                <div 
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`cursor-pointer p-4 border-2 rounded-xl transition-all ${
                    paymentMethod === 'razorpay' 
                      ? 'border-indigo-600 bg-indigo-50' 
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="razorpay"
                      checked={paymentMethod === 'razorpay'}
                      onChange={() => setPaymentMethod('razorpay')}
                      className="w-5 h-5 text-indigo-600"
                    />
                    <div className="flex-shrink-0">
                      <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">Razorpay Online Payment</h4>
                      <p className="text-xs text-gray-600">Card, UPI, Net Banking, Wallets</p>
                    </div>
                    <img 
                      src="https://razorpay.com/assets/razorpay-glyph.svg" 
                      alt="Razorpay" 
                      className="h-6"
                    />
                  </div>
                </div>

                {/* Payment Option 2: Cash on Delivery */}
                <div 
                  onClick={() => setPaymentMethod('cod')}
                  className={`cursor-pointer p-4 border-2 rounded-xl transition-all ${
                    paymentMethod === 'cod' 
                      ? 'border-green-600 bg-green-50' 
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="w-5 h-5 text-green-600"
                    />
                    <div className="flex-shrink-0">
                      <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">Cash on Delivery</h4>
                      <p className="text-xs text-gray-600">Pay when you receive</p>
                    </div>
                    <span className="text-green-600 font-bold text-sm">COD</span>
                  </div>
                </div>

                {/* Payment Option 3: Card Details */}
                <div 
                  onClick={() => setPaymentMethod('card')}
                  className={`cursor-pointer p-4 border-2 rounded-xl transition-all ${
                    paymentMethod === 'card' 
                      ? 'border-purple-600 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="w-5 h-5 text-purple-600"
                    />
                    <div className="flex-shrink-0">
                      <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">Credit/Debit Card</h4>
                      <p className="text-xs text-gray-600">Enter card details manually</p>
                    </div>
                  </div>
                </div>

                {/* Card Details Form - Show only when card is selected */}
                {paymentMethod === 'card' && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-200 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                      <input 
                        name="cardNumber" 
                        value={formData.cardNumber}
                        required={paymentMethod === 'card'}
                        form="checkout-form" 
                        onChange={handleChange} 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" 
                        placeholder="0000 0000 0000 0000" 
                        maxLength="19"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                        <input 
                          name="expiry" 
                          value={formData.expiry}
                          required={paymentMethod === 'card'}
                          form="checkout-form" 
                          onChange={handleChange} 
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" 
                          placeholder="MM/YY" 
                          maxLength="5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                        <input 
                          name="cvv" 
                          value={formData.cvv}
                          required={paymentMethod === 'card'}
                          form="checkout-form" 
                          onChange={handleChange} 
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" 
                          placeholder="123" 
                          maxLength="4"
                          type="password"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Method Info */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {paymentMethod === 'razorpay' && (
                    <>
                      <p className="text-xs text-gray-600 mb-1">✓ 100% Secure Payments</p>
                      <p className="text-xs text-gray-600 mb-1">✓ Multiple Payment Options</p>
                      <p className="text-xs text-gray-600">✓ Instant Payment Confirmation</p>
                    </>
                  )}
                  {paymentMethod === 'cod' && (
                    <>
                      <p className="text-xs text-gray-600 mb-1">✓ Pay when you receive</p>
                      <p className="text-xs text-gray-600 mb-1">✓ No advance payment required</p>
                      <p className="text-xs text-gray-600">✓ Cash or Card at doorstep</p>
                    </>
                  )}
                  {paymentMethod === 'card' && (
                    <>
                      <p className="text-xs text-gray-600 mb-1">✓ Secure card processing</p>
                      <p className="text-xs text-gray-600 mb-1">✓ All major cards accepted</p>
                      <p className="text-xs text-gray-600">✓ Payment processed securely</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>
              
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {itemsToPurchase.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Your cart is empty.</p>
                ) : (
                  itemsToPurchase.map((item, index) => (
                    <div key={index} className="flex gap-4 items-center">
                      <div className="relative">
                        <img 
                          src={item.customizationPreview || item.customDesignUrl || item.photo || 'https://via.placeholder.com/60?text=Prod'} 
                          alt={item.name} 
                          className="w-16 h-16 rounded-md object-contain bg-gray-100"
                        />
                        {item.isCustomized && (
                          <div className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
                            CUSTOM
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</h4>
                        {item.isCustomized && (
                          <span className="inline-block bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            ✨ Customized
                          </span>
                        )}
                        <p className="text-xs text-gray-500">Qty: 1</p>
                      </div>
                      <span className="font-bold text-gray-900">₹{Number(item.price).toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-100 mt-2">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <button 
                type="submit" 
                form="checkout-form"
                disabled={itemsToPurchase.length === 0 || processing}
                className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-xl hover:shadow-lg transform hover:scale-[1.01] transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Confirm Order
                  </>
                )}
              </button>
              
              <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Your order will be confirmed instantly
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Proceed;