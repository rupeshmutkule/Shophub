import React from 'react';

function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-10 text-white text-center">
          <h1 className="text-4xl font-bold mb-2">Terms and Conditions</h1>
          <p className="text-blue-100">Last Updated: January 2026</p>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 space-y-8 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p>
              Welcome to ShopHub. By accessing our website and using our services, you agree to be bound by the following terms and conditions. Please read them carefully before making a purchase or using our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Account Registration</h2>
            <p className="mb-2">
              To access certain features of the site, you may be required to create an account. You agree to:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide accurate, current, and complete information during registration.</li>
              <li>Maintain the security of your password and accept all risks of unauthorized access to your account.</li>
              <li>Notify us immediately if you discover any security breaches regarding your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Products and Pricing</h2>
            <p>
              We strive to display our products as accurately as possible. However, we cannot guarantee that the colors, details, or other content on the site are completely accurate, reliable, or error-free. Prices are subject to change without notice. We reserve the right to modify or discontinue any product at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Orders and Payments</h2>
            <p>
              By placing an order, you represent that you are authorized to use the chosen payment method. We reserve the right to refuse or cancel any order for any reason, including limitations on quantities available for purchase, inaccuracies, or errors in product or pricing information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Shipping and Returns</h2>
            <p>
              Shipping times are estimates and are not guaranteed. Risk of loss and title for items purchased pass to you upon delivery of the items to the carrier. Returns are subject to our Return Policy, which allows for returns within 30 days of purchase for a full refund, provided items are in original condition.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>
            <p>
              All content included on this site, such as text, graphics, logos, images, and software, is the property of ShopHub or its content suppliers and protected by international copyright laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h2>
            <p>
              ShopHub shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or use of, or inability to access or use, the services or any content on the services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact Information</h2>
            <p>
              Questions about the Terms of Service should be sent to us at <a href="mailto:support@shophub.com" className="text-blue-600 hover:underline">support@shophub.com</a> or via our Contact page.
            </p>
          </section>

          <div className="pt-8 border-t border-gray-100 text-center">
            <p className="text-gray-500 text-sm">
              &copy; 2026 ShopHub. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Terms;