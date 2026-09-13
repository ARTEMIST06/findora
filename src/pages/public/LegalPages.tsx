import React, { useState } from 'react';
import { ShieldCheck, Mail, CheckCircle2, Send, HelpCircle, FileText, Globe } from 'lucide-react';
import { useToast } from '../../components/common/Toast';

interface LegalPageProps {
  page: 'about' | 'contact' | 'privacy' | 'terms' | 'affiliate-disclosure';
  onNavigate: (route: string) => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ page, onNavigate }) => {
  const { showToast } = useToast();
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactEmail && contactMessage) {
      setIsSubmitted(true);
      showToast('Thank you! Your message has been sent to the Findora team.', 'success');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* About Page */}
      {page === 'about' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 space-y-8 shadow-xs">
          <div className="border-b border-slate-100 pb-6">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">About Findora</span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Find it. Compare it. Buy smarter.
            </h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Findora is an independent consumer technology intelligence and price comparison platform built to empower Indian shoppers to make fully informed, cost-effective buying choices.
            </p>
          </div>

          <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Our Mission</h3>
            <p>
              In today's fragmented online marketplace, identical tech products are sold simultaneously across Amazon, Flipkart, Croma, Reliance Digital, and brand stores at widely fluctuating prices. Consumers waste hours comparing deals across multiple tabs, or worse, miss out on thousands of rupees in bank discounts and limited-time price drops.
            </p>
            <p>
              Findora solves this by aggregating authentic prices, identifying true historical price drops, and presenting objective hardware comparisons without artificial sponsored clutter.
            </p>

            <h3 className="text-lg font-bold text-slate-900 mt-6">How We Ensure Unbiased Comparison</h3>
            <p>
              Our editorial picks and "Why Findora Picked It" verdicts are crafted independently. We clearly point out shortcomings alongside standout advantages so you never experience buyer remorse.
            </p>
          </div>
        </div>
      )}

      {/* Affiliate Disclosure Page */}
      {page === 'affiliate-disclosure' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 space-y-6 shadow-xs">
          <div className="border-b border-slate-100 pb-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              <ShieldCheck className="w-4 h-4" />
              <span>FTC & Consumer Protection Compliance</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Affiliate Disclosure
            </h1>
            <p className="text-xs text-slate-500 mt-1">Last Updated: September 2026</p>
          </div>

          <div className="text-sm text-slate-700 leading-relaxed space-y-4">
            <p>
              Transparency is our core foundation at <strong>Findora</strong>. We believe you should always know how this platform is maintained, operated, and monetized.
            </p>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-medium">
              Findora is a participant in merchant affiliate programs, including the <strong>Amazon Associates Program</strong>, <strong>Flipkart Affiliate Program</strong>, and direct retail partnerships with Croma and Reliance Digital.
            </div>
            <h3 className="text-base font-bold text-slate-900 pt-2">What Does This Mean For You?</h3>
            <p>
              When you click on a store offer button (such as "Check Price" or "Check Deal") on Findora, you are redirected to the merchant website using a special referral tracking link. If you decide to make a purchase, Findora may receive a small percentage commission from the retailer.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Zero Added Cost to You:</strong> You pay the exact same price (or lower, if applying verified coupon codes) as you would by going directly to the merchant.</li>
              <li><strong>Editorial Independence:</strong> Our rankings, product ratings, and price comparison displays are dictated strictly by objective market data, not by which retailer pays the highest commission.</li>
              <li><strong>No Artificial Bias:</strong> We list merchants regardless of whether they offer an active affiliate program whenever their price is the genuine lowest option for our users.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Contact Page */}
      {page === 'contact' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 space-y-6 shadow-xs">
          <div className="border-b border-slate-100 pb-6">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Get in touch</span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Contact Findora</h1>
            <p className="text-sm text-slate-500 mt-1">
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
                    placeholder="Arya Singh"
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
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Legal</span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Privacy Policy
            </h1>
            <p className="text-xs text-slate-500 mt-1">Effective Date: September 2026</p>
          </div>
          <div className="text-sm text-slate-700 leading-relaxed space-y-3">
            <p>
              Findora ("we", "us", or "our") respects your privacy. This policy outlines how information is collected, stored, and protected when you use the Findora discovery engine.
            </p>
            <h4 className="font-bold text-slate-900 pt-2">1. Information We Collect</h4>
            <p>
              We only collect information necessary to personalize your shopping experience, such as saved wishlist items, active product comparisons, and anonymized referral click counters. We do not sell your personal data.
            </p>
            <h4 className="font-bold text-slate-900 pt-2">2. Outbound Links</h4>
            <p>
              Findora links to external third-party merchant platforms. We recommend checking each merchant's respective privacy policy before conducting financial transactions.
            </p>
          </div>
        </div>
      )}

      {/* Terms and Conditions */}
      {page === 'terms' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 space-y-6 shadow-xs">
          <div className="border-b border-slate-100 pb-6">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Terms</span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Terms & Conditions
            </h1>
            <p className="text-xs text-slate-500 mt-1">Effective Date: September 2026</p>
          </div>
          <div className="text-sm text-slate-700 leading-relaxed space-y-3">
            <p>
              By accessing Findora, you agree to these Terms and Conditions. Findora is a price comparison and discovery tool and is not the direct merchant or seller of items listed on third-party stores.
            </p>
            <h4 className="font-bold text-slate-900 pt-2">Pricing Accuracy</h4>
            <p>
              While Findora makes every reasonable effort to keep merchant pricing updated in near real-time, prices, promotional vouchers, and inventory availability are controlled directly by merchants and are subject to immediate change without notice.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
