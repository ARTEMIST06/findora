import React, { useState } from 'react';
import { Mail, CheckCircle2, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { useToast } from './Toast';

interface FooterProps {
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { showToast } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setSubscribed(true);
      showToast('Thank you for subscribing to Findora deal alerts!', 'success');
      setEmail('');
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Logo variant="light" size="lg" showTagline={true} onClick={() => onNavigate('/')} />
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm pt-2">
              Findora is India's premier intelligent product discovery and multi-store price comparison
              engine. We track pricing across Amazon, Flipkart, Croma, Reliance Digital, and top retailers to guarantee you never overpay.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Unbiased Price Tracking • Zero Added Markup</span>
            </div>
          </div>

          {/* Column 1: Discovery */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Discovery</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('/products')}
                  className="hover:text-white transition-colors"
                >
                  All Products
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/deals')}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span className="text-amber-400">🔥</span>
                  <span>Price Drop Deals</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/categories')}
                  className="hover:text-white transition-colors"
                >
                  Categories
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/compare')}
                  className="hover:text-white transition-colors"
                >
                  Compare Products
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/wishlist')}
                  className="hover:text-white transition-colors"
                >
                  Saved Wishlist
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Legal & Trust */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Company & Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('/about')}
                  className="hover:text-white transition-colors"
                >
                  About Findora
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/affiliate-disclosure')}
                  className="hover:text-white transition-colors text-blue-400 font-medium"
                >
                  Affiliate Disclosure
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/privacy')}
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/terms')}
                  className="hover:text-white transition-colors"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/contact')}
                  className="hover:text-white transition-colors"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/admin')}
                  className="hover:text-white transition-colors text-xs text-indigo-400 pt-1 block"
                >
                  Admin & Editor Portal →
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Newsletter Alert */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Deal Alerts</h4>
            <p className="text-xs text-slate-400">
              Get notified when flagship smartphones, laptops, and audio gadgets hit their all-time lowest prices.
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800 p-3 rounded-xl">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>You are subscribed to Findora alerts!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Subscribe Alerts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Affiliate Disclosure Compliance Box */}
        <div className="my-8 p-4 rounded-xl bg-slate-900/90 border border-slate-800/90 text-xs text-slate-400 leading-relaxed">
          <p className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
            Findora Transparent Affiliate Disclosure:
          </p>
          Findora is a free, independent product discovery and price comparison platform. When you click on links to merchants (including Amazon India, Flipkart, Croma, Reliance Digital, and others) and make a qualifying purchase, Findora may earn an affiliate commission at zero additional cost to you. Store prices, availability, and promotional coupons are updated continuously by our editorial team and merchant data connectors. All product ratings, benchmarks, and "Why Findora Picked It" analyses represent independent editorial verdicts.
        </div>

        {/* Bottom copyright & attribution */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Findora Inc. All rights reserved. Registered trademark.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Made for smart shoppers</span>
            <span>•</span>
            <button onClick={() => onNavigate('/affiliate-disclosure')} className="hover:text-slate-300">
              FTC Compliance
            </button>
            <span>•</span>
            <button onClick={() => onNavigate('/privacy')} className="hover:text-slate-300">
              Privacy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
