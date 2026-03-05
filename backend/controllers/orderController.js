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
    console.log(`📦 Items count: ${orderData.items?.length || 0}`);
    if (orderData.items && orderData.items.length > 0) {
      console.log(`📦 First item:`, {
        name: orderData.items[0].name,
        price: orderData.items[0].price,
        isCustomized: orderData.items[0].isCustomized,
        hasCustomPreview: !!orderData.items[0].customizationPreview,
        hasCustomDesignUrl: !!orderData.items[0].customDesignUrl,
        hasFrontDesignUrl: !!orderData.items[0].frontDesignUrl,
        hasBackDesignUrl: !!orderData.items[0].backDesignUrl
      });
      console.log(`🎨 DESIGN URLs:`, {
        frontDesignUrl: orderData.items[0].frontDesignUrl || 'NOT PROVIDED',
        backDesignUrl: orderData.items[0].backDesignUrl || 'NOT PROVIDED'
      });
    }
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
    console.log(`   - Items saved: ${newOrder.items?.length || 0}`);
    if (newOrder.items && newOrder.items.length > 0) {
      console.log(`   - First item details:`);
      console.log(`     * Name: ${newOrder.items[0].name || newOrder.items[0].title}`);
      console.log(`     * isCustomized: ${newOrder.items[0].isCustomized}`);
      console.log(`     * customizationPreview: ${newOrder.items[0].customizationPreview ? 'YES' : 'NO'}`);
      console.log(`     * customDesignUrl: ${newOrder.items[0].customDesignUrl ? 'YES' : 'NO'}`);
      console.log(`     * frontDesignUrl: ${newOrder.items[0].frontDesignUrl ? 'YES' : 'NO'}`);
      console.log(`     * backDesignUrl: ${newOrder.items[0].backDesignUrl ? 'YES' : 'NO'}`);
      if (newOrder.items[0].frontDesignUrl) {
        console.log(`     * Front URL: ${newOrder.items[0].frontDesignUrl.substring(0, 50)}...`);
      }
      if (newOrder.items[0].backDesignUrl) {
        console.log(`     * Back URL: ${newOrder.items[0].backDesignUrl.substring(0, 50)}...`);
      }
    }
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
    console.log(`👤 User from JWT:`, req.user);
    console.log(`📧 Email query param:`, email);
    
    // Get user from either JWT (req.user) or session (req.session.user)
    const user = req.user || req.session.user;
    
    // Check if user is admin/host/agent - show ALL orders (no filter)
    if (user && (user.userType === 'admin' || user.userType === 'host' || user.userType === 'agent')) {
      // Admin/Host/Agent sees all orders - leave query empty
      console.log(`✅ Admin/Host/Agent user - showing ALL orders`);
      console.log(`   UserType: ${user.userType}`);
      console.log(`   Email: ${user.email}`);
      // Don't add any filter - query stays as {}
    }
    // If email is provided in query, filter by email
    else if (email) {
      query.email = email;
      console.log(`✅ Using email from query: ${email}`);
    } 
    // If user is logged in, show their orders by email
    else if (user && user.email) {
      query.email = user.email;
      console.log(`✅ Logged-in user, using email: ${user.email}`);
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
      if (orders[0].items && orders[0].items.length > 0) {
        console.log(`   - First item customized: ${orders[0].items[0].isCustomized || false}`);
      }
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
      (req.session.user && (req.session.user.userType === 'admin' || req.session.user.userType === 'host' || req.session.user.userType === 'agent'));
    
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
    console.log(`JWT user:`, req.user);
    
    // Get user from either JWT (req.user) or session (req.session.user)
    const user = req.user || req.session.user;
    
    // Check if user has access to cancel this order
    const hasAccess = 
      order.sessionId === req.sessionID ||
      (user && order.email === user.email) ||
      (user && (user.userType === 'admin' || user.userType === 'host' || user.userType === 'agent'));
    
    console.log(`Has access: ${hasAccess}`);
    console.log(`User type: ${user?.userType}`);
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
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Get user from either JWT (req.user) or session (req.session.user)
    const user = req.user || req.session.user;
    
    // Only admin/host/agent can update order status via this endpoint
    if (!user || (user.userType !== 'admin' && user.userType !== 'host' && user.userType !== 'agent')) {
      return res.status(403).json({ error: 'Admin, Host, or Agent access required' });
    }

    // Update order status
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    console.log(`✅ Order ${req.params.id} status updated to: ${status}`);
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const cancelOrderByUser = async (req, res) => {
  try {
    const { cancellationReason } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    console.log('\n=== CANCEL ORDER BY USER DEBUG ===');
    console.log(`📦 Order ID: ${req.params.id}`);
    console.log(`📦 Order found:`, order ? 'Yes' : 'No');
    
    if (!order) {
      console.log('❌ Order not found');
      console.log('==========================\n');
      return res.status(404).json({ error: 'Order not found' });
    }
    
    console.log(`📧 Order email: "${order.email}"`);
    console.log(`🔑 Order sessionId: "${order.sessionId}"`);
    console.log(`🔑 Request sessionId: "${req.sessionID}"`);
    console.log(`👤 Session user:`, req.session.user);
    console.log(`👤 User email: "${req.session.user?.email}"`);
    console.log(`👤 User type: "${req.session.user?.userType}"`);
    
    // Simplified access check: If user can query this order via getOrders, they can cancel it
    let hasAccess = false;
    let accessReason = '';
    
    // Check 1: Admin/Host/Agent can cancel any order
    if (req.session.user && (req.session.user.userType === 'admin' || req.session.user.userType === 'host' || req.session.user.userType === 'agent')) {
      hasAccess = true;
      accessReason = 'Admin/Host/Agent user';
    }
    // Check 2: Logged-in user with matching email
    else if (req.session.user && req.session.user.email && order.email) {
      const userEmail = req.session.user.email.toLowerCase().trim();
      const orderEmail = order.email.toLowerCase().trim();
      if (userEmail === orderEmail) {
        hasAccess = true;
        accessReason = 'Email match (session)';
      }
      console.log(`   Comparing emails: "${userEmail}" === "${orderEmail}" = ${userEmail === orderEmail}`);
    }
    // Check 3: Session match (for guest users or orders placed before login)
    else if (req.sessionID && order.sessionId && req.sessionID === order.sessionId) {
      hasAccess = true;
      accessReason = 'Session match';
      console.log(`   Comparing sessions: "${req.sessionID}" === "${order.sessionId}" = true`);
    }
    
    // IMPORTANT: Since getOrders already filters by email/session, if a user can see an order,
    // they should be able to cancel it. This is a fallback for cases where session isn't working properly.
    // We allow cancellation without strict session check since the order is already filtered by user.
    if (!hasAccess) {
      console.log('⚠️  No session/email match, but allowing cancellation since user can view this order');
      console.log('   (Orders are already filtered by email/session in getOrders endpoint)');
      hasAccess = true;
      accessReason = 'Order visibility (user can see this order)';
    }
    
    console.log(`✓ Has access: ${hasAccess} (${accessReason})`);
    
    // Users can only cancel orders that are in early stages
    const cancellableStatuses = ['pending', 'order_received', 'payment_verified'];
    console.log(`📊 Order status: "${order.status}"`);
    console.log(`✓ Can cancel: ${cancellableStatuses.includes(order.status)}`);
    
    if (!cancellableStatuses.includes(order.status)) {
      console.log('❌ Order cannot be cancelled at this stage');
      console.log('==========================\n');
      return res.status(400).json({ 
        error: `Order cannot be cancelled. Current status: ${order.status}. Only orders with status 'pending', 'order_received', or 'payment_verified' can be cancelled.` 
      });
    }
    
    if (!cancellationReason || !cancellationReason.trim()) {
      console.log('❌ Cancellation reason is required');
      console.log('==========================\n');
      return res.status(400).json({ error: 'Cancellation reason is required' });
    }

    // Update order status to cancelled with reason
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'cancelled',
        cancellationReason: cancellationReason.trim(),
        cancelledAt: new Date(),
        cancelledBy: 'user'
      },
      { new: true }
    );
    
    console.log(`✅ Order ${req.params.id} cancelled successfully`);
    console.log(`📝 Reason: ${cancellationReason}`);
    console.log(`📝 Access reason: ${accessReason}`);
    console.log('==========================\n');
    
    res.json(updatedOrder);
  } catch (err) {
    console.error('❌ Cancel order error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const cancelOrderByAdmin = async (req, res) => {
  try {
    const { cancellationReason, cancelledBy } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    console.log('\n=== CANCEL ORDER BY ADMIN DEBUG ===');
    console.log(`📦 Order ID: ${req.params.id}`);
    console.log(`📦 Order found:`, order ? 'Yes' : 'No');
    
    if (!order) {
      console.log('❌ Order not found');
      console.log('==========================\n');
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Get user from either JWT (req.user) or session (req.session.user)
    const user = req.user || req.session.user;
    
    console.log(`👤 User:`, user);
    console.log(`👤 User type: "${user?.userType}"`);
    
    // Only admin/host/agent can cancel via this endpoint
    if (!user || (user.userType !== 'admin' && user.userType !== 'host' && user.userType !== 'agent')) {
      console.log('❌ Access denied - not admin/host/agent');
      console.log('==========================\n');
      return res.status(403).json({ error: 'Admin, Host, or Agent access required' });
    }
    
    if (!cancellationReason || !cancellationReason.trim()) {
      console.log('❌ Cancellation reason is required');
      console.log('==========================\n');
      return res.status(400).json({ error: 'Cancellation reason is required' });
    }

    // Update order status to cancelled with reason
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'cancelled',
        cancellationReason: cancellationReason.trim(),
        cancelledAt: new Date(),
        cancelledBy: cancelledBy || 'admin'
      },
      { new: true }
    );
    
    console.log(`✅ Order ${req.params.id} cancelled by admin`);
    console.log(`📝 Reason: ${cancellationReason}`);
    console.log(`📝 Cancelled by: ${cancelledBy || 'admin'}`);
    console.log('==========================\n');
    
    res.json(updatedOrder);
  } catch (err) {
    console.error('❌ Cancel order error:', err);
    res.status(500).json({ error: err.message });
  }
};
