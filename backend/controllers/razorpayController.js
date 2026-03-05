import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay Order
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    console.log('\n=== CREATE RAZORPAY ORDER ===');
    console.log('💰 Amount:', amount);
    console.log('💱 Currency:', currency);
    console.log('🧾 Receipt:', receipt);

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Amount in paise (multiply by 100)
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1, // Auto capture payment
    };

    const order = await razorpay.orders.create(options);

    console.log('✅ Razorpay order created successfully!');
    console.log('   - Order ID:', order.id);
    console.log('   - Amount:', order.amount / 100, currency);
    console.log('==========================\n');

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
      key: process.env.RAZORPAY_KEY_ID, // Send key to frontend
    });
  } catch (error) {
    console.error('❌ Razorpay order creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create Razorpay order',
    });
  }
};

// Verify Razorpay Payment Signature
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    console.log('\n=== VERIFY RAZORPAY PAYMENT ===');
    console.log('🔐 Order ID:', razorpay_order_id);
    console.log('💳 Payment ID:', razorpay_payment_id);
    console.log('✍️  Signature:', razorpay_signature);

    // Create signature verification string
    const sign = razorpay_order_id + '|' + razorpay_payment_id;

    // Generate expected signature
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    console.log('🔍 Expected signature:', expectedSign);
    console.log('🔍 Received signature:', razorpay_signature);

    // Verify signature
    if (razorpay_signature === expectedSign) {
      console.log('✅ Payment signature verified successfully!');
      console.log('==========================\n');

      res.json({
        success: true,
        message: 'Payment verified successfully',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    } else {
      console.log('❌ Payment signature verification failed!');
      console.log('==========================\n');

      res.status(400).json({
        success: false,
        error: 'Invalid payment signature',
      });
    }
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Payment verification failed',
    });
  }
};

// Get Payment Details
export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    console.log('\n=== GET PAYMENT DETAILS ===');
    console.log('💳 Payment ID:', paymentId);

    const payment = await razorpay.payments.fetch(paymentId);

    console.log('✅ Payment details fetched successfully!');
    console.log('   - Status:', payment.status);
    console.log('   - Amount:', payment.amount / 100);
    console.log('   - Method:', payment.method);
    console.log('==========================\n');

    res.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        createdAt: payment.created_at,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch payment details',
    });
  }
};
