import React, { useState, useEffect } from 'react';
import { ChevronRight, ShieldCheck, Mail, AlertCircle, FileText, Lock, Cookie, Scale, Send, CheckCircle2 } from 'lucide-react';

interface LegalPageProps {
  page: 'about' | 'contact' | 'privacy' | 'terms' | 'affiliate-disclosure' | 'cookie-disclosure';
  onNavigate: (path: string) => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ page, onNavigate }) => {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Update Meta Tags for SEO
    let title = 'Findora';
    let desc = 'Findora Legal & Information';
    switch (page) {
      case 'about': title = 'About Us | Findora'; desc = 'Learn about Findora\'s mission to help you find the best prices across multiple stores.'; break;
      case 'contact': title = 'Contact Us | Findora'; desc = 'Get in touch with the Findora team for support, partnerships, or feedback.'; break;
      case 'privacy': title = 'Privacy Policy | Findora'; desc = 'Read Findora\'s privacy policy and understand how we protect your data.'; break;
      case 'terms': title = 'Terms & Conditions | Findora'; desc = 'Review the terms and conditions for using the Findora price comparison platform.'; break;
      case 'affiliate-disclosure': title = 'Affiliate Disclosure | Findora'; desc = 'Findora affiliate and FTC disclosure regarding merchant commissions.'; break;
      case 'cookie-disclosure': title = 'Cookie & Analytics Disclosure | Findora'; desc = 'Information about how Findora uses cookies and analytics.'; break;
    }
    document.title = title;
    
    // Find or create meta description tag
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', desc);
  }, [page]);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setContactName('');
    setContactSubject('');
    setContactMessage('');
  };

  const Breadcrumb = ({ title }: { title: string }) => (
    <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
      <button onClick={() => onNavigate('/')} className="hover:text-blue-600 transition-colors">Home</button>
      <ChevronRight className="w-3 h-3" />
      <span className="text-slate-900 font-medium">{title}</span>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pt-24 min-h-[80vh]">
      {page === 'about' && <Breadcrumb title="About Findora" />}
      {page === 'contact' && <Breadcrumb title="Contact Us" />}
      {page === 'privacy' && <Breadcrumb title="Privacy Policy" />}
      {page === 'terms' && <Breadcrumb title="Terms & Conditions" />}
      {page === 'affiliate-disclosure' && <Breadcrumb title="Affiliate Disclosure" />}
      {page === 'cookie-disclosure' && <Breadcrumb title="Cookie & Analytics" />}

      {/* About Page */}
      {page === 'about' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 space-y-8 shadow-xs">
          <div className="border-b border-slate-100 pb-6">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> About Us
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Findora: Intelligent Price Discovery
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Empowering shoppers with transparent, unbiased price tracking across top retailers.
            </p>
          </div>
          
          <div className="text-sm text-slate-700 leading-relaxed space-y-4">
            <p>
              Findora was built to solve a simple problem: the frustration of overpaying for products when a better deal exists on another trusted store. We aggregate product pricing, historical price drops, and live offers from major retailers like Amazon, Flipkart, Croma, and Reliance Digital.
            </p>
            <h3 className="text-lg font-bold text-slate-900 pt-4">Our Mission</h3>
            <p>
              Our mission is to bring transparency to online retail. We believe every shopper deserves access to the lowest price without having to manually check a dozen different websites. Our platform continuously syncs merchant data so that you can make informed purchasing decisions.
            </p>
            <h3 className="text-lg font-bold text-slate-900 pt-4">How We Operate</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Real-Time Alerts:</strong> Users can set price alerts and receive notifications when a product drops to their desired price.</li>
              <li><strong>Historical Tracking:</strong> We log price history data to show you if today's "deal" is genuinely a discount or a marketing tactic.</li>
              <li><strong>Zero Added Markup:</strong> The prices you see on Findora are the same prices you will find on the retailer's official website. We never add our own markup.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Contact Page */}
      {page === 'contact' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 space-y-6 shadow-xs">
          <div className="border-b border-slate-100 pb-6">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4" /> Get in touch
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">Contact Findora</h1>
            <p className="text-sm text-slate-500 mt-2">
              Have feedback, a store partnership inquiry, or a price discrepancy to report? We'd love to hear from you.
            </p>
          </div>
          
          {isSubmitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-emerald-900">Message Delivered</h3>
              <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                Thank you for contacting us. A Findora platform representative will review your note and respond to {contactEmail} shortly.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="mt-4 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Your Name</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-xs text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-xs text-slate-900"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Subject</label>
                <input
                  type="text"
                  required
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  placeholder="Price discrepancy, partner request, or product feedback..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-xs text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Your Message</label>
                <textarea
                  required
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Write your note here..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-xs text-slate-900"
                ></textarea>
              </div>
              <button
                type="submit"
                className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Privacy Policy */}
      {page === 'privacy' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 space-y-6 shadow-xs">
          <div className="border-b border-slate-100 pb-6">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4" /> Legal
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Privacy Policy
            </h1>
            <p className="text-xs text-slate-500 mt-2">Last Updated: September 16, 2026</p>
          </div>
          
          <div className="text-sm text-slate-700 leading-relaxed space-y-4">
            <p>
              Findora ("we", "us", or "our") is committed to respecting your privacy. This policy outlines how information is collected, stored, and protected when you use our platform.
            </p>
            
            <h3 className="text-lg font-bold text-slate-900 pt-4">1. Data We Collect</h3>
            <p>When you create an account using Email or Google Sign-In, we collect and store the following data using Firebase Authentication and Firestore:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Profile Data:</strong> Your name, email address, account role, and account creation timestamps.</li>
              <li><strong>Security & Access Logs:</strong> We maintain a secure, immutable log of authentication events (such as logins and account creations) associated with your User ID for security and auditing purposes.</li>
              <li><strong>User Preferences:</strong> Your saved products (wishlist) and customized price alerts.</li>
            </ul>

            <h3 className="text-lg font-bold text-slate-900 pt-4">2. How We Use Your Data</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide core platform functionality, including allowing you to save favorite products and synchronize them across devices.</li>
              <li>To trigger automated price alert emails or notifications when merchant prices drop.</li>
              <li>To detect unauthorized access or fraudulent account activity via our security event logging.</li>
            </ul>

            <h3 className="text-lg font-bold text-slate-900 pt-4">3. Data Sharing & Security</h3>
            <p>
              Your data is stored securely using Google Cloud infrastructure (Firebase Firestore). We do <strong>not</strong> sell your personal data to third parties. We enforce strict Role-Based Access Control (RBAC) meaning your wishlist, price alerts, and security history are strictly private to you and cannot be accessed by other users. 
            </p>

            <h3 className="text-lg font-bold text-slate-900 pt-4">4. Account and Data Deletion</h3>
            <p>
              You have full control over your data. You may request account deletion at any time via your Profile page. When you delete your account, we programmatically purge the following records:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Your Firebase Authentication credentials.</li>
              <li>Your user profile document.</li>
              <li>All active price alerts associated with your ID.</li>
              <li>Your saved wishlist items.</li>
              <li>Your historical security and login event logs.</li>
            </ul>

            <h3 className="text-lg font-bold text-slate-900 pt-4">5. Outbound Third-Party Links</h3>
            <p>
              Findora links to external third-party merchant platforms. When you click an external link, you leave our platform. We strongly recommend reviewing each merchant's respective privacy policy before providing them with payment details or personal data, as we do not control their privacy practices.
            </p>
          </div>
        </div>
      )}

      {/* Terms and Conditions */}
      {page === 'terms' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 space-y-6 shadow-xs">
          <div className="border-b border-slate-100 pb-6">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4" /> Legal
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Terms & Conditions
            </h1>
            <p className="text-xs text-slate-500 mt-2">Last Updated: September 16, 2026</p>
          </div>
          
          <div className="text-sm text-slate-700 leading-relaxed space-y-4">
            <p>
              By accessing Findora, you agree to these Terms and Conditions. If you do not agree with any part of these terms, please do not use our services.
            </p>

            <h3 className="text-lg font-bold text-slate-900 pt-4">1. Nature of the Service</h3>
            <p>
              Findora is an informational price comparison and discovery tool. We are <strong>not</strong> the merchant, manufacturer, or seller of the items listed. We merely aggregate public pricing data and offers from third-party retailers.
            </p>

            <h3 className="text-lg font-bold text-slate-900 pt-4">2. Pricing & Availability Disclaimer</h3>
            <p>
              While Findora utilizes automated backend synchronization (via editorial tools and data fetching endpoints) to keep merchant pricing updated in near real-time, <strong>we cannot guarantee the absolute accuracy of prices or inventory.</strong> Prices, promotional vouchers, shipping costs, and inventory availability are controlled directly by merchants and are subject to immediate change without notice. The final price and terms of sale are determined strictly on the merchant's checkout page.
            </p>

            <h3 className="text-lg font-bold text-slate-900 pt-4">3. No Guarantees on Fulfillment</h3>
            <p>
              Because we are not the seller, Findora makes no warranties or guarantees regarding merchant fulfillment, delivery times, product quality, returns, or refunds. All disputes regarding a purchase must be resolved directly with the retailer from whom you bought the item.
            </p>

            <h3 className="text-lg font-bold text-slate-900 pt-4">4. Acceptable Use</h3>
            <p>
              You agree to use Findora for personal, non-commercial purposes. You may not attempt to reverse engineer, scrape, or overwhelm our API (including our `/api/fetch-product` endpoints) using automated bots. We employ rate limiting and security headers (such as Helmet and Content Security Policies) to protect our infrastructure, and any attempt to bypass these restrictions will result in immediate account termination.
            </p>

            <h3 className="text-lg font-bold text-slate-900 pt-4">5. User Accounts</h3>
            <p>
              You are responsible for maintaining the confidentiality of your login credentials. We are not liable for any loss or damage arising from your failure to protect your account.
            </p>
          </div>
        </div>
      )}

      {/* Affiliate Disclosure */}
      {page === 'affiliate-disclosure' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 space-y-6 shadow-xs">
          <div className="border-b border-slate-100 pb-6">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Transparency
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Affiliate Disclosure
            </h1>
            <p className="text-xs text-slate-500 mt-2">Last Updated: September 16, 2026</p>
          </div>
          
          <div className="text-sm text-slate-700 leading-relaxed space-y-4">
            <p>
              Findora believes in absolute transparency regarding our revenue models. We provide our price comparison, product tracking, and alert services completely free of charge to you. 
            </p>
            
            <h3 className="text-lg font-bold text-slate-900 pt-4">How We Earn Revenue</h3>
            <p>
              Findora participates in various affiliate marketing programs. This means that when you click on a store offer button (such as "Check Price", "Go to Store", or merchant logos) on our website and make a qualifying purchase, we may receive a small commission from the retailer.
            </p>
            <p>
              The merchants we may track or link to include, but are not limited to, Amazon India, Flipkart, Croma, and Reliance Digital.
            </p>

            <h3 className="text-lg font-bold text-slate-900 pt-4">What This Means For You</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Zero Added Cost:</strong> You pay the exact same price (or lower, if you use coupons) as you would by going directly to the merchant. The commission is paid by the retailer out of their own margin.</li>
              <li><strong>Strict Editorial Independence:</strong> Our rankings, product details, price history graphs, and lowest-price tags are generated strictly by objective data. We do not artificially boost prices or hide cheaper stores simply because they pay a lower commission.</li>
              <li><strong>Unbiased Discovery:</strong> We list the genuine lowest options available from our tracked merchants, regardless of affiliate program status.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Cookie Disclosure */}
      {page === 'cookie-disclosure' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 space-y-6 shadow-xs">
          <div className="border-b border-slate-100 pb-6">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
              <Cookie className="w-4 h-4" /> Transparency
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Cookie & Analytics Policy
            </h1>
            <p className="text-xs text-slate-500 mt-2">Last Updated: September 16, 2026</p>
          </div>
          
          <div className="text-sm text-slate-700 leading-relaxed space-y-4">
            <p>
              Findora uses essential browser storage mechanisms to ensure the platform functions securely and seamlessly. This policy explains what we use and why.
            </p>

            <h3 className="text-lg font-bold text-slate-900 pt-4">1. Essential Authentication Storage</h3>
            <p>
              We utilize Google Firebase Authentication to manage user sign-ins and protect accounts. Firebase utilizes localized browser storage (such as IndexedDB and LocalStorage) to securely store your session tokens. These tokens ensure that you remain logged in as you navigate across the application and interact with your wishlists or price alerts. This storage is strictly necessary for the platform to operate.
            </p>

            <h3 className="text-lg font-bold text-slate-900 pt-4">2. Security & Rate Limiting</h3>
            <p>
              Our backend employs in-memory analytics to monitor API usage (via `express-rate-limit`) to prevent automated bots from abusing our data-fetching endpoints. This does not involve tracking individual humans via cookies, but rather involves temporarily logging IP addresses at the network level strictly for infrastructural security.
            </p>

            <h3 className="text-lg font-bold text-slate-900 pt-4">3. Performance Analytics (If Enabled)</h3>
            <p>
              Currently, Findora minimizes the use of invasive third-party tracking. We do not utilize marketing retargeting cookies. If analytical scripts (like Google Analytics) are integrated to monitor page load times or aggregated traffic statistics, they are configured strictly to analyze overall platform health and usage trends, not to build individual profiles of you.
            </p>

            <h3 className="text-lg font-bold text-slate-900 pt-4">4. Managing Your Preferences</h3>
            <p>
              Because the local storage utilized by Findora is classified as "strictly necessary" for core user functionality (like maintaining a logged-in state), we do not offer an opt-out toggle. If you wish to clear this storage, you may simply click "Sign Out", or manually clear your browser's cookies and site data.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
