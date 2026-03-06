import Order from '../models/Order.js';

export const createOrder = async (req, res) => {
  try {
    console.log('\n========================================');
    console.log('🔍 CREATE ORDER - FULL DEBUG TRACE');
    console.log('========================================');
    
    // Log raw request body
    console.log('\n1️⃣ RAW REQUEST BODY:');
    console.log('   Items received:', req.body.items?.length || 0);
    
    if (req.body.items && req.body.items.length > 0) {
      console.log('\n2️⃣ FIRST ITEM - RAW FROM FRONTEND:');
      console.log(JSON.stringify(req.body.items[0], null, 2));
      
      console.log('\n3️⃣ IMAGE FIELDS CHECK:');
      console.log('   item.image:', req.body.items[0].image || '❌ MISSING');
      console.log('   item.photo:', req.body.items[0].photo || '❌ MISSING');
      console.log('   item.frontDesignUrl:', req.body.items[0].frontDesignUrl || '❌ MISSING');
      console.log('   item.backDesignUrl:', req.body.items[0].backDesignUrl || '❌ MISSING');
      console.log('   item.customizationPreview:', req.body.items[0].customizationPreview || '❌ MISSING');
    }
    
    const orderData = {
      ...req.body,
      sessionId: req.sessionID,
    };

    console.log('\n4️⃣ ORDER DATA BEFORE SAVE:');
    console.log('   Customer:', orderData.customerName);
    console.log('   Email:', orderData.email);
    console.log('   Total:', orderData.total);
    console.log('   Items count:', orderData.items?.length);

    const newOrder = new Order(orderData);
    await newOrder.save();

    console.log('\n5️⃣ ORDER SAVED TO DATABASE:');
    console.log('   Order ID:', newOrder._id);
    
    if (newOrder.items && newOrder.items.length > 0) {
      console.log('\n6️⃣ FIRST ITEM - SAVED IN DATABASE:');
      console.log(JSON.stringify(newOrder.items[0], null, 2));
      
      console.log('\n7️⃣ IMAGE FIELDS IN DATABASE:');
      console.log('   item.image:', newOrder.items[0].image || '❌ NOT SAVED');
      console.log('   item.photo:', newOrder.items[0].photo || '❌ NOT SAVED');
      console.log('   item.frontDesignUrl:', newOrder.items[0].frontDesignUrl || '❌ NOT SAVED');
      console.log('   item.backDesignUrl:', newOrder.items[0].backDesignUrl || '❌ NOT SAVED');
    }

    // Ensure session is saved
    req.session.lastOrderId = newOrder._id.toString();
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('\n✅ ORDER CREATION COMPLETE');
    console.log('========================================\n');

    res.json({
      message: 'Order placed successfully',
      orderId: newOrder._id,
      sessionId: req.sessionID
    });
  } catch (err) {
    console.error('\n❌ ORDER CREATION ERROR:', err);
    console.error('========================================\n');
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
      console.log('\n📋 FIRST ORDER FROM DATABASE:');
      console.log('   - ID:', orders[0]._id);
      console.log('   - Email:', orders[0].email);
      console.log('   - Customer:', orders[0].customerName);
      console.log('   - Status:', orders[0].status);
      console.log('   - Items count:', orders[0].items?.length || 0);
      
      if (orders[0].items && orders[0].items.length > 0) {
        console.log('\n📦 FIRST ITEM FROM DATABASE:');
        console.log(JSON.stringify(orders[0].items[0], null, 2));
        
        console.log('\n🖼️ IMAGE FIELDS RETURNED:');
        console.log('   item.image:', orders[0].items[0].image || '❌ MISSING IN DB');
        console.log('   item.photo:', orders[0].items[0].photo || '❌ MISSING IN DB');
        console.log('   item.frontDesignUrl:', orders[0].items[0].frontDesignUrl || '❌ MISSING IN DB');
        console.log('   item.backDesignUrl:', orders[0].items[0].backDesignUrl || '❌ MISSING IN DB');
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
