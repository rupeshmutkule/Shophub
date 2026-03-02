import Order from '../models/Order.js';

export const createOrder = async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      sessionId: req.sessionID, // Store session ID with order
    };

    console.log('\n=== CREATE ORDER DEBUG ===');
    console.log(`📦 Session ID: ${req.sessionID}`);
    console.log(`👤 User in session:`, req.session.user);
    console.log(`📧 Order email: ${orderData.email}`);
    console.log(`👨 Customer: ${orderData.customerName}`);
    console.log(`💰 Total: ${orderData.total}`);
    console.log(`🍪 Cookie header: ${req.headers.cookie}`);

    const newOrder = new Order(orderData);
    await newOrder.save();

    // Ensure session is saved
    req.session.lastOrderId = newOrder._id.toString();
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log(`✅ Order created successfully!`);
    console.log(`   - Order ID: ${newOrder._id}`);
    console.log(`   - Session ID: ${newOrder.sessionId}`);
    console.log(`   - Email: ${newOrder.email}`);
    console.log(`   - Session saved with lastOrderId: ${req.session.lastOrderId}`);
    console.log('==========================\n');

    res.json({
      message: 'Order placed successfully',
      orderId: newOrder._id,
      sessionId: req.sessionID
    });
  } catch (err) {
    console.error('❌ Order creation error:', err);
    res.status(500).json({ error: err.message });
  }
}

export const getOrders = async (req, res) => {
  try {
    const { email } = req.query;
    let query = {};
    
    console.log('=== GET ORDERS DEBUG ===');
    console.log(`🔍 Session ID: ${req.sessionID}`);
    console.log(`👤 User in session:`, req.session.user);
    console.log(`📧 Email query param:`, email);
    
    // Check if user is admin/host - show ALL orders (no filter)
    if (req.session.user && (req.session.user.userType === 'admin' || req.session.user.userType === 'host')) {
      // Admin/Host sees all orders - leave query empty
      console.log(`✅ Admin/Host user - showing ALL orders`);
      console.log(`   UserType: ${req.session.user.userType}`);
      // Don't add any filter - query stays as {}
    }
    // If email is provided in query, filter by email
    else if (email) {
      query.email = email;
      console.log(`✅ Using email from query: ${email}`);
    } 
    // If user is logged in (guest), show their orders by email
    else if (req.session.user && req.session.user.email) {
      query.email = req.session.user.email;
      console.log(`✅ Logged-in guest user, using email: ${req.session.user.email}`);
    }
    // If no email and not logged in, show orders from current session
    else {
      query.sessionId = req.sessionID;
      console.log(`✅ Guest user, using sessionId: ${req.sessionID}`);
    }
    
    console.log(`🔎 Query:`, query);
    const orders = await Order.find(query).sort({ createdAt: -1 });
    console.log(`📦 Found ${orders.length} orders`);
    
    if (orders.length > 0) {
      console.log(`📋 First order details:`);
      console.log(`   - ID: ${orders[0]._id}`);
      console.log(`   - Email: ${orders[0].email}`);
      console.log(`   - SessionId: ${orders[0].sessionId}`);
      console.log(`   - Customer: ${orders[0].customerName}`);
      console.log(`   - Status: ${orders[0].status}`);
    }
    console.log('========================\n');
    
    res.json(orders);
  } catch (err) {
    console.error('❌ Error fetching orders:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Check if user has access to this order
    const hasAccess = 
      order.sessionId === req.sessionID ||
      (req.session.user && order.email === req.session.user.email) ||
      (req.session.user && (req.session.user.userType === 'admin' || req.session.user.userType === 'host'));
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    console.log('=== CANCEL ORDER DEBUG ===');
    console.log(`Order ID: ${req.params.id}`);
    console.log(`Order found:`, order ? 'Yes' : 'No');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    console.log(`Order email: ${order.email}`);
    console.log(`Order sessionId: ${order.sessionId}`);
    console.log(`Request sessionId: ${req.sessionID}`);
    console.log(`Session user:`, req.session.user);
    
    // Check if user has access to cancel this order
    const hasAccess = 
      order.sessionId === req.sessionID ||
      (req.session.user && order.email === req.session.user.email) ||
      (req.session.user && (req.session.user.userType === 'admin' || req.session.user.userType === 'host'));
    
    console.log(`Has access: ${hasAccess}`);
    console.log('==========================\n');
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order cancelled successfully' });
  } catch (err) {
    console.error('❌ Cancel order error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Only admins and hosts can update order status
    if (!req.session.user || (req.session.user.userType !== 'admin' && req.session.user.userType !== 'host')) {
      return res.status(403).json({ error: 'Admin or Host access required' });
    }

    // Update order status (including rejected - don't delete)
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    console.log(`✅ Order ${req.params.id} status updated to: ${status}`);
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
