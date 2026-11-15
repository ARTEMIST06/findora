import React, { useState, useEffect } from 'react';
import { ChevronRight, ShieldCheck, Mail, AlertCircle, FileText, Lock, Cookie, Scale, Send, CheckCircle2 } from 'lucide-react';
import { SEOHead } from '../../components/common/SEOHead';

interface LegalPageProps {
  page: 'about' | 'contact' | 'privacy' | 'terms' | 'affiliate-disclosure' | 'cookie-disclosure';
  onNavigate: (path: string) => void;
}

const LEGAL_SEO_CONFIG: Record<
  LegalPageProps['page'],
  { title: string; desc: string; canonical: string; breadcrumbTitle: string }
> = {
  about: {
    title: 'About Us | Findora',
    desc: 'Learn what Findora is, who runs it, and how its verified Amazon India listings work.',
    canonical: '/about',
    breadcrumbTitle: 'About Findora',
  },
  contact: {
    title: 'Contact Us | Findora',
    desc: 'Get in touch with the Findora team for support, partnerships, or feedback.',
    canonical: '/contact',
    breadcrumbTitle: 'Contact Us',
  },
  privacy: {
    title: 'Privacy Policy | Findora',
    desc: "Read Findora's privacy policy and understand how we protect your data.",
    canonical: '/privacy',
    breadcrumbTitle: 'Privacy Policy',
  },
  terms: {
    title: 'Terms & Conditions | Findora',
    desc: 'Review the terms and conditions for using the Findora price comparison platform.',
    canonical: '/terms',
    breadcrumbTitle: 'Terms & Conditions',
  },
  'affiliate-disclosure': {
    title: 'Affiliate Disclosure | Findora',
    desc: 'Findora affiliate and FTC disclosure regarding merchant commissions.',
    canonical: '/affiliate-disclosure',
    breadcrumbTitle: 'Affiliate Disclosure',
  },
  'cookie-disclosure': {
    title: 'Cookie & Analytics Disclosure | Findora',
    desc: 'Information about how Findora uses cookies and analytics.',
    canonical: '/cookie-disclosure',
    breadcrumbTitle: 'Cookie & Analytics',
  },
};

export const LegalPage: React.FC<LegalPageProps> = ({ page, onNavigate }) => {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  const seo = LEGAL_SEO_CONFIG[page] || {
    title: 'Information | Findora',
    desc: 'Findora legal documentation and information.',
    canonical: `/${page}`,
    breadcrumbTitle: 'Information',
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setContactName('');
    setContactSubject('');
    setContactMessage('');
  };

  const Breadcrumb = ({ title }: { title: string }) => (
    <div className="flex items-center gap-2 text-xs text-slate-600 mb-6">
      <button onClick={() => onNavigate('/')} className="hover:text-blue-600 transition-colors">Home</button>
      <ChevronRight className="w-3 h-3 text-slate-600" />
      <span className="text-slate-900 font-medium">{title}</span>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pt-24 min-h-[80vh]">
      <SEOHead
        title={seo.title}
        description={seo.desc}
        canonicalPath={seo.canonical}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: seo.breadcrumbTitle, url: seo.canonical }
        ]}
      />
      {page === 'about' && <Breadcrumb title="About Findora" />}
      {page === 'contact' && <Breadcrumb title="Contact Us" />}
      {page === 'privacy' && <Breadcrumb title="Privacy Policy" />}
      {page === 'terms' && <Breadcrumb title="Terms & Conditions" />}
      {page === 'affiliate-disclosure' && <Breadcrumb title="Affiliate Disclosure" />}
      {page === 'cookie-disclosure' && <Breadcrumb title="Cookie & Analytics" />}

      {/* About Page */}
      {page === 'about' && (
        <div className="bg-white/90 rounded-3xl border border-slate-200/80 p-8 sm:p-12 space-y-10 shadow-2xl backdrop-blur-md">
          <div className="border-b border-slate-200 pb-6">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-600" /> About Us
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              Find it. Compare it. Buy smarter.
            </h1>
            <p className="text-sm text-slate-600 mt-2">
              Findora is a product-discovery site for India. We find the best products, verify them on Amazon India, and send you straight there to buy — no store, no checkout, no confusion.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              <span className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">592 verified products</span>
              <span className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">78 categories</span>
              <span className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">1 store: Amazon India</span>
            </div>
          </div>

          <div className="text-sm text-slate-700 leading-relaxed space-y-4">
            <h2 className="text-lg font-bold text-slate-900">What is Findora?</h2>
            <p>
              Findora started in 2026 in India, built around one frustration: choosing the right product online felt like guesswork. Too many listings, too many fake discounts, and no straight answer to a simple question — which one is actually worth buying?
            </p>
            <p>
              So Findora does the searching for you. We research products people actually buy — budget tech, college essentials, home and everyday picks — and list only the ones we could verify on Amazon India, with the price and the date it was last checked.
            </p>
          </div>

          <div className="text-sm text-slate-700 leading-relaxed space-y-4">
            <h2 className="text-lg font-bold text-slate-900">How it works</h2>
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                <p><strong className="text-slate-900">We find it.</strong> We research products people actually buy and list only ones we could verify on Amazon India.</p>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                <p><strong className="text-slate-900">We check it.</strong> Every listing shows its price and the date it was last checked on Amazon India. Prices change often, so we always tell you to verify on Amazon before buying.</p>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                <p><strong className="text-slate-900">You buy it — directly from Amazon.</strong> Tap Check Price and you go to Amazon. Amazon takes your payment, delivers the order, and handles returns. Findora never sells anything and never takes your money.</p>
              </li>
            </ol>
          </div>

          <div className="text-sm text-slate-700 leading-relaxed space-y-4">
            <h2 className="text-lg font-bold text-slate-900">What Findora is not</h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-700">
              <li><strong className="text-slate-900">Not a store.</strong> No cart, no checkout, no inventory — Amazon handles the whole transaction.</li>
              <li><strong className="text-slate-900">No sponsored picks.</strong> We do not take money to rank a product higher.</li>
              <li><strong className="text-slate-900">No fake reviews or invented discounts.</strong> If we could not verify something, we do not show it.</li>
              <li><strong className="text-slate-900">Prices are checked snapshots, not live prices.</strong> The price on Amazon is always the final word — that is why every listing shows when it was last checked.</li>
            </ul>
          </div>

          <div className="text-sm text-slate-700 leading-relaxed space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Who runs Findora</h2>
            <p>
              <strong className="text-slate-900">Arya Singh — Founder &amp; CEO.</strong> Findora is run by Arya Singh, a computer applications (BCA) student at Galgotias University in India. He started Findora because choosing the right product online felt like guesswork — and he wanted a straight answer for himself and for other students and budget buyers.
            </p>
            <p>
              Findora is run entirely by Arya — he handles the research, the catalogue, and the website himself. No investors, no office, no sponsors — just a student building something useful, one verified product at a time.
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-600" />
              <span>Questions, a wrong price, or a product we should list? Write to us at{' '}
                <a href="mailto:findorame@gmail.com" className="text-blue-600 font-bold hover:underline">findorame@gmail.com</a>
              </span>
            </p>
          </div>

          <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <p>
              Findora uses Amazon Associates links. If you buy through a link on this site, Findora may earn a small commission — it costs you nothing extra. Read the full{' '}
              <button onClick={() => onNavigate('/affiliate-disclosure')} className="text-blue-600 font-bold hover:underline">Affiliate Disclosure</button>.
            </p>
          </div>
        </div>
      )}

      {/* Contact Page */}
      {page === 'contact' && (
        <div className="bg-white/90 rounded-3xl border border-slate-200/80 p-8 sm:p-12 space-y-6 shadow-2xl backdrop-blur-md">
          <div className="border-b border-slate-200 pb-6">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-600" /> Get in touch
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">Contact Findora</h1>
            <p className="text-sm text-slate-600 mt-2">
              Have feedback, a store partnership inquiry, or a price discrepancy to report? We'd love to hear from you.
            </p>
          </div>
          
          {isSubmitted ? (
            <div className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-xl font-bold text-slate-900">Message Delivered</h3>
              <p className="text-xs text-slate-700 max-w-sm mx-auto">
                Thank you for contacting us. A Findora platform representative will review your note and respond to {contactEmail} shortly.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Your Name</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 outline-none focus:border-blue-500 text-xs text-slate-900 placeholder-slate-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Email Address</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 outline-none focus:border-blue-500 text-xs text-slate-900 placeholder-slate-400"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Subject</label>
                <input
                  type="text"
                  required
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  placeholder="Price discrepancy, partner request, or product feedback..."
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 outline-none focus:border-blue-500 text-xs text-slate-900 placeholder-slate-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Your Message</label>
                <textarea
                  required
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Write your note here..."
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 outline-none focus:border-blue-500 text-xs text-slate-900 placeholder-slate-400"
                ></textarea>
              </div>
              <button
                type="submit"
                className="py-3 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-full transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Privacy Policy */}
      {page === 'privacy' && (
        <div className="bg-white/90 rounded-3xl border border-slate-200/80 p-8 sm:p-12 space-y-6 shadow-2xl backdrop-blur-md">
          <div className="border-b border-slate-200 pb-6">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-600" /> Legal
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              Privacy Policy
            </h1>
            <p className="text-xs text-slate-600 mt-2">Last Updated: September 16, 2026</p>
          </div>
          
          <div className="text-sm text-slate-700 leading-relaxed space-y-4">
            <p>
              Findora ("we", "us", or "our") is committed to respecting your privacy. This policy outlines how information is collected, stored, and protected when you use our platform.
            </p>
            
            <h3 className="text-lg font-bold text-slate-900 pt-4">1. Data We Collect</h3>
            <p>When you create an account using Email or Google Sign-In, we collect and store the following data using Firebase Authentication and Firestore:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-slate-900">Profile Data:</strong> Your name, email address, account role, and account creation timestamps.</li>
              <li><strong className="text-slate-900">Security & Access Logs:</strong> We maintain a secure, immutable log of authentication events (such as logins and account creations) associated with your User ID for security and auditing purposes.</li>
              <li><strong className="text-slate-900">User Preferences:</strong> Your saved products (wishlist) and customized price alerts.</li>
            </ul>

            <h3 className="text-lg font-bold text-slate-900 pt-4">2. How We Use Your Data</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide core platform functionality, including allowing you to save favorite products and synchronize them across devices.</li>
              <li>To trigger automated price alert emails or notifications when merchant prices drop.</li>
              <li>To detect unauthorized access or fraudulent account activity via our security event logging.</li>
            </ul>

            <h3 className="text-lg font-bold text-slate-900 pt-4">3. Data Sharing & Security</h3>
            <p>
              Your data is stored securely using Google Cloud infrastructure (Firebase Firestore). We do <strong className="text-slate-900">not</strong> sell your personal data to third parties. We enforce strict Role-Based Access Control (RBAC) meaning your wishlist, price alerts, and security history are strictly private to you and cannot be accessed by other users. 
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
        <div className="bg-white/90 rounded-3xl border border-slate-200/80 p-8 sm:p-12 space-y-6 shadow-2xl backdrop-blur-md">
          <div className="border-b border-slate-200 pb-6">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
              <Scale className="w-4 h-4 text-cyan-600" /> Legal
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              Terms & Conditions
            </h1>
            <p className="text-xs text-slate-600 mt-2">Last Updated: September 16, 2026</p>
          </div>
          
          <div className="text-sm text-slate-700 leading-relaxed space-y-4">
            <p>
              By accessing Findora, you agree to these Terms and Conditions. If you do not agree with any part of these terms, please do not use our services.
            </p>

            <h3 className="text-lg font-bold text-slate-900 pt-4">1. Nature of the Service</h3>
            <p>
              Findora is an informational price comparison and discovery tool. We are <strong className="text-slate-900">not</strong> the merchant, manufacturer, or seller of the items listed. We merely aggregate public pricing data and offers from third-party retailers.
            </p>

            <h3 className="text-lg font-bold text-slate-900 pt-4">2. Pricing & Availability Disclaimer</h3>
            <p>
              While Findora utilizes automated backend synchronization (via editorial tools and data fetching endpoints) to keep merchant pricing updated in near real-time, <strong className="text-slate-900">we cannot guarantee the absolute accuracy of prices or inventory.</strong> Prices, promotional vouchers, shipping costs, and inventory availability are controlled directly by merchants and are subject to immediate change without notice. The final price and terms of sale are determined strictly on the merchant's checkout page.
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
        <div className="bg-white/90 rounded-3xl border border-slate-200/80 p-8 sm:p-12 space-y-6 shadow-2xl backdrop-blur-md">
          <div className="border-b border-slate-200 pb-6">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-cyan-600" /> Transparency
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              Affiliate Disclosure
            </h1>
            <p className="text-xs text-slate-600 mt-2">Last Updated: September 16, 2026</p>
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
              Currently, Findora links only to Amazon India. Other merchants will be listed here only if and when we start tracking them.
            </p>

            <h3 className="text-lg font-bold text-slate-900 pt-4">What This Means For You</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-slate-900">Zero Added Cost:</strong> You pay the exact same price (or lower, if you use coupons) as you would by going directly to the merchant. The commission is paid by the retailer out of their own margin.</li>
              <li><strong className="text-slate-900">Strict Editorial Independence:</strong> Our rankings, product details, price history graphs, and lowest-price tags are generated strictly by objective data. We do not artificially boost prices or hide cheaper stores simply because they pay a lower commission.</li>
              <li><strong className="text-slate-900">Unbiased Discovery:</strong> We list the genuine lowest options available from our tracked merchants, regardless of affiliate program status.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Cookie Disclosure */}
      {page === 'cookie-disclosure' && (
        <div className="bg-white/90 rounded-3xl border border-slate-200/80 p-8 sm:p-12 space-y-6 shadow-2xl backdrop-blur-md">
          <div className="border-b border-slate-200 pb-6">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
              <Cookie className="w-4 h-4 text-cyan-600" /> Transparency
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              Cookie & Analytics Policy
            </h1>
            <p className="text-xs text-slate-600 mt-2">Last Updated: September 16, 2026</p>
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
