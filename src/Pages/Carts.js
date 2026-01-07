import { Link } from "react-router-dom";

function Carts({ cartItems = [] }) {

  const total = cartItems.reduce((sum, item) => sum + Number(item.price), 0);

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
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
                  <img 
                    src={item.photo || 'https://via.placeholder.com/100?text=Product'} 
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-lg bg-gray-100"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=Error'; }}
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                    <p className="text-gray-500 text-sm line-clamp-1">{item.description}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-blue-600 font-bold">${Number(item.price).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 sticky bottom-4 border-t border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Subtotal ({cartItems.length} items)</span>
                <span className="text-3xl font-bold text-blue-600">${total.toFixed(2)}</span>
              </div>
              <Link to="/proceed" className="block w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-xl hover:shadow-lg transform hover:scale-[1.01] transition duration-200">
                Proceed to Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Carts