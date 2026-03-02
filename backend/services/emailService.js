import fetch from 'node-fetch';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || 'noreply@shophub.com';
const FROM_NAME = process.env.EMAIL_APP_NAME || 'ShopHub';

export const sendOTPEmail = async (email, otp, userName) => {
  try {
    console.log('📧 Attempting to send OTP email...');
    console.log(`   To: ${email}`);
    console.log(`   OTP: ${otp}`);
    console.log(`   From: ${FROM_NAME} <${FROM_EMAIL}>`);
    console.log(`   API Key: ${BREVO_API_KEY ? 'Set ✓' : 'Missing ✗'}`);

    if (!BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY is not set in environment variables');
    }

    const payload = {
      sender: {
        name: FROM_NAME,
        email: FROM_EMAIL,
      },
      to: [
        {
          email: email,
          name: userName,
        },
      ],
      subject: 'ShopHub - Email Verification OTP',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🛍️ ShopHub</h1>
              <p>Email Verification</p>
            </div>
            <div class="content">
              <h2>Hello ${userName}!</h2>
              <p>Thank you for registering with ShopHub. To complete your registration, please use the following OTP:</p>
              
              <div class="otp-box">
                <p style="margin: 0; color: #666;">Your OTP Code</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Valid for 10 minutes</p>
              </div>
              
              <p><strong>Important:</strong></p>
              <ul>
                <li>This OTP is valid for 10 minutes only</li>
                <li>Do not share this OTP with anyone</li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
              
              <p>Happy Shopping! 🎉</p>
              <p>- The ShopHub Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; 2024 ShopHub. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    console.log('📤 Sending request to Brevo API...');

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ Brevo API Error:', responseData);
      throw new Error(`Brevo API error (${response.status}): ${JSON.stringify(responseData)}`);
    }

    console.log('✅ Email sent successfully!');
    console.log('   Response:', responseData);

    return { success: true, messageId: responseData.messageId };
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    console.error('   Full error:', error);
    throw error;
  }
};
